const skinDirSelectCont = document.querySelector('.select-dir-cont')
const skinDirInput = document.querySelector('.dir-name-input')
const skinDirSelectBtn = document.querySelector('.select-dir-btn')
const startBtn = document.querySelector('.start-btn')
const errorEle = document.querySelector('.error')


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

startBtn.addEventListener('click', async(evt) => {
    evt.preventDefault()
    evt.stopPropagation()

    skinDirSelectBtn.disabled = true
    startBtn.disabled = true
    errorEle.textContent = ''

    const errMsg = await window.myAPI.skinDirectoryPathError(skinDirInput.value)

    if (errMsg) {
        errorEle.textContent = errMsg
        skinDirSelectBtn.disabled = false
        startBtn.disabled = false
        return
    }

    skinDirSelectBtn.disabled = false
    startBtn.disabled = false
})