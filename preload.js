const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  selectFile: () => ipcRenderer.invoke('select-file'),
  getAppDataPath: () => ipcRenderer.invoke('get-app-data-path'),
  saveSoundFile: (sourcePath) => ipcRenderer.invoke('save-sound-file', sourcePath),
  saveConfig: (config) => ipcRenderer.invoke('save-config', config),
  loadConfig: () => ipcRenderer.invoke('load-config'),
  registerShortcut: (soundId, shortcut) => ipcRenderer.invoke('register-shortcut', { soundId, shortcut }),
  unregisterShortcut: (soundId) => ipcRenderer.invoke('unregister-shortcut', { soundId }),
  unregisterAllShortcuts: () => ipcRenderer.invoke('unregister-all-shortcuts'),

  // Auto-update
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  checkForUpdates: () => ipcRenderer.invoke('check-for-updates'),
  installUpdate: () => ipcRenderer.invoke('install-update'),
  onUpdateStatus: (callback) => {
    const subscription = (event, payload) => callback(payload);
    ipcRenderer.on('update-status', subscription);
    return () => ipcRenderer.removeListener('update-status', subscription);
  },

  // Event listeners
  onTriggerSound: (callback) => {
    const subscription = (event, soundId) => callback(soundId);
    ipcRenderer.on('trigger-sound', subscription);
    return () => ipcRenderer.removeListener('trigger-sound', subscription);
  },
  onShortcutStolen: (callback) => {
    const subscription = (event, data) => callback(data);
    ipcRenderer.on('shortcut-stolen', subscription);
    return () => ipcRenderer.removeListener('shortcut-stolen', subscription);
  }
});
