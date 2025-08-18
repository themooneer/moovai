"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
// --------- Expose some API to the Renderer process ---------
electron_1.contextBridge.exposeInMainWorld('electronAPI', {
    // File dialogs
    openFile: () => electron_1.ipcRenderer.invoke('dialog:openFile'),
    saveFile: () => electron_1.ipcRenderer.invoke('dialog:saveFile'),
    openDirectory: () => electron_1.ipcRenderer.invoke('dialog:openDirectory'),
    // App info
    getVersion: () => electron_1.ipcRenderer.invoke('app:getVersion'),
    getPath: (name) => electron_1.ipcRenderer.invoke('app:getPath', name),
    // Window management
    minimize: () => electron_1.ipcRenderer.invoke('window:minimize'),
    maximize: () => electron_1.ipcRenderer.invoke('window:maximize'),
    close: () => electron_1.ipcRenderer.invoke('window:close'),
    toggleDevTools: () => electron_1.ipcRenderer.invoke('window:toggleDevTools'),
    reload: () => electron_1.ipcRenderer.invoke('window:reload'),
    // IPC communication
    on: (channel, callback) => {
        electron_1.ipcRenderer.on(channel, (event, ...args) => callback(...args));
    },
    once: (channel, callback) => {
        electron_1.ipcRenderer.once(channel, (event, ...args) => callback(...args));
    },
    removeAllListeners: (channel) => {
        electron_1.ipcRenderer.removeAllListeners(channel);
    }
});
// --------- Preload scripts are loaded before other scripts run ---------
// You can add any additional preload logic here
console.log('🚀 Preload script loaded');
