const skinDirSelectCont = document.querySelector('.select-dir-cont')
const skinDirInput = document.querySelector('.dir-name-input')
const skinDirSelectBtn = document.querySelector('.select-dir-btn')
const startBtn = document.querySelector('.start-btn')
const errorEle = document.querySelector('.error')
const deleteCount = document.querySelector('.delete-count')
const deletedFilesList = document.querySelector('.all-asi-files-deleted-list')
const renameCount = document.querySelector('.rename-count')
const renamedFilesList = document.querySelector('.all-asi-files-renamed-list')


skinDirSelectBtn.addEventListener('click', async (evt) => {
    evt.preventDefault()
    evt.stopPropagation()

    const skinDir = await window.myAPI.selectSkinDir()
    skinDirInput.value = skinDir == undefined ? "" : skinDir

    const skinDirInputToURL = new URL(skinDirInput.value).href
    skinDirSelectCont.style.backgroundImage = `url("${skinDirInputToURL}/menu-background.jpg")`
    skinDirSelectCont.style.backgroundSize = "cover"
    skinDirSelectCont.style.backgroundPosition = "center 30%"
    skinDirSelectCont.style.backgroundRepeat = "no-repeat"
})

const displayDeletedFiles = (allDeletedASIFiles) => {
    for (const deleted of allDeletedASIFiles) {
        const li = document.createElement('li')
        li.textContent = deleted
        li.classList.add('asi-files')
        deletedFilesList.append(li)
    }
    deleteCount.textContent = `${allDeletedASIFiles.length} total`
}

const displayRenamedFiles = (allRenamedASIFiles) => {
    for (const renamed of allRenamedASIFiles) {
        const li = document.createElement('li')
        li.textContent = renamed
        li.classList.add('asi-files')
        renamedFilesList.append(li)
    }
    renameCount.textContent = `${allRenamedASIFiles.length} total`
}

startBtn.addEventListener('click', async(evt) => {
    evt.preventDefault()
    evt.stopPropagation()

    skinDirSelectBtn.disabled = true
    startBtn.disabled = true
    errorEle.textContent = ''

    const {
        hitStdASI,
        nonGroupedASI,
        errMsg
    } = await window.myAPI.retrieveASIFiles(skinDirInput.value)

    if (errMsg) {
        errorEle.textContent = errMsg
        skinDirSelectBtn.disabled = false
        startBtn.disabled = false
        return
    }
    
    const { allRenamedASIFiles, allDeletedASIFiles } = await window.myAPI.asiFileDeletion(skinDirInput.value, hitStdASI, nonGroupedASI)

    displayDeletedFiles(allDeletedASIFiles)
    displayRenamedFiles(allRenamedASIFiles)

    skinDirSelectBtn.disabled = false
    startBtn.disabled = false
})