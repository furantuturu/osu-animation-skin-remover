const { app, BrowserWindow, ipcMain, dialog } = require('electron')
const path = require('node:path')
const { getAllASIFiles, naturalSort } = require('./helpers')

function createWindow() {
    const mainWindow = new BrowserWindow({
        width: 450,
        height: 650,
        show: false,
        fullscreenable: false,
        webPreferences: {
            preload: path.join(__dirname, "preload.js"),
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

async function handleASIFiles(event, skinDirPath) {
    const [
        allASIFiles,
        totalASIFiles,
        errMsg
    ] = await getAllASIFiles(skinDirPath)

    return [ naturalSort(allASIFiles).asc(), totalASIFiles, errMsg ]
}

ipcMain.handle('startASIFileDeletion', handleASIFiles)