const skinDirInput = document.querySelector('#dir-name-input')
const skinDirSelectBtn = document.querySelector('#select-dir-btn')
const startBtn = document.querySelector('#start-btn')
const totalASIFilesEle = document.querySelector('#total-asi-files')
const errorEle = document.querySelector('#error')
const allASIFilesList = document.querySelector('#all-asi-files-list')

skinDirSelectBtn.addEventListener('click', async (evt) => {
    evt.preventDefault()
    evt.stopPropagation()

    const skinDir = await window.myAPI.selectSkinDir()
    skinDirInput.value = skinDir == undefined ? "" : skinDir
})

startBtn.addEventListener('click', async(evt) => {
    evt.preventDefault()
    evt.stopPropagation()

    skinDirSelectBtn.disabled = true
    startBtn.disabled = true
    errorEle.textContent = ''

    const [allASIFiles, totalASIFiles, errMsg] = await window.myAPI.startASIFileDeletion(skinDirInput.value)

    if (errMsg) errorEle.textContent = errMsg

    totalASIFilesEle.textContent = totalASIFiles

    for (const ASIFile of allASIFiles) {
        const li = document.createElement('li')
        li.textContent = ASIFile
        allASIFilesList.append(li)
    }

    skinDirSelectBtn.disabled = false
    startBtn.disabled = false
})