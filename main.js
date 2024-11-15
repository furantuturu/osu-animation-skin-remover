const { app, BrowserWindow, ipcMain, dialog } = require('electron')
const path = require('node:path')
const { getAllASEFiles, handleHitStdASEDeletion, handleNonGroupedASEDeletion } = require('./helpers')

function createWindow() {
    const mainWindow = new BrowserWindow({
        width: 575,
        height: 700,
        show: false,
        fullscreenable: false,
        resizable: false,
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

async function handleRetrieveASEFiles(event, skinDirPath) {
    const {
        hitStdASE,
        playSkipASE,
        scorebarColourASE,
        menuBackASE,
        followpointASE,
        errMsg
    } = await getAllASEFiles(skinDirPath)

    if (errMsg) return { errMsg }

    const nonGroupedASE = [
        playSkipASE,
        scorebarColourASE,
        menuBackASE,
        followpointASE
    ]

    return {
        hitStdASE,
        nonGroupedASE
    }
}

ipcMain.handle('retrieveASEFiles', handleRetrieveASEFiles)

async function handleASEFileDeletion(event, skinDirPath, hitStdASE, nonGroupedASE) {
    const { deletedHitASEFiles, renamedHitASEFiles } = await handleHitStdASEDeletion(skinDirPath, hitStdASE)
    const { deletedASEFiles, renamedASEFiles } = await handleNonGroupedASEDeletion(skinDirPath, nonGroupedASE)

    const allDeletedASEFiles = [...deletedHitASEFiles, ...deletedASEFiles]
    const allRenamedASEFiles = [...renamedHitASEFiles, ...renamedASEFiles]

    return { allDeletedASEFiles, allRenamedASEFiles }
}

ipcMain.handle('ASEFileDeletion', handleASEFileDeletion)