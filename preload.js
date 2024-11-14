const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('myAPI', {
    selectSkinDir: () => ipcRenderer.invoke('selectSkinDir'),
    retrieveASIFiles: (skinDirPath) => ipcRenderer.invoke('retrieveASIFiles', skinDirPath),
    asiFileDeletion: (skinDirPath, hitStdASI, nonGroupedASI) => ipcRenderer.invoke('ASIFileDeletion', skinDirPath, hitStdASI, nonGroupedASI)
})