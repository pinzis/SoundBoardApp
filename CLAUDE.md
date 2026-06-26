# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm start          # Run in development (Electron)
npm run build      # Build Win x64 NSIS installer → dist/ (no publish)
npm run release    # Build + publish installer & latest.yml to GitHub releases
node --check main.js preload.js renderer/app.js   # Syntax check without running
```

No linter or test suite is configured.

### Releasing an update

1. Bump `version` in `package.json`.
2. Export a GitHub token with `repo` scope: `set GH_TOKEN=...` (Windows cmd) / `$env:GH_TOKEN="..."` (PowerShell).
3. `npm run release` — `electron-builder` uploads the NSIS installer + `latest.yml` to the `pinzis/SoundBoardApp` GitHub release.
4. Installed clients auto-check on launch (`autoUpdater` in `main.js`), download in background, and prompt to restart+install.

`publish` config (provider github, owner `pinzis`, repo `SoundBoardApp`) lives in `package.json` → `build`. The Windows target is `nsis` (required for `electron-updater` auto-install; `portable` does not support it). The app is unsigned, so SmartScreen may warn on first run.

## Architecture

Three-process Electron app with a custom `media://` protocol for local audio.

**`main.js`** — Main process. Registers `media://app/<encoded-path>` → local file via `protocol.handle()` + `net.fetch(pathToFileURL(...))`. IPC handlers: `select-file` (dialog), `save-sound-file` (copies audio to `userData/sounds/`), `save-config`/`load-config` (JSON at `userData/config.json`), `register-shortcut`/`unregister-shortcut`/`unregister-all-shortcuts` (Electron `globalShortcut`). Shortcuts send `trigger-sound` events back to the renderer; stolen shortcuts send `shortcut-stolen`. Auto-update via `electron-updater` (`setupAutoUpdater()`): checks on launch when `app.isPackaged`, forwards `update-status` events to the renderer, and exposes `get-app-version`/`check-for-updates`/`install-update` (the last calls `autoUpdater.quitAndInstall()`).

**`preload.js`** — Exposes `window.electronAPI` via `contextBridge` (contextIsolation is on, nodeIntegration is off). All IPC is routed through this bridge.

**`renderer/`** — Pure web app (HTML + CSS + vanilla JS, no bundler):
- `index.html`: Aurora design system — animated blob background, header with device status chips, sidebar (search + categories), main pad grid, now-playing bar with canvas visualizer, sound modal, settings modal, toast host.
- `style.css`: oklch color tokens (`--aurora-violet`, `--aurora-magenta`, etc.), glassmorphism utilities (`.glass`, `.glass-strong`), blob animations, all component styles.
- `app.js`: All application logic. Key subsystems:

| Subsystem | Details |
|---|---|
| **Audio engine** | Two `AudioContext`s: `playbackContext` (output device) + `monitorContext` (monitor/VB-Cable). `setSinkId()` called separately after construction to avoid constructor throws. |
| **Mic FX engine** | `buildEffectGraph(ctx, input, type, intensity)` builds a per-context preset chain (girl/mask/underwater/robot/echo/phone) + limiter, returning `{ output, teardown }`. Two contexts share one `micStream`: `micContext` (cable → `playbackDeviceId`, heard by other apps) and the opt-in `micMonitorContext` (self-monitor → `monitorDeviceId`, `settings.micEffect.selfMonitor`). `rebuildMicGraphs()` rebuilds both on preset/intensity change. |
| **Auto-update** | `initUpdater()` wires the settings-modal UI to `electronAPI` update events; on `update-downloaded` it prompts to restart+install. |
| **Buffer cache** | `audioBufferCache: Map<filePath, AudioBuffer>`. Files fetched via `media://app/<encodeURIComponent(path)>` then decoded with `playbackContext.decodeAudioData()`. |
| **Active sounds** | `activePlayingSounds: Map<soundId, {sourcePlay, gainPlay, sourceMon, gainMon, intervalId, startTime, duration}>`. |
| **Visualizer** | Canvas analyser loop on `playbackAnalyser`. Aurora gradient bars when playing, dim white bars when idle. |
| **Hotkey recorder** | Global `keydown` listener captures modifier+key combos; registers via `electronAPI.registerShortcut`. |
| **Persistence** | `loadAppData()`/`saveAppData()` — serializes `{ sounds, settings }` via `electronAPI.saveConfig/loadConfig`. |

## Audio Routing

- **Playback**: `playbackContext` → `playbackAnalyser` → `AudioContext.destination` (routed to `settings.playbackDeviceId` via `setSinkId`).
- **Monitor**: `monitorContext` → `monitorAnalyser` → destination (routed to `settings.monitorDeviceId`). Used to route audio to VB-Cable/Voicemeeter so it appears on the mic input.
- **`globalAmplifier`**: Multiplied into both playback and monitor gain nodes. Allows boosting above 100%.
- **Mic cable path**: processed mic → `micContext` (sink `playbackDeviceId`). The final output→destination tap uses a `GainNode` set to `0` when `playbackDeviceId === 'default'` so the filtered voice never echoes back onto the default speakers (the VU-meter still runs). Gain `1` only when a real (non-default) device is selected.
- **Mic self-monitor**: when `settings.micEffect.selfMonitor` is on, a separate `micMonitorContext` (sink `monitorDeviceId`) plays the filtered voice into the headphones. It needs its own `MediaStreamSource` from the shared `micStream` because a context has a single `sinkId`.

## Key Constraints

- `media://` protocol must use `media://app/<path>` form (not `media://<path>`), because Chromium treats the first segment as the hostname and mangles Windows drive letters.
- `AudioContext` must be created without `sinkId` in the constructor; use `setSinkId()` async after creation with `.catch()` to handle stale device IDs without crashing the engine.
- `OfflineAudioContext` cannot reliably decode audio in Chromium; always use `playbackContext.decodeAudioData()`.
- `contextIsolation: true` — never access `require` or Node APIs from renderer code; use `window.electronAPI` bridge.
