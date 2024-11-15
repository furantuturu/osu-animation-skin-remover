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
 * Retrieves and categorizes animation skin elements (ASE) files from the specified osu! skin directory.
 * 
 * This function scans the given osu! skin directory for ASE files matching specific patterns
 * and categorizes them into predefined arrays.
 * 
 * @async 
 * @param {string} skinDirPath - The path to the osu! skin directory containing the skin files. 
 * @returns {Array} An array containing: 
 * - **hitStdASE** (Object): An object with arrays for each osu! std hit ASE type (hit0, hit50, hit100, etc.). 
 * - **playSkipASE** (Array): An array of ASE files related to play-skip. 
 * - **scorebarColourASE** (Array): An array of ASE files related to scorebar-colour. 
 * - **menuBackASE** (Array): An array of ASE files related to menu-back. 
 * - **followpointASE** (Array): An array of ASE files related to followpoint. 
 * - **errMsg** (String | null): An error message if the directory is not found, otherwise null.
*/
async function getAllASEFiles(skinDirPath) {
    const hitStdASE = {
        hit0: [],
        hit50: [],
        hit100: [],
        hit100k: [],
        hit300: [],
        hit300k: [],
        hit300g: [],
    };

    const playSkipASE = [];
    const scorebarColourASE = [];
    const menuBackASE = [];
    const followpointASE = [];

    let errMsg = null
    
    const collectHitStdASEFiles = (file) => {
        const key = Object.keys(hitStdASE).find(hitStd => hitStd == file.split(/-\d+/)[0])
        if (key) {
            hitStdASE[key].push(file)
        }
        
    }

    const collectNonGroupedASEFiles = (file, pattern, collector) => {
        if (file.includes(pattern)) {
            collector.push(file)
        }
    }

    try {
        const skinFiles = await fs.readdir(skinDirPath);

        const hitStdASEPatterns = Object.keys(hitStdASE).map(hit => hit + "-")

        const nonGroupedASEFileCollections = [
            { pattern: "play-skip", collector: playSkipASE },
            { pattern: "scorebar-colour", collector: scorebarColourASE },
            { pattern: "menu-back", collector: menuBackASE },
            { pattern: "followpoint", collector: followpointASE }
        ];

        for (const file of skinFiles) {
            if (file.includes(`${hitStdASEPatterns.find(hitPattern => hitPattern === file.split(/(-\d+)/)[0] + "-")}`)) {
                collectHitStdASEFiles(file)
            }

            for (const { pattern, collector } of nonGroupedASEFileCollections) {
                collectNonGroupedASEFiles(file, pattern, collector);
            }
        }

    } catch (error) {
        errMsg = `No such directory of name: ${skinDirPath}`
    }

    return {
        hitStdASE,
        playSkipASE,
        scorebarColourASE,
        menuBackASE,
        followpointASE,
        errMsg
    }
}

/**
 * Renames mid-frame files and deletes redundant STD hit animation skin elements (ASE) files.
 * 
 * If final frame/image for hit0 is hit0-44, the mid-frame will be hit0-22
 * 
 * This function processes STD hit ASE files in the specified osu! skin directory, 
 * renames the middle frame files to 'hit-0.png' and/or 'hit-0@2x.png', and 
 * deletes other redundant files.
 * 
 * @async 
 * @param {string} skinDirPath - The path to the osu! skin directory containing the skin files.
 * @param {object} hitStdASE - An object with arrays of STD hit ASE file names categorized by 'hit' type.
 * @returns {object} An object containing arrays of deleted and renamed ASE files:
 * - deletedHitASEFiles (Array): List of deleted hit ASE files.
 * - renamedHitASEFiles (Array): List of renamed hit ASE files.
 */
async function handleHitStdASEDeletion(skinDirPath, hitStdASE) {
    const deletedHitASEFiles = []
    const renamedHitASEFiles = []

    const renameMidFrames = async (skinDirPath, midFrames) => {
        for (const midFrame of midFrames) {
            renamedHitASEFiles.push(midFrame)

            const newDefaultHitName = midFrame.includes('@2x')
                ? midFrame.replace(/(-\d+)/, '-0@2x')
                : midFrame.replace(/(-\d+)/, '-0')
            
            await fs.rename(path.join(skinDirPath, midFrame), path.join(skinDirPath, newDefaultHitName))
        }
    }

    const deleteHitStdASEFiles = async (skinDirPath, sortedHitStdASE) => {
        for (const hitASE of sortedHitStdASE) {
            if (hitASE.includes(`-0`) || hitASE.includes(`-0@2x`)) continue

            deletedHitASEFiles.push(hitASE)

            await fs.rm(path.join(skinDirPath, hitASE), { force: true })
        }
    }

    const hitStdASEKeys = Object.keys(hitStdASE)
    for (const key of hitStdASEKeys) {
        //* not including hitStdASE that only have at max 4 hitSI
        //* possibly only having (e.g hit300-0.png, hit300-0@2x.png, hit300-1.png, hit300-1@2x.png)
        if (hitStdASE[key].length <= 4) continue
    
        const sortedHitStdASE = naturalSort(hitStdASE[key]).asc()
    
        //* returns the middle "hit" frame of the skin, 
        //* it could be hit - 22.png or hit - 23.png
        //* if hit-44.png is the last frame for this example,
        //* assigned middle "hit" frame is possibly 
        //* a @2x upscale variant of hit - 22.png(e.g hit.22@2x.png) or not
        const indexOfHitASEMidFrame = Math.floor(sortedHitStdASE.length / 2)
        const hitASEMidFrame = sortedHitStdASE[indexOfHitASEMidFrame]
    
        //* assigns the normal and/or @2x variant of the middle "hit" frame of the skin
        //* that matches the name of the hitSIMidFrame
        const midFrames = sortedHitStdASE.filter(hit => {
            return hit.includes(hitASEMidFrame.replace(/(.png)|(@2x.png)/i, ''))
        })

        await renameMidFrames(skinDirPath, midFrames)
        await deleteHitStdASEFiles(skinDirPath, sortedHitStdASE)
    }

    return { deletedHitASEFiles, renamedHitASEFiles }
}

/**
 * Renames mid-frame files and deletes redundant non-grouped animation skin element (ASE) files.
 * 
 * Renaming can only happen if a skin element type dont have a static
 * or complete image after the animation, e.g play-skip.png
 * 
 * This function processes non-grouped ASE files in the specified osu! skin directory,
 * renames the mid-frame files to a standard format, and deletes other redundant files.
 * 
 * @async * 
 * @param {string} skinDirPath - The path to the directory containing the ASE files.
 * @param {array} nonGroupedASEs - An array of non-grouped ASE file names categorized by type.
 * @returns {object} An object containing arrays of deleted and renamed ASE files:
 * - deletedASEFiles (Array): List of deleted ASE files. * 
 * - renamedASEFiles (Array): List of renamed ASE files. */
async function handleNonGroupedASEDeletion(skinDirPath, nonGroupedASEs) {
    const deletedASEFiles = []
    const renamedASEFiles = []

    //* renaming of mid frame
    //* (e.g.play-skip-25 to play - skip.png and/or play - skip@2x.png
    //* if total play-skip frames is 50 (play-skip-50) and no default play-skip.png which is being checked)
    const renameMidFrames = async (skinDirPath, midFrames) => {
        for (const midFrame of midFrames) {
            renamedASEFiles.push(midFrame)

            const newDefaultName = midFrame.replace(/(-\d+)/, '')
            
            await fs.rename(path.join(skinDirPath, midFrame), path.join(skinDirPath, newDefaultName))
        }
    }

    const deleteASEFiles = async (skinDirPath, sortedNonGroupedASEs) => {
        for (const ASEFile of sortedNonGroupedASEs) {
            if (!ASEFile.match(/(-\d+)/)) continue

            deletedASEFiles.push(ASEFile)
            
            await fs.rm(path.join(skinDirPath, ASEFile), { force: true })
        }
    }

    for (const ASE of nonGroupedASEs) {
        if (ASE.length <= 4) continue
        
        const sortedNonGroupedASEs = naturalSort(ASE).asc()

        //* checks if theres no static normal and/or @2x upscale SE
        //* (e.g play-skip.png or play-skip@2x.png)
        //* if theres none, then get mid frame of the certain SE
        //* and make it as a static SE
        //* else proceed directly to deletion
        if (sortedNonGroupedASEs.at(-2)?.match(/(-\d+)/) !== null || sortedNonGroupedASEs.at(-1)?.match(/(-\d+)/) ) {
            const indexOfASEMidFrame = Math.floor(sortedNonGroupedASEs.length / 2)
            const ASEMidFrame = sortedNonGroupedASEs[indexOfASEMidFrame]
        
            const midFrames = sortedNonGroupedASEs.filter(hit => {
                return hit.includes(ASEMidFrame.replace(/(.png)|(@2x.png)/i, ''))
            })

            await renameMidFrames(skinDirPath, midFrames)
        }

        await deleteASEFiles(skinDirPath, sortedNonGroupedASEs)
    }

    return { deletedASEFiles, renamedASEFiles }
}

module.exports = {
    getAllASEFiles,
    handleHitStdASEDeletion,
    handleNonGroupedASEDeletion
}