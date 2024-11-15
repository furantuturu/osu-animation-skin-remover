const skinDirSelectCont = document.querySelector('.select-dir-cont')
const skinDirInput = document.querySelector('.dir-name-input')
const skinDirSelectBtn = document.querySelector('.select-dir-btn')
const startBtn = document.querySelector('.start-btn')
const errorEle = document.querySelector('.error')
const deleteCounter = document.querySelector('.delete-count')
const deletedFilesList = document.querySelector('.all-ASE-files-deleted-list')
const renameCounter = document.querySelector('.rename-count')
const renamedFilesList = document.querySelector('.all-ASE-files-renamed-list')

skinDirSelectBtn.addEventListener('click', async (evt) => {
    evt.preventDefault()
    evt.stopPropagation()

    const skinDir = await window.myAPI.selectSkinDir()
    skinDirInput.value = skinDir == undefined ? "" : skinDir

    const skinDirInputToURL = new URL(skinDirInput.value.replaceAll("#", encodeURIComponent("#"))).href

    skinDirSelectCont.style.backgroundImage = `url("${skinDirInputToURL}/menu-background.jpg")`
    skinDirSelectCont.style.backgroundSize = "cover"
    skinDirSelectCont.style.backgroundPosition = "center 30%"
    skinDirSelectCont.style.backgroundRepeat = "no-repeat"
})

const displayFiles = (allASEFiles, filesList, counter) => {
    for (const files of allASEFiles) {
        const li = document.createElement('li')
        li.textContent = files
        li.classList.add('ASE-files')
        filesList.append(li)
    }
    counter.textContent = `${allASEFiles.length} total`
}

const handleError = (errMsg) => {
    errorEle.textContent = errMsg
    skinDirSelectBtn.disabled = false
    startBtn.disabled = false
}

const clearUI = () => {
    errorEle.textContent = ''
    deletedFilesList.textContent = ''
    renamedFilesList.textContent = ''
}

const btnAfterDelete = () => {
    startBtn.innerHTML = 
        `
            Start
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" class="trash-can">
                <path 
                fill="#ffffff"
                d="M135.2 17.7C140.6 6.8 151.7 0 163.8 0L284.2 0c12.1 0 23.2 6.8 28.6 17.7L320 32l96 0c17.7 0 32 14.3 32 32s-14.3 32-32 32L32 96C14.3 96 0 81.7 0 64S14.3 32 32 32l96 0 7.2-14.3zM32 128l384 0 0 320c0 35.3-28.7 64-64 64L96 512c-35.3 0-64-28.7-64-64l0-320zm96 64c-8.8 0-16 7.2-16 16l0 224c0 8.8 7.2 16 16 16s16-7.2 16-16l0-224c0-8.8-7.2-16-16-16zm96 0c-8.8 0-16 7.2-16 16l0 224c0 8.8 7.2 16 16 16s16-7.2 16-16l0-224c0-8.8-7.2-16-16-16zm96 0c-8.8 0-16 7.2-16 16l0 224c0 8.8 7.2 16 16 16s16-7.2 16-16l0-224c0-8.8-7.2-16-16-16z"/>
            </svg>
    `
}

startBtn.addEventListener('click', async(evt) => {
    evt.preventDefault()
    evt.stopPropagation()

    skinDirSelectBtn.disabled = true
    startBtn.disabled = true
    startBtn.textContent = "Deleting..."
    clearUI()

    const {
        hitStdASE,
        nonGroupedASE,
        errMsg
    } = await window.myAPI.retrieveASEFiles(skinDirInput.value)

    if (errMsg) {
        handleError(errMsg)
        btnAfterDelete()
        return
    }
    
    const { allDeletedASEFiles, allRenamedASEFiles } = await window.myAPI.ASEFileDeletion(skinDirInput.value, hitStdASE, nonGroupedASE)

    displayFiles(allDeletedASEFiles, deletedFilesList, deleteCounter)
    displayFiles(allRenamedASEFiles, renamedFilesList, renameCounter)

    skinDirSelectBtn.disabled = false
    startBtn.disabled = false
    btnAfterDelete()
})