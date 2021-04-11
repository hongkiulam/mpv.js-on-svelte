const { contextBridge, ipcRenderer } = require('electron');
const path = require('path');

contextBridge.exposeInMainWorld('nodejs', {
  path: path,
  dirname: __dirname,
  cwd: process.cwd(),
});

contextBridge.exposeInMainWorld('electron', {
  dialog: {
    showOpenDialogSync: (...args) =>
      ipcRenderer.sendSync('open-dialog', ...args),
  },
});
