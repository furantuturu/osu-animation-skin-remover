const fs = require('node:fs/promises')
const path = require('node:path')
const { createNewSortInstance } = require('fast-sort')

/**
 * For language sensitive sorting or natural sorting for names like (e.g 'image-11.jpg')
 * 
 * Refer to https://www.npmjs.com/package/fast-sort
 */
const naturalSort = createNewSortInstance({
    comparer: new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' }).compare
})

/**
 * Retrieves and categorizes animation skin interface (ASI) files from the specified osu! skin directory.
 * 
 * This function scans the given osu! skin directory for ASI files matching specific patterns
 * and categorizes them into predefined arrays. It also counts the total number of ASI 
 * files found and handles any directory errors.
 * 
 * @async 
 * @param {string} skinDirPath - The path to the osu! skin directory containing the skin files. 
 * @returns {Array} An array containing: 
 * - **hitStdASI** (Object): An object with arrays for each osu! std hit ASI type (hit0, hit50, hit100, etc.). 
 * - **playSkipASI** (Array): An array of ASI files related to play-skip. 
 * - **scorebarColourASI** (Array): An array of ASI files related to scorebar-colour. 
 * - **menuBackASI** (Array): An array of ASI files related to menu-back. 
 * - **followpointASI** (Array): An array of ASI files related to followpoint. 
 * - **errMsg** (String | null): An error message if the directory is not found, otherwise null.
*/
async function getAllASIFiles(skinDirPath) {
    const hitStdASI = {
        hit0: [],
        hit50: [],
        hit100: [],
        hit100k: [],
        hit300: [],
        hit300k: [],
        hit300g: [],
    };

    const playSkipASI = [];
    const scorebarColourASI = [];
    const menuBackASI = [];
    const followpointASI = [];

    let errMsg = null
    
    const collectHitStdASIFiles = (file) => {
        const key = Object.keys(hitStdASI).find(hitStd => hitStd == file.split(/-\d+/)[0])
        if (key) {
            hitStdASI[key].push(file)
        }
        
    }

    const collectNonGroupedASIFiles = (file, pattern, collector) => {
        if (file.includes(pattern)) {
            collector.push(file)
        }
    }

    try {
        const skinFiles = await fs.readdir(skinDirPath);

        const hitStdASIPatterns = Object.keys(hitStdASI).map(hit => hit + "-")

        const nonGroupedASIFileCollections = [
            { pattern: "play-skip", collector: playSkipASI },
            { pattern: "scorebar-colour", collector: scorebarColourASI },
            { pattern: "menu-back", collector: menuBackASI },
            { pattern: "followpoint", collector: followpointASI }
        ];

        for (const file of skinFiles) {
            if (file.includes(`${hitStdASIPatterns.find(hitPattern => hitPattern === file.split(/(-\d+)/)[0] + "-")}`)) {
                collectHitStdASIFiles(file)
            }

            for (const { pattern, collector } of nonGroupedASIFileCollections) {
                collectNonGroupedASIFiles(file, pattern, collector);
            }
        }

    } catch (error) {
        errMsg = `No such directory of name: ${skinDirPath}`
    }

    return {
        hitStdASI,
        playSkipASI,
        scorebarColourASI,
        menuBackASI,
        followpointASI,
        errMsg
    }
}

async function handleHitStdASIDeletion(skinDirPath, hitStdASI) {
    const deletedHitASIFiles = []
    const renamedHitASIFiles = []

    //* renaming of mid frame hitSI to hit-0 and/or hit-0@2x
    const renameMidFrames = async (skinDirPath, midFrames) => {
        for (const midFrame of midFrames) {
            renamedHitASIFiles.push(midFrame)

            const newDefaultHitName = midFrame.includes('@2x')
                ? midFrame.replace(/(-\d+)/, '-0@2x')
                : midFrame.replace(/(-\d+)/, '-0')
            
            await fs.rename(path.join(skinDirPath, midFrame), path.join(skinDirPath, newDefaultHitName))
        }
    }

    //* deletion of osu! STD hit ASI
    const deleteHitStdASIFiles = async (skinDirPath, sortedHitStdASI) => {
        for (const hitASI of sortedHitStdASI) {
            if (hitASI.includes(`-0`) || hitASI.includes(`-0@2x`)) continue

            deletedHitASIFiles.push(hitASI)

            await fs.rm(path.join(skinDirPath, hitASI), { force: true })
        }
    }

    const hitStdASIKeys = Object.keys(hitStdASI)
    for (const key of hitStdASIKeys) {
        //* not including hitStdASI that only have at max 4 hitSI
        //* possibly only having (e.g hit300-0.png, hit300-0@2x.png, hit300-1.png, hit300-1@2x.png)
        if (hitStdASI[key].length <= 4) continue
    
        const sortedHitStdASI = naturalSort(hitStdASI[key]).asc()
    
        //* returns the middle "hit" frame of the skin, 
        //* it could be hit - 22.png or hit - 23png for this example
        //* if hit-44.png is the last frame,
        //* assigned middle "hit" frame is possibly 
        //* a @2x upscale variant of hit - 22.png(e.g hit.22@2x.png) or not
        const indexOfHitASIMidFrame = Math.floor(sortedHitStdASI.length / 2)
        const hitASIMidFrame = sortedHitStdASI[indexOfHitASIMidFrame]
    
        //* assigns the normal and @2x variant of the middle "hit" frame of the skin
        //* that matches the name of the hitSIMidFrame
        const midFrames = sortedHitStdASI.filter(hit => {
            return hit.includes(hitASIMidFrame.replace(/(.png)|(@2x.png)/i, ''))
        })

        await renameMidFrames(skinDirPath, midFrames)
        await deleteHitStdASIFiles(skinDirPath, sortedHitStdASI)
    }

    return { deletedHitASIFiles, renamedHitASIFiles }
}

async function handleNonGroupedASIDeletion(skinDirPath, nonGroupedASI) {
    const deletedASIFiles = []
    const renamedASIFiles = []

    //* renaming of mid frame
    //* (e.g.play-skip-25 to play - skip.png and/or play - skip@2x.png
    //* if total play-skip frames is 50 (play-skip-50) and no default play-skip.png which is being checked)
    const renameMidFrames = async (skinDirPath, midFrames) => {
        for (const midFrame of midFrames) {
            renamedASIFiles.push(midFrame)

            const newDefaultName = midFrame.replace(/(-\d+)/, '')
            
            await fs.rename(path.join(skinDirPath, midFrame), path.join(skinDirPath, newDefaultName))
        }
    }

    const deleteASIFiles = async (skinDirPath, sortedNonGroupedASI) => {
        for (const asi of sortedNonGroupedASI) {
            if (!asi.match(/(-\d+)/)) continue

            deletedASIFiles.push(asi)
            
            await fs.rm(path.join(skinDirPath, asi), { force: true })
        }
    }

    for (const asi of nonGroupedASI) {
        if (asi.length <= 4) continue
        
        const sortedNonGroupedASI = naturalSort(asi).asc()

        //* checks if theres no default static normal and/or @2x upscale SI
        //* (e.g play-skip.png or play-skip@2x.png)
        //* if theres none then get mid frame of the certain SI
        //* and make it as a default static SI
        //* else proceed directly to deletion
        if (sortedNonGroupedASI.at(-2)?.match(/(-\d+)/) !== null || sortedNonGroupedASI.at(-1)?.match(/(-\d+)/) ) {
            const indexOfASIMidFrame = Math.floor(sortedNonGroupedASI.length / 2)
            const ASIMidFrame = sortedNonGroupedASI[indexOfASIMidFrame]
        
            const midFrames = sortedNonGroupedASI.filter(hit => {
                return hit.includes(ASIMidFrame.replace(/(.png)|(@2x.png)/i, ''))
            })

            await renameMidFrames(skinDirPath, midFrames)
        }

        await deleteASIFiles(skinDirPath, sortedNonGroupedASI)
    }

    return { deletedASIFiles, renamedASIFiles }
}

module.exports = {
    getAllASIFiles,
    handleHitStdASIDeletion,
    handleNonGroupedASIDeletion
}