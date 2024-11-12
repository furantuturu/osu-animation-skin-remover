const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('myAPI', {
    selectSkinDir: () => ipcRenderer.invoke('selectSkinDir'),
    startASIFileDeletion: (skinDirPath) => ipcRenderer.invoke('startASIFileDeletion', skinDirPath) 
})