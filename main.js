const { app, BrowserWindow, ipcMain, dialog, globalShortcut, protocol, net } = require('electron');
const path = require('path');
const fs = require('fs');
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
