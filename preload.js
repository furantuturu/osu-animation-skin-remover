const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('myAPI', {
    selectSkinDir: () => ipcRenderer.invoke('selectSkinDir'),
    retrieveASEFiles: (skinDirPath) => ipcRenderer.invoke('retrieveASEFiles', skinDirPath),
    ASEFileDeletion: (skinDirPath, hitStdASE, nonGroupedASE) => ipcRenderer.invoke('ASEFileDeletion', skinDirPath, hitStdASE, nonGroupedASE)
})