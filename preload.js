const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('myAPI', {
    selectSkinDir: () => ipcRenderer.invoke('selectSkinDir'),
    skinDirectoryPathError: (skinDirPath) => ipcRenderer.invoke('DirectoryPathError', skinDirPath),
    asiFileDeletion: (skinDirPath) => ipcRenderer.invoke('ASIFileDeletion', skinDirPath)
})