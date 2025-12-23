const { contextBridge, ipcRenderer, clipboard } = require('electron');

contextBridge.exposeInMainWorld('api', {
  onMenuAction: (callback) => {
    const listener = (_event, action) => callback(action);
    ipcRenderer.on('menu-action', listener);
    return () => ipcRenderer.removeListener('menu-action', listener);
  },
  send: (channel, payload) => ipcRenderer.send(channel, payload),
  clipboard: {
    readText: () => clipboard.readText(),
    writeText: (text) => clipboard.writeText(text),
  },
});

// Expose IPC renderer for TitleBar
contextBridge.exposeInMainWorld('electron', {
  ipcRenderer: {
    send: (channel, payload) => ipcRenderer.send(channel, payload),
    invoke: (channel, payload) => ipcRenderer.invoke(channel, payload),
    on: (channel, callback) => ipcRenderer.on(channel, callback),
    once: (channel, callback) => ipcRenderer.once(channel, callback),
    removeListener: (channel, callback) => ipcRenderer.removeListener(channel, callback),
  }
});

// Expose dialog functionality
contextBridge.exposeInMainWorld('dialog', {
  showOpenDialog: (options) => ipcRenderer.invoke('dialog:showOpenDialog', options)
});
