const { app, BrowserWindow, ipcMain, dialog } = require('electron')
const path = require('node:path')
const { getAllASIFiles } = require('./helpers')

function createWindow() {
    const mainWindow = new BrowserWindow({
        width: 550,
        height: 650,
        show: false,
        fullscreenable: false,
        webPreferences: {
            preload: path.join(__dirname, "preload.js"),
            devTools: false
        }
    })
    
    mainWindow.once('ready-to-show', () => {
        mainWindow.show()
    })

    mainWindow.setMenuBarVisibility(false)
    mainWindow.loadFile('index.html')
}

app.on('window-all-closed', () => {
    if (BrowserWindow.getAllWindows().length === 0) app.quit()
})

app.whenReady().then(() => {
    createWindow()
    
    app.on('activate', () => {
        if (process.platform !== 'darwin') createWindow()
        })
})

async function handleSelectSkinDir() {
    const { cancelled, filePaths } = await dialog.showOpenDialog({
        properties: ['openDirectory']
    })
    if (!cancelled) {
        return filePaths[0]
    }
}

ipcMain.handle('selectSkinDir', handleSelectSkinDir)

async function handleSkinDirectoryPathError(event, skinDirPath) {
    const { errMsg } = await getAllASIFiles(skinDirPath)
    return errMsg
}

ipcMain.handle('DirectoryPathError', handleSkinDirectoryPathError)

async function handleASIFileDeletion(skinDirPath) {
    const { 
        hitStdASI,
        playSkipASI,
        scorebarColourASI,
        menuBackASI,
        followpointASI
    } = await getAllASIFiles(skinDirPath)
}

ipcMain.handle('ASIFileDeletion', handleASIFileDeletion)