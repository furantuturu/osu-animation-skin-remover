const { app, BrowserWindow, ipcMain, dialog } = require('electron')
const path = require('node:path')
const { getAllASIFiles, handleHitStdASIDeletion, handleNonGroupedASIDeletion } = require('./helpers')

function createWindow() {
    const mainWindow = new BrowserWindow({
        width: 575,
        height: 700,
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

async function handleRetrieveASIFiles(event, skinDirPath) {
    const {
        hitStdASI,
        playSkipASI,
        scorebarColourASI,
        menuBackASI,
        followpointASI,
        errMsg
    } = await getAllASIFiles(skinDirPath)

    if (errMsg) return { errMsg }

    const nonGroupedASI = [
        playSkipASI,
        scorebarColourASI,
        menuBackASI,
        followpointASI
    ]

    return {
        hitStdASI,
        nonGroupedASI
    }
}

ipcMain.handle('retrieveASIFiles', handleRetrieveASIFiles)

async function handleASIFileDeletion(event, skinDirPath, hitStdASI, nonGroupedASI) {
    const { deletedHitASIFiles, renamedHitASIFiles } = await handleHitStdASIDeletion(skinDirPath, hitStdASI)
    const { deletedASIFiles, renamedASIFiles } = await handleNonGroupedASIDeletion(skinDirPath, nonGroupedASI)

    const allDeletedASIFiles = [...deletedHitASIFiles, ...deletedASIFiles]
    const allRenamedASIFiles = [...renamedHitASIFiles, ...renamedASIFiles]

    return { allDeletedASIFiles, allRenamedASIFiles }
}

ipcMain.handle('ASIFileDeletion', handleASIFileDeletion)