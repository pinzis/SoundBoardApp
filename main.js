const { app, BrowserWindow, ipcMain, dialog, globalShortcut, protocol, net } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');
const https = require('https');
const http = require('http');
const { spawn } = require('child_process');
const { pathToFileURL } = require('url');
const { autoUpdater } = require('electron-updater');

// Register custom media:// protocol to load local media files safely
protocol.registerSchemesAsPrivileged([
  {
    scheme: 'media',
    privileges: {
      bypassCSP: true,
      stream: true,
      supportFetchAPI: true,
      corsEnabled: true
    }
  }
]);

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 850,
    minWidth: 1000,
    minHeight: 700,
    title: "Soundboard",
    icon: path.join(__dirname, 'build', 'icon.png'),
    frame: true,
    backgroundColor: '#0b0c11',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  });

  // Load index.html
  mainWindow.loadFile(path.join(__dirname, 'renderer', 'index.html'));

  // Autogrant microphone permissions so enumerateDevices works
  mainWindow.webContents.session.setPermissionRequestHandler((webContents, permission, callback) => {
    if (permission === 'media') {
      callback(true);
    } else {
      callback(false);
    }
  });

  // Remove standard menu
  mainWindow.setMenuBarVisibility(false);
}

app.whenReady().then(() => {
  // Handle media://app/<encoded-path> → local file
  protocol.handle('media', (request) => {
    const url = new URL(request.url);
    // pathname starts with '/' → slice it off before decoding
    const decodedPath = decodeURIComponent(url.pathname.slice(1));
    return net.fetch(pathToFileURL(decodedPath).toString());
  });

  createWindow();

  setupAutoUpdater();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// ---- Auto-update (GitHub releases + NSIS automatic install) ----
function sendUpdateStatus(payload) {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('update-status', payload);
  }
}

function setupAutoUpdater() {
  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = true;

  autoUpdater.on('checking-for-update', () => sendUpdateStatus({ state: 'checking' }));
  autoUpdater.on('update-available', (info) => sendUpdateStatus({ state: 'available', version: info?.version }));
  autoUpdater.on('update-not-available', (info) => sendUpdateStatus({ state: 'not-available', version: info?.version }));
  autoUpdater.on('download-progress', (p) => sendUpdateStatus({ state: 'downloading', percent: Math.round(p?.percent || 0) }));
  autoUpdater.on('update-downloaded', (info) => sendUpdateStatus({ state: 'downloaded', version: info?.version }));
  autoUpdater.on('error', (err) => sendUpdateStatus({ state: 'error', message: (err && err.message) ? err.message : String(err) }));

  // Only check automatically in the packaged app; in dev there is no update feed.
  if (app.isPackaged) {
    autoUpdater.checkForUpdates().catch(err => console.warn('checkForUpdates falló:', err));
  }
}

ipcMain.handle('get-app-version', () => app.getVersion());

ipcMain.handle('check-for-updates', async () => {
  if (!app.isPackaged) {
    return { ok: false, reason: 'not-packaged' };
  }
  try {
    await autoUpdater.checkForUpdates();
    return { ok: true };
  } catch (err) {
    return { ok: false, reason: (err && err.message) ? err.message : String(err) };
  }
});

ipcMain.handle('install-update', () => {
  // quitAndInstall closes the app and runs the downloaded NSIS installer
  setImmediate(() => autoUpdater.quitAndInstall());
  return true;
});

app.on('window-all-closed', function () {
  // Unregister all shortcuts on exit
  globalShortcut.unregisterAll();
  if (process.platform !== 'darwin') app.quit();
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});

// IPC handlers
ipcMain.handle('select-file', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    title: "Seleziona File Audio o Video",
    filters: [
      { name: 'File Multimediali', extensions: ['mp3', 'mp4', 'wav', 'ogg', 'm4a'] }
    ],
    properties: ['openFile']
  });

  if (result.canceled || result.filePaths.length === 0) {
    return null;
  }
  return result.filePaths[0];
});

ipcMain.handle('get-app-data-path', () => {
  return app.getPath('userData');
});

// Save imported sound file to AppData/sounds
ipcMain.handle('save-sound-file', async (event, sourcePath) => {
  try {
    const userDataPath = app.getPath('userData');
    const soundsDir = path.join(userDataPath, 'sounds');
    
    if (!fs.existsSync(soundsDir)) {
      fs.mkdirSync(soundsDir, { recursive: true });
    }

    const filename = path.basename(sourcePath);
    // Add unique prefix to prevent overwrite collisions
    const uniqueFilename = `${Date.now()}_${filename.replace(/\s+/g, '_')}`;
    const destPath = path.join(soundsDir, uniqueFilename);

    fs.copyFileSync(sourcePath, destPath);
    return destPath;
  } catch (error) {
    console.error("Errore nel salvataggio del file:", error);
    throw error;
  }
});

// Save config file
ipcMain.handle('save-config', async (event, config) => {
  try {
    const userDataPath = app.getPath('userData');
    const configPath = path.join(userDataPath, 'config.json');
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf-8');
    return true;
  } catch (error) {
    console.error("Errore nel salvataggio della configurazione:", error);
    return false;
  }
});

// Load config file
ipcMain.handle('load-config', async () => {
  try {
    const userDataPath = app.getPath('userData');
    const configPath = path.join(userDataPath, 'config.json');
    if (fs.existsSync(configPath)) {
      const data = fs.readFileSync(configPath, 'utf-8');
      return JSON.parse(data);
    }
    return null;
  } catch (error) {
    console.error("Errore nel caricamento della configurazione:", error);
    return null;
  }
});

// Shortcuts Management
const registeredShortcuts = new Map(); // key: shortcutString, value: soundId

ipcMain.handle('register-shortcut', (event, { soundId, shortcut }) => {
  if (!shortcut) return false;

  // Unregister existing shortcut if this sound already has one registered
  for (const [s, id] of registeredShortcuts.entries()) {
    if (id === soundId) {
      globalShortcut.unregister(s);
      registeredShortcuts.delete(s);
    }
  }

  // Unregister this specific shortcut if registered by another sound
  if (globalShortcut.isRegistered(shortcut)) {
    globalShortcut.unregister(shortcut);
    // Find who owned it
    for (const [s, id] of registeredShortcuts.entries()) {
      if (s === shortcut) {
        registeredShortcuts.delete(s);
        // We can notify the renderer that this shortcut was stolen
        if (mainWindow) {
          mainWindow.webContents.send('shortcut-stolen', { soundId: id, shortcut });
        }
      }
    }
  }

  try {
    const success = globalShortcut.register(shortcut, () => {
      if (mainWindow) {
        mainWindow.webContents.send('trigger-sound', soundId);
      }
    });

    if (success) {
      registeredShortcuts.set(shortcut, soundId);
      return true;
    }
    return false;
  } catch (error) {
    console.error(`Impossibile registrare la scorciatoia: ${shortcut}`, error);
    return false;
  }
});

ipcMain.handle('unregister-shortcut', (event, { soundId }) => {
  let found = false;
  for (const [s, id] of registeredShortcuts.entries()) {
    if (id === soundId) {
      globalShortcut.unregister(s);
      registeredShortcuts.delete(s);
      found = true;
    }
  }
  return found;
});

ipcMain.handle('unregister-all-shortcuts', () => {
  globalShortcut.unregisterAll();
  registeredShortcuts.clear();
  return true;
});

// ---- Virtual Microphone (VB-Cable) installation ----------------------------------------

const VBCABLE_URL = 'https://download.vb-audio.com/Download_CABLE/VBCABLE_Driver_Pack43.zip';
const VBCABLE_EXE = 'VBCABLE_Setup_x64.exe';

function sendVbCableProgress(payload) {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('vbcable-progress', payload);
  }
}

function downloadFile(url, destPath, onProgress) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(destPath);
    let received = 0;

    function follow(currentUrl) {
      const mod = currentUrl.startsWith('https') ? https : http;
      mod.get(currentUrl, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          const next = new URL(res.headers.location, currentUrl).toString();
          res.resume();
          follow(next);
          return;
        }
        if (res.statusCode !== 200) {
          file.close();
          reject(new Error(`HTTP ${res.statusCode}`));
          return;
        }
        const total = parseInt(res.headers['content-length'] || '0', 10);
        res.on('data', (chunk) => {
          received += chunk.length;
          if (total > 0 && onProgress) onProgress(Math.round(received / total * 100));
        });
        res.pipe(file);
        file.on('finish', () => { file.close(); resolve(); });
        res.on('error', (e) => { file.close(); reject(e); });
      }).on('error', (e) => { file.close(); reject(e); });
    }

    follow(url);
  });
}

function extractZip(zipPath, destDir) {
  return new Promise((resolve, reject) => {
    const zip = zipPath.replace(/'/g, "''");
    const dir = destDir.replace(/'/g, "''");
    const ps = spawn('powershell.exe', [
      '-NoProfile', '-NonInteractive', '-Command',
      `Expand-Archive -LiteralPath '${zip}' -DestinationPath '${dir}' -Force`
    ], { windowsHide: true });
    let stderr = '';
    ps.stderr.on('data', (d) => { stderr += d.toString(); });
    ps.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`Estrazione fallita (${code}): ${stderr.trim()}`));
    });
    ps.on('error', reject);
  });
}

function runElevated(exePath, args) {
  return new Promise((resolve, reject) => {
    const exe = exePath.replace(/'/g, "''");
    const argsStr = args.length ? args.map(a => `'${a.replace(/'/g, "''")}'`).join(', ') : "'/S'";
    const cmd = [
      `$ErrorActionPreference = 'Stop'`,
      `$p = Start-Process -FilePath '${exe}' -ArgumentList ${argsStr} -Verb RunAs -PassThru -Wait`,
      `exit $p.ExitCode`
    ].join('; ');
    const ps = spawn('powershell.exe', ['-NoProfile', '-Command', cmd], { windowsHide: false });
    let stderr = '';
    ps.stderr.on('data', (d) => { stderr += d.toString(); });
    ps.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(
        code === 1
          ? 'Installazione annullata o accesso amministratore negato'
          : `Installazione fallita (codice: ${code})`
      ));
    });
    ps.on('error', reject);
  });
}

ipcMain.handle('install-vbcable', async () => {
  try {
    const tmpDir = path.join(os.tmpdir(), 'soundboard-vbcable');
    if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });
    const zipPath = path.join(tmpDir, 'vbcable.zip');
    const extractDir = path.join(tmpDir, 'extracted');

    // Download (~5 MB)
    sendVbCableProgress({ state: 'downloading', percent: 0 });
    await downloadFile(VBCABLE_URL, zipPath, (p) => {
      sendVbCableProgress({ state: 'downloading', percent: p });
    });

    // Extract
    sendVbCableProgress({ state: 'extracting' });
    if (fs.existsSync(extractDir)) fs.rmSync(extractDir, { recursive: true, force: true });
    await extractZip(zipPath, extractDir);

    const exePath = path.join(extractDir, VBCABLE_EXE);
    if (!fs.existsSync(exePath)) {
      throw new Error('Installer non trovato nel pacchetto scaricato');
    }

    // Install with UAC elevation
    sendVbCableProgress({ state: 'installing' });
    await runElevated(exePath, ['/S']);

    sendVbCableProgress({ state: 'done' });
    return { ok: true };
  } catch (err) {
    const msg = err?.message || String(err);
    sendVbCableProgress({ state: 'error', message: msg });
    return { ok: false, error: msg };
  }
});
