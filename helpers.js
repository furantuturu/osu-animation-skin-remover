const fs = require('node:fs/promises')
const { createNewSortInstance } = require('fast-sort')

/**
 * For language sensitive sorting or natural sorting for names like (e.g 'image-11.jpg')
 * 
 * refer to https://www.npmjs.com/package/fast-sort
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
 * - **allASIFiles** (Array): An array of all ASI files for display purpose. 
 * - **totalASIFiles** (Number): The total number of ASI files found. 
 * - **errMsg** (String | null): An error message if the directory is not found, otherwise null.
 * - **hitStdASI** (Object): An object with arrays for each osu! std hit ASI type (hit0, hit50, hit100, etc.). 
 * - **playSkipASI** (Array): An array of ASI files related to play-skip. 
 * - **scorebarColourASI** (Array): An array of ASI files related to scorebar-colour. 
 * - **menuBackASI** (Array): An array of ASI files related to menu-back. 
 * - **followpointASI** (Array): An array of ASI files related to followpoint. 
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

    const allASIFiles = []

    let totalASIFiles = 0
    let errMsg = null
    
    const collectHitStdASIFiles = (file) => {
        const key = Object.keys(hitStdASI).find(hitStd => hitStd == file.split(/-\d+/)[0])
        if (key) {
            hitStdASI[key].push(file)
            allASIFiles.push(file)
        }
        
    }

    const collectNonGroupedASIFiles = (file, pattern, collector) => {
        if (file.includes(pattern)) {
            collector.push(file)
            allASIFiles.push(file)
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
        // errMsg = `No such directory of name: ${skinDirPath}`
        errMsg = error
    }

    totalASIFiles = allASIFiles.length

    return [
        allASIFiles,
        totalASIFiles, 
        errMsg,
        hitStdASI,
        playSkipASI,
        scorebarColourASI,
        menuBackASI,
        followpointASI
    ]
}

module.exports = {
    getAllASIFiles,
    naturalSort
}