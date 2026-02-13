export function syncViewportToTransform(maxTries = 10, delay = 0, transform, viewportRef, setCanShowPlots, targetX, targetY) {
    let tries = 0
    const sync = () => {
        const { positionX, positionY, scale } = transform.state
        const newViewport = {
            x: -positionX / scale,
            y: -positionY / scale,
        }

        // if close enough to target or max tries hit
        const diffX = Math.abs(targetX) - Math.abs(newViewport.x)
        const diffY = Math.abs(targetY) - Math.abs(newViewport.y)
        // console.log(newViewport.x, newViewport.y, targetX, targetY)
        // console.log({diffX, diffY})
        if ((diffX < 1 && diffY < 1) || tries >= maxTries) {
            // console.log({ tries })
            // console.log("New Viewport: ", newViewport)
            viewportRef.current.x = newViewport.x
            viewportRef.current.y = newViewport.y
            // console.log({ newViewportX: newViewport.x, newViewportY: newViewport.y })
            setCanShowPlots(true)
            return
        }

        tries++
        requestAnimationFrame(sync)
    }

    // optional slight delay to allow setTransform to kick in
    setTimeout(() => requestAnimationFrame(sync), delay)
}

export function getCenteringFactor(screenWidth) {
    const slope = screenWidth > 1260 ? 0.001024 : screenWidth > 400 ? 0.001120 : screenWidth > 350 ? 0.001080 : 0.001
    return slope * screenWidth + 0.227
}

// const cityConfig = {
//         totalPlots: 1000,
//         landPlots: 975,
//         waterPlots: 25,
//         naturalResourcePlots: 25,
//         landPlotLayers: 5,
//         waterPlotLayers: 6,

//         maxPerPlot: {
//             landPlants: 378,
//             waterPlants: 45,
//             landAnimals: 252,
//             aquaticAnimals: 450, 
//             airAnimalsLand: 36,
//             airAnimalsWater: 18,
//             naturalResourcesLand: 400,
//             naturalResourcesWater: 100
//         },

//         maxPerLayer: {
//             landPlants: 378,
//             waterPlants: 45,
//             landAnimals: 252,
//             aquaticAnimals: 100,
//             airAnimalsLand: 36,
//             airAnimalsWater: 18,
//             naturalResources: 100
//         },

//         waterPlotIds: [
//             525, 526, 527, 576, 577,
//             627, 628, 678, 679, 680,
//             729, 730, 780, 781, 782,
//             783, 831, 832, 833, 882,
//             883, 884, 933, 934, 935
//         ],

//         plants: {
//             land: [
//                 { name: "autumnRedTree", quantity: 36855, layers: [0] }, // 10%
//                 { name: "greenTree", quantity: 147420, layers: [0] }, // 40%
//                 { name: "pineTree", quantity: 110565, layers: [0] }, // 30%
//                 { name: "cherryBlossomTree", quantity: 36855, layers: [0] }, // 10%
//                 { name: "autumnOrangeTree", quantity: 36855, layers: [0] }, // 10%
//             ],
//             water: [
//                 { name: "waterLily", quantity: 1125, layers: [5] } // 100%
//             ],
//         },

//         animals: {
//             land: [
//                 { name: "whiteSheep", quantity: 35000, layers: [0] },
//                 { name: "brownWolf", quantity: 1000, layers: [0] },
//                 { name: "brownHorse", quantity: 35000, layers: [0] },
//                 { name: "brownChicken", quantity: 35000, layers: [0] },
//                 { name: "brownWhiteCow", quantity: 35000, layers: [0] },
//                 { name: "brownDeer", quantity: 15000, layers: [0] },
//                 { name: "brownBear", quantity: 100, layers: [0] },
//                 { name: "brownWhiteGoat", quantity: 15000, layers: [0] },
//                 { name: "coyote", quantity: 8900, layers: [0] },
//             ],
//             aquatic: [ // not more than 12500 === 100 * 5 * 25
//                 { name: "catfish", quantity: 3000, layers: [1] },
//                 { name: "salmon", quantity: 3000, layers: [1, 2] },
//                 { name: "sardine", quantity: 3650, layers: [2, 3] },
//                 { name: "lobster", quantity: 349, layers: [3, 4] },
//                 { name: "shark", quantity: 1250, layers: [3, 4] },
//                 { name: "lochnessMonster", quantity: 1, layers: [5] },
//             ],
//             air: [ 
//                 { name: "woodPecker", env: "land", quantity: 12000, layers: [0] },
//                 { name: "hawk", env: "land", quantity: 500, layers: [0] },
//                 { name: "raven", env: "land", quantity: 3000, layers: [0]},
//                 { name: "seagull", env: "water", quantity: 450, layers: [0]},
//                 { name: "piegon", env: "land", quantity: 13700, layers: [0]},
//                 { name: "bat", env: "land", quantity: 5000, layers: [0]},
//                 { name: "owl", env: "land", quantity: 300, layers: [0]},
//                 { name: "falcon", env: "land", quantity: 600, layers: [0]},
//             ],
//         },

//         naturalResourceWater: [{ // not more than 300 === 3 * 100 * 1 layer
//             name: "gold",
//             blessedPlots: [526, 781, 883], // 3
//             quantity: 300,
//             layers: [5],
//         }],

//         naturalResourceLand: [{ // not more than 8800 === 22 * 100 * 4 layers 
//             name: "gold",
//             blessedPlots: [
//             476, 477, 524, 528,
//             626, 629, 630, 728, 731,
//             732, 733, 778, 779, 784,
//             785, 834, 885, 931, 932,
//             201, 342, 48

//         ], // 22
//             quantity: 5280, // 60%
//             layers: [1, 2, 3, 4],
//         }]
//     }

const PLOT_WIDTH = 1680 
const PLOT_HEIGHT = 1500

export function isWithinBuffer(plot, viewport, buffer) {
    const { x, y, width, height } = viewport
    return (
        plot.x >= x - buffer &&
        plot.x <= x + width + buffer &&
        plot.y >= y - buffer &&
        plot.y <= y + height + buffer
    )
}

export function isPlotVisible(plot, viewport, plotWidth = PLOT_WIDTH, plotHeight = PLOT_HEIGHT) {
    // if (plot.id === 779) console.log({ viewport, plotX: plot.x, plotY: plot.y, plotHeight, plotWidth })
    return (
        (plot.x - plot.skewOffset) + (plotWidth + plot.skewOffset) >= viewport.x &&
        (plot.x - plot.skewOffset) <= viewport.x + viewport.width &&
        plot.y + plotHeight >= viewport.y &&
        plot.y <= viewport.y + viewport.height
    )
}

// const waterPlotIds = generateWaterClusters(`{${myCity?.name}-${myCity?._id}`, cityConfig.waterPlots)
export function generateWaterClusters(seed, totalWaterPlots, gridWidth = 50, gridHeight = 20, clusterCount = 3) {
    const rng = seededRandom(betterHash(seed))
    const indices = new Set()

    const plotsPerCluster = Math.ceil(totalWaterPlots / clusterCount);

    for (let c = 0; c < clusterCount; c++) {
        const centerX = Math.floor(rng() * gridWidth)
        const centerY = Math.floor(rng() * gridHeight)

        let added = 0
        while (added < plotsPerCluster && indices.size < totalWaterPlots) {
            const dx = Math.floor(rng() * 5) - 2 // range: -2 to 2
            const dy = Math.floor(rng() * 5) - 2

            const x = centerX + dx
            const y = centerY + dy

            if (x >= 0 && x < gridWidth && y >= 0 && y < gridHeight) {
                const index = y * gridWidth + x
                if (!indices.has(index)) {
                    indices.add(index)
                    added++
                }
            }
        }
    }

    return indices
}

export function arraysEqualUnordered(a, b) {
    if (a.length !== b.length) return false;

    const setA = new Set(a);
    const setB = new Set(b);

    if (setA.size !== setB.size) return false;

    for (const item of setA) {
        if (!setB.has(item)) return false;
    }

    return true;
}

export function generateRepeatedPositions(basePositions, gridCols = 3, gridRows = 3, totalWidth = 1680, totalHeight = 1500) {
    // console.log("Genearating")
    const cellWidth = totalWidth / gridCols;
    const cellHeight = totalHeight / gridRows;

    const repeated = [];

    for (let row = 0; row < gridRows; row++) {
        for (let col = 0; col < gridCols; col++) {
            const dx = col * cellWidth;
            const dy = row * cellHeight;

            for (const [x, y] of basePositions) {
                repeated.push([x + dx, y + dy]);
            }
        }
    }

    return repeated
}

// export const landPlantPositions = [
//     [90, 180], [120, 110], [120, 250], [180, 280], [180, 100], [250, 100], [180, 190],
//     [320, 110], [390, 160], [250, 160], [320, 190], [410, 260], [320, 280], [230, 260],
//     [550, 180], [510, 100], [570, 100], [440, 90], [390, 100], [490, 200], [440, 180],
//     [90, 430], [170, 470], [370, 340], [210, 350], [280, 350], [130, 360], [320, 390],
//     [380, 410], [260, 410], [420, 490], [220, 490], [470, 410], [170, 410], [320, 490],
//     [500, 490], [500, 340], [580, 340], [420, 340], [470, 270], [550, 270], [550, 430]
// ]

export const landPlantPositions = [
  // top-left corner (2)
  [90, 90],
  [120, 120],

  // top-right corner (2)
  [580, 90],
  [550, 120],

  // bottom-right corner (2)
  [550, 490],
  [590, 450],

  // bottom-left corner (2)
  [200, 490],
  [120, 450],

  // circular pattern (22)
  [335, 170], [380, 180], [420, 200], [460, 230], [495, 270], [515, 300],
  [505, 340], [480, 380], [445, 415], [405, 445], [360, 460],
  [315, 460], [270, 445], [230, 415], [195, 380], [170, 340],
  [160, 300], [175, 270], [205, 230], [245, 200], [290, 180],

  // inner soft fill
  [335, 300]
]

export const landAnimalPositions = [
    [130, 80], [100, 140], [140, 170],
    [120, 400], [120, 460], [240, 380],
    [450, 60], [460, 190], [510, 80],
    [450, 440], [580, 200], [500, 120]
]
// export const landAnimalPositions = [
//     [130, 80], [160, 100], [230, 80], [140, 140], [100, 140], [200, 180], [140, 170],
//     [100, 330], [120, 400], [200, 430], [120, 460], [100, 270], [230, 340], [240, 380],
//     [450, 60], [410, 150], [460, 190], [410, 230], [510, 80], [410, 100], [500, 230],
//     [500, 290], [580, 290], [550, 340], [450, 440], [540, 230], [580, 200], [500, 120]
// ]

export const waterPlantPositions = [
    [100, 100],
    [200, 130],
    [300, 90],
    [150, 170],
    [250, 150],
]

export const aquaticAnimalPositions = [
    [70, 70],[120, 70],[170, 70],[220, 70],[270, 70],[320, 70],[370, 70],[420, 70],[470, 70],[520, 70],
    [70, 110],[120, 110],[170, 110],[220, 110],[270, 110],[320, 110],[370, 110],[420, 110],[470, 110],[520, 110],
    [70, 150],[120, 150],[170, 150],[220, 150],[270, 150],[320, 150],[370, 150],[420, 150],[470, 150],[520, 150],
    [70, 190],[120, 190],[170, 190],[220, 190],[270, 190],[320, 190],[370, 190],[420, 190],[470, 190],[520, 190],
    [70, 230],[120, 230],[170, 230],[220, 230],[270, 230],[320, 230],[370, 230],[420, 230],[470, 230],[520, 230]
]

export const airAnimalsLandPositions = [
    [330, 150],
    [150,  300],
    [510, 300],
    [330, 450],
]

export const airAnimalsWaterPositions = [
    [150, -10],
    [250, 0],
]

export const naturalResourcePositions = [
    [1691, 176], [165, 458], [413, 1332], [1236, 1487], [868, 251], [974, 912], [510, 642], [1395, 414], [237, 1570], [1528, 1002],
    [1102, 236], [252, 988], [1142, 1503], [1733, 474], [683, 607], [384, 909], [1495, 1160], [201, 213], [1316, 566], [1613, 1335],
    [1360, 258], [799, 1011], [265, 1416], [1106, 645], [480, 1473], [1391, 770], [331, 375], [924, 1214], [1294, 1255], [734, 310],
    [581, 1575], [1055, 440], [1656, 850], [433, 1173], [243, 701], [893, 193], [1406, 1064], [1070, 809], [499, 904], [726, 1386],
    [1510, 1326], [162, 1518], [1784, 238], [1631, 1462], [995, 1508], [257, 528], [1356, 1320], [607, 1510], [1586, 667], [840, 1300],
    [784, 770], [426, 1055], [286, 248], [1106, 1001], [1472, 822], [1012, 255], [1561, 241], [1512, 1458], [200, 1231], [1673, 1075],
    [1687, 1567], [859, 1474], [672, 492], [453, 782], [766, 1048], [1612, 1225], [952, 741], [288, 228], [1283, 394], [1328, 967],
    [316, 1490], [620, 265], [1424, 623], [1723, 801], [1020, 1235], [348, 1076], [493, 400], [888, 600], [1357, 1165], [1716, 340],
    [228, 853], [1261, 803], [264, 1285], [734, 1560], [1066, 418], [422, 1576], [1421, 957], [622, 1244], [793, 1499], [1785, 558],
    [468, 268], [1187, 1054], [945, 190], [224, 468], [1213, 709], [770, 1153], [876, 1357], [1090, 830], [259, 1476], [1534, 814]
]

export function areMapsEqual(mapA, mapB) {
    if (mapA.size !== mapB.size) return false

    for (let [key, value] of mapA) {
        if (!mapB.has(key)) return false

        const other = mapB.get(key)
        if (shallowDiff(value, other)) return false
    }

    return true
}
export const shallowObjectEqual = (a = {}, b = {}) => {
    const aKeys = Object.keys(a ?? {})
    const bKeys = Object.keys(b ?? {})
    if (aKeys.length !== bKeys.length) return false
    return aKeys.every(k => a[k] === b[k])
}
export function shallowDiff(objA, objB) {
    const keysA = Object.keys(objA)
    const keysB = Object.keys(objB)

    if (keysA.length !== keysB.length) return true

    for (let key of keysA) {
        if (objA[key] !== objB[key]) return true
    }

    return false
}

export const updateCount = (max, currentCount, growthTime, lastGenerated) => {
    if (isNaN(currentCount) || currentCount === max) return currentCount
    const tDiff = Date.now() - (lastGenerated ?? 0)
    const quantityRegenerated = Math.floor(tDiff/growthTime)
    if (quantityRegenerated === 0) return currentCount
    return Math.min(max, currentCount + quantityRegenerated)
}

export const markEntityReady = (entity, plotId, growthQueueRef) => { 
    const plotQueue = growthQueueRef.current.get(plotId) || []
    const filtered = plotQueue.filter(e => e.id !== entity.id)
    filtered.push(entity)
    growthQueueRef.current.set(plotId, filtered)
}

export const tanSkew = Math.tan((-30 * Math.PI) / 180)

export function betterHash(str) {
    let h = 2166136261 >>> 0;
    for (let i = 0; i < str.length; i++) {
        h ^= str.charCodeAt(i);
        h = Math.imul(h, 16777619);
    }
    return h >>> 0;
}

export function seededRandom(seed) {
    return function() {
        seed = (seed ^ 0x6D2B79F5) + (seed << 1) + (seed >>> 1)
        seed |= 0
        return ((seed >>> 0) / 0x100000000)
    }
}

export const BUFFER_TYPES = {
    view: 2000,
    fetch: 0,
}

// Helper to evenly distribute total quantity across plots
function distributeToPlots(items, eligiblePlots, maxPerPlot, rng) {
    const result = new Map()
    const usedCapacity = new Map()
    for (const plot of eligiblePlots) {
        result.set(plot.id, [])
        usedCapacity.set(plot.id, 0)
    }

    const remainingItems = new Map()
    for (const item of items) {
        remainingItems.set(item.name, item.quantity)
    }

    let totalRemaining = items.reduce((sum, i) => sum + i.quantity, 0)

    while (totalRemaining > 0) {
        let progress = false

        // Shuffle plots each round for fairness
        const shuffledPlots = [...eligiblePlots]
        for (let i = shuffledPlots.length - 1; i > 0; i--) {
            const j = Math.floor(rng() * (i + 1))
            // You must use a semicolon when a line starts with: [(`
            ;[shuffledPlots[i], shuffledPlots[j]] = [shuffledPlots[j], shuffledPlots[i]]
        }

        for (const plot of shuffledPlots) {
        const id = plot.id
        const capacityLeft = maxPerPlot - usedCapacity.get(id)
        if (capacityLeft <= 0) continue

        const availableItems = items.filter(i => remainingItems.get(i.name) > 0)
        if (availableItems.length === 0) break

        // Pick a random number of types based on what's available
        const maxTypes = availableItems.length
        const typeCount = Math.max(1, Math.floor(rng() * maxTypes) + 1) // ensure at least 1

        // Shuffle available items
        const shuffledItems = [...availableItems]
        for (let i = shuffledItems.length - 1; i > 0; i--) {
            const j = Math.floor(rng() * (i + 1))
            ;[shuffledItems[i], shuffledItems[j]] = [shuffledItems[j], shuffledItems[i]]
        }

        const selectedItems = shuffledItems.slice(0, typeCount)

        for (const item of selectedItems) {
            const remainingQty = remainingItems.get(item.name)
            const plotUsed = usedCapacity.get(id)
            const spaceLeft = maxPerPlot - plotUsed
            if (remainingQty <= 0 || spaceLeft <= 0) continue

            const maxAssign = Math.min(remainingQty, spaceLeft)
            const assignQty = 1 + Math.floor(rng() * maxAssign)

            let plotItems = result.get(id)
            let plotItemEntry = plotItems.find(e => e.name === item.name)
            if (plotItemEntry) {
            plotItemEntry.quantity += assignQty
            } else {
                const { layers, entityConfig } = items.find(mainItem => mainItem.name === item.name)
                plotItems.push({ name: item.name, quantity: assignQty, layers, entityConfig })
            }

            usedCapacity.set(id, plotUsed + assignQty)
            remainingItems.set(item.name, remainingQty - assignQty)
            totalRemaining -= assignQty

            progress = true
        }
        }

        if (!progress) break
    }

    return result
}

export const assignPlotData = (cityConfig, plots, myCity, cityRng) => {
    // console.log({cityId: myCity?._id, cityConfig, plots:plots?.length })
    if (!myCity?._id || !cityConfig || !plots || !cityRng) return
    // console.log("ASSIGNING")
    const rng = cityRng

    // Filter plot types
    const landPlots = plots.filter(p => !p.waterPatch)
    const waterPlots = plots.filter(p => p.waterPatch)
    const naturalResourceLandPlotsSet = new Set(cityConfig.naturalResourceLand[0].blessedPlots)
    const naturalResourceWaterPlotsSet = new Set(cityConfig.naturalResourceWater[0].blessedPlots)
    const naturalResourceLandPlots = plots.filter(p => naturalResourceLandPlotsSet.has(p.id))
    const naturalResourceWaterPlots = plots.filter(p => naturalResourceWaterPlotsSet.has(p.id))

    // 1. Assign Plants
    const landPlantMap = distributeToPlots(cityConfig.plants.land, landPlots, (cityConfig.maxPerPlot.landPlants), rng)
    const waterPlantMap = distributeToPlots(cityConfig.plants.water, waterPlots, (cityConfig.maxPerPlot.waterPlants), rng)

    // 2. Assign Land Animals
    const landAnimalMap = distributeToPlots(cityConfig.animals.land, landPlots, (cityConfig.maxPerPlot.landAnimals), rng)

    // 3. Assign Aquatic Animals
    const waterAnimalMap = distributeToPlots(cityConfig.animals.aquatic, waterPlots, (cityConfig.maxPerPlot.aquaticAnimals), rng)

    // 4. Assign Air Animals based on their environment
    const airLand = cityConfig.animals.air.filter(a => a.env === "land")
    const airWater = cityConfig.animals.air.filter(a => a.env === "water")

    const airLandMap = distributeToPlots(airLand, landPlots, (cityConfig.maxPerPlot.airAnimalsLand), rng)
    const airWaterMap = distributeToPlots(airWater, waterPlots, (cityConfig.maxPerPlot.airAnimalsWater), rng)

    // 5. Assign Natural Resources
    const natruralLandResourceMap = distributeToPlots(cityConfig.naturalResourceLand, naturalResourceLandPlots, cityConfig.maxPerPlot.naturalResourcesLand, rng)
    const natruralWaterResourceMap = distributeToPlots(cityConfig.naturalResourceWater, naturalResourceWaterPlots, cityConfig.maxPerPlot.naturalResourcesWater, rng)

    // function validateDistribution(label, items, map) {
    //     const assigned = [...map.values()].flat()
    //     const totalAssigned = assigned.reduce((sum, { quantity }) => sum + quantity, 0)
    //     const totalExpected = items.reduce((sum, { quantity }) => sum + quantity, 0)
    //     const isMatch = totalAssigned === totalExpected

    //     console.log(`🔍 ${label}`)
    //     console.log("   ➤ Total assigned:", totalAssigned)
    //     console.log("   ➤ Total expected:", totalExpected)
    //     console.log("   ✅ Match:", isMatch)
    //     if (!isMatch) {
    //         console.warn("   ⚠️ MISMATCH detected in:", label)
    //     }
    // }

    // validateDistribution("🌱 Land Plants", cityConfig.plants.land, landPlantMap)
    // validateDistribution("💧 Water Plants", cityConfig.plants.water, waterPlantMap)

    // validateDistribution("🐾 Land Animals", cityConfig.animals.land, landAnimalMap)
    // validateDistribution("🐟 Aquatic Animals", cityConfig.animals.aquatic, waterAnimalMap)

    // validateDistribution("🕊️ Air Animals (Land)", airLand, airLandMap)
    // validateDistribution("🕊️ Air Animals (Water)", airWater, airWaterMap)
    
    // validateDistribution("🪙 Natural Resources (Land)", cityConfig.naturalResourceLand, natruralLandResourceMap)
    // validateDistribution("🪙 Natural Resources (Water)", cityConfig.naturalResourceWater, natruralWaterResourceMap)

    // Merge the results into final plots
    
    return plots.map(plot => {
        const plotId = plot.id
        const isWater = plot?.waterPatch
        const isResourceWaterPlot = isWater && naturalResourceWaterPlotsSet.has(plotId)
        const isResourceLandPlot =  !isWater && naturalResourceLandPlotsSet.has(plotId)
        // if (plotId === 640) console.log("PLOT DATA: ", {
        //     ...plot,
        //     ...(isWater ? {waterPlants: waterPlantMap.get(plotId)} : {landPlants: landPlantMap.get(plotId)}),
        //     ...(isWater ? {aquaticAnimals: waterAnimalMap.get(plotId)} : {landAnimals: landAnimalMap.get(plotId)}),
        //     airAnimals: isWater ? airWaterMap.get(plotId) : airLandMap.get(plotId), 
        // })

        // console.log("assign done")
        return {
            ...plot,
            ...(isWater ? {waterPlants: waterPlantMap.get(plotId)} : {landPlants: landPlantMap.get(plotId)}),
            ...(isWater ? {aquaticAnimals: waterAnimalMap.get(plotId)} : {landAnimals: landAnimalMap.get(plotId)}),
            airAnimals: isWater ? airWaterMap.get(plotId) : airLandMap.get(plotId), 
            ...(isResourceLandPlot ? {naturalResource: natruralLandResourceMap.get(plotId)} 
            : isResourceWaterPlot ? {naturalResource: natruralWaterResourceMap.get(plotId)} 
            : {})
        }
    })
}

const newLandPlantPositions = generateRepeatedPositions(landPlantPositions)
const newLandAnimalPositions = generateRepeatedPositions(landAnimalPositions)
const newAirLandPositions = generateRepeatedPositions(airAnimalsLandPositions)
const newWaterPlantPositions = generateRepeatedPositions(waterPlantPositions)
const newAquaticAnimalPositions = generateRepeatedPositions(aquaticAnimalPositions)
const newAirWaterPositions = generateRepeatedPositions(airAnimalsWaterPositions)

const distributeToLayers = (items, layerCount, maxPerLayer) => {
    const distribution = Array(layerCount).fill(null).map(() => [])

    for (const item of items) {
        let remaining = item.quantity
        const preferred = item.layers
        let lastPreferred = -1

        // Step 1: Fill preferred layers
        for (const layer of preferred) {
            if (remaining <= 0) break
            const currentLayerTotal = distribution[layer].reduce((sum, i) => sum + i.quantity, 0)
            const space = maxPerLayer - currentLayerTotal
            if (space > 0) {
                const assign = Math.min(space, remaining)
                distribution[layer].push({ ...item, quantity: assign })
                remaining -= assign
            }
            lastPreferred = Math.max(lastPreferred, layer)
        }

        // Step 2: Spill into layers after lastPreferred (wrap around), skipping preferred
        let start = (lastPreferred + 1) % layerCount
        for (let i = 0; i < layerCount && remaining > 0; i++) {
            const idx = (start + i) % layerCount
            if (preferred.includes(idx)) continue
            const currentLayerTotal = distribution[idx].reduce((sum, i) => sum + i.quantity, 0)
            const space = maxPerLayer - currentLayerTotal
            if (space > 0) {
                const assign = Math.min(space, remaining)
                distribution[idx].push({ ...item, quantity: assign })
                remaining -= assign
            }
        }
    }

    return distribution
}

export const generateLayersForPlot = (plot, myCity, cityConfig, cityRng) => {
    if (!plot || !myCity?._id || !cityConfig) return
    const rng = cityRng

    const isWaterPlot = plot.waterPatch
    const isNaturalResourcePlot = plot.naturalResource
    const layerCount = isWaterPlot ? cityConfig.waterPlotLayers : cityConfig.landPlotLayers
    const wallData = isWaterPlot ? {t: false, l: false, r: false, b: false} : {t: true, l: true, r: true, b: true} 
    const wallStrengthMatrix = isWaterPlot ? [0,0,0,0] : [100,100,100,100]
    const directions = ["t", "b", "l", "r"]

    const extractedData = {
        plant: isWaterPlot ? plot.waterPlants : plot.landPlants,
        animal: isWaterPlot ? plot.aquaticAnimals : plot.landAnimals,
        airAnimal: plot.airAnimals,
        ...(isNaturalResourcePlot ? { naturalResource: plot.naturalResource } : {})
    }

    const maxPerLayer = cityConfig?.maxPerLayer
    if (!maxPerLayer) return
    const extractedMaxes = {
        plantMax: isWaterPlot ? maxPerLayer.waterPlants : maxPerLayer.landPlants,
        animalMax: isWaterPlot ? maxPerLayer.aquaticAnimals : maxPerLayer.landAnimals,
        airAnimalMax: isWaterPlot ? maxPerLayer.airAnimalsWater : maxPerLayer.airAnimalsLand, 
        ...(isNaturalResourcePlot ? { naturalResourceMax: maxPerLayer.naturalResources } : {})
    }

    const extractedQuantities = {
        plant: 0,
        animal: 0,
        airAnimal: 0,
        ...(isNaturalResourcePlot ? { naturalResource: 0 } : {})
    }

    const extractedPositions = {
        plant: isWaterPlot ? newWaterPlantPositions : newLandPlantPositions,
        animal: isWaterPlot ? newAquaticAnimalPositions : newLandAnimalPositions,
        airAnimal: isWaterPlot ? newAirWaterPositions : newAirLandPositions,
        ...(isNaturalResourcePlot ? { naturalResource: naturalResourcePositions } : {})
    }

    Object.keys(extractedData).map((field, fidx) => {
        let totalQuantity = 0
        extractedData[field].map((fieldItem, itemIdx) => {
            totalQuantity += fieldItem.quantity
        })

        extractedQuantities[field] = totalQuantity
    })

    // console.log("EXTRACTED QUANTITIES: ", extractedQuantities)

    const plantDistribution = distributeToLayers(extractedData.plant, layerCount, extractedMaxes.plantMax)
    const animalDistribution = distributeToLayers(extractedData.animal, layerCount, extractedMaxes.animalMax)
    const airAnimalDistribution = distributeToLayers(extractedData.airAnimal, layerCount, extractedMaxes.airAnimalMax)
    const naturalResourceDistribution = (isNaturalResourcePlot
    ? distributeToLayers(extractedData.naturalResource, layerCount, extractedMaxes.naturalResourceMax)
    : null)
    // if ([476, 477].includes(plot.id)) {
    // console.log(`$PLOT${plot.id} PLANT DISTRIBUTION`, plantDistribution)
    // console.log(`$PLOT${plot.id} ANIMAL DISTRIBUTION`, animalDistribution)
    // console.log(`$PLOT${plot.id} AIR ANIMAL DISTRIBUTION`, airAnimalDistribution)
    // console.log(`$PLOT${plot.id} NR DISTRIBUTION`, naturalResourceDistribution)
    // }

    const isWater = plot.waterPatch
    const layers = []
    for (let layerNo = 0; ((layerNo < cityConfig.landPlotLayers && !isWaterPlot) || (layerNo < cityConfig.waterPlotLayers && isWaterPlot)); layerNo++) {
        const layerDist = {
            plant: plantDistribution[layerNo], 
            animal: animalDistribution[layerNo], 
            airAnimal: airAnimalDistribution[layerNo],
            ...(isNaturalResourcePlot ? {naturalResource: naturalResourceDistribution[layerNo]} : {})
        }
        // console.log(layerDist)

        const thisLayer = layerNo === 0 ? { name: `${layerNo}`, entities: [], earthlies: null } : { name: `${layerNo}`, entities: [], earthlies: null, walls: wallData, wallStrengthMatrix }

        let count = 0
        Object.keys(extractedPositions).forEach((resource) => {
            const resourcePositions = extractedPositions[resource]
            // console.log(`TOTAL ${resource} NEEDED FOR ${thisLayer.name}: `, totalNeeded)
            // console.log(`LAYER DIST FOR ${thisLayer.name}: `, layerDist[resource])

            // 1. Expand resource pool up to totalNeeded (or full quantity)
            const expanded = []
            for (let x = 0; x < layerDist[resource].length; x++) {
                const { name, quantity, entityConfig } = layerDist[resource]?.[x]
                // console.log(`NAME AND QUANTITY FOR ${thisLayer.name}: `, name, quantity)
                for (let y = 0; y < quantity; y++) {
                    expanded.push({name, entityConfig})
                }
            }
            // console.log(`EXPANDED ARRAY FOR ${thisLayer.name}: `, expanded)

            // 2. Zip with positions
            const layerItems = expanded.map((typeName, idx) => {
                count++
                const pos = resourcePositions[idx]
                const { name, entityConfig } = typeName
                const { stride, ...rest } = entityConfig ?? {}

                if (!pos) return null

                const base = { id: crypto.randomUUID(), t: name, p: pos, s: "grown", grp: resource, createdAt: 1740787200000, ...rest }

                if (resource === "animal" || resource === "airAnimal") {
                    return {
                        ...base,
                        base: pos,
                        stride: (stride - 10) + Math.floor(rng() * 10),
                        f: directions[Math.floor(rng() * 4)],
                        dl: rng() * 5,
                        ...(resource === "airAnimal" ? {rn: rng() * 3} : {})
                    }
                }

                return base
            }).filter(Boolean)

            thisLayer.entities.push(...layerItems)
        })
        const woodenAxe = { id: crypto.randomUUID(), t: "wooden axe", p: [300, 1550], s: "new", grp: "object", energy: 100, dna: null }
        const entitesRequired = isWater ? cityConfig.waterEarthlies : layerNo > 0 ? { land: cityConfig.landEarthlies.land} : cityConfig.landEarthlies
        thisLayer.entities.push(woodenAxe)
        thisLayer.earthlies = entitesRequired
        layers.push(thisLayer)
        // console.log(plot.id, "LAYERS: ", layers)
    }

    return { layers }
}

export const emitUserMovement = (socket, payload, emitView) => {
    if (!payload || !emitView || emitView?.length === 0) return
    socket.emit("moveMyUser", {...payload, emitView: emitView})
}

export const handleMoveUser = (event, socket, myCoords, setMyCoords, layerCacheRef, usersInView, emitView, moveCoolDown, myBoundRef, layerIdx, 
sendAction, cityId, holdingWeight, ridingEntityRef=null) => {
    event.preventDefault()
    const myStats = myCoords.userStyleId.stats
    if (event.repeat || !socket || myCoords.held || !cityId || myStats.health <= 0) return
    if (moveCoolDown.current) return
    moveCoolDown.current = true

    setTimeout(() => {
        moveCoolDown.current = false
    }, 100)

    const { x: currX, y: currY, plotId: currentPlotId } = myCoords
    const stride = !ridingEntityRef ? 40 : (ridingEntityRef.ins === "ride-run") ? Math.round(ridingEntityRef.stride * 1.2) : ridingEntityRef.stride

    const directions = {
        ArrowUp: { dx: 0, dy: -stride, f: 't' },
        ArrowDown:{ dx: 0, dy: +stride, f: 'b' },
        ArrowLeft: { dx: -stride, dy: 0, f: 'l' },
        ArrowRight: { dx: +stride, dy: 0, f: 'r' },
        w: { dx: 0, dy: -stride, f: 't' },
        s: { dx: 0, dy: +stride, f: 'b' },
        a: { dx: -stride, dy: 0, f: 'l' },
        d: { dx: +stride, dy: 0, f: 'r' },
    }

    const key = event.key?.length === 1 ? event.key?.toLowerCase() : event.key
    const move = directions[key]
    // console.log({ move, stride })
    
    let entityRiding = myCoords.riding
    if (!move) return
    const facing = move.f     
    const targetX = (currX + move.dx)
    const targetY = (currY + move.dy)

    const plotRef = myBoundRef.current
    if (!plotRef || !myStats || myStats.energy <= 0) return

    // calculate energy cost
    let modifiedStats
    if (!entityRiding) {
        const myWeight = myCoords.userStyleId.height + myCoords.userStyleId.width
        const energyCost = Math.round(((myWeight + (holdingWeight ?? 0))/myWeight) * 5)
        const threshold = 100
        const totalEnergyCost = Math.round(energyCost * (threshold/(threshold + myStats.endurance)))
        const actualEnergyCost = totalEnergyCost === 0 ? 1 : totalEnergyCost
        const energy = Math.max(myStats.energy - actualEnergyCost, 0)
        const endurance = energy === 0 ? myStats.endurance + 1 : myStats.endurance

        modifiedStats = { energy, lgn: myStats.energy === 100 ? Date.now() : myStats.lgn, endurance }
        const update = {
            stats: { energy: -actualEnergyCost, lgn: modifiedStats.lgn }
        }
        const savePayload = { action: "walk", myCoords, update, frontendLgn: modifiedStats.lgn, actualEnergyCost, cityId, emissionView: emitView }
        // console.log(savePayload)
        const data = sendAction(savePayload)
    }

    const {xOffset: xOffStr, yOffset: yOffStr, skewOffset: skewStr} = plotRef.dataset

    const tanSkew = Math.tan((-30 * Math.PI) / 180)
    const xOffset = parseFloat(xOffStr)
    const yOffset = parseFloat(yOffStr)
    const skewOffset = parseFloat(skewStr)
    const plotRect = plotRef.getBoundingClientRect()

    const rawX = xOffset + targetX
    const rawY = yOffset + targetY

    const unSkewedX = rawX + skewOffset + tanSkew * rawY

    // raw viewport values
    const viewX = plotRect.left + unSkewedX
    const viewY = plotRect.top + rawY
    // console.log({ unSkewedX, plotRectX: plotRect.x, viewX })

    const elements = document.elementsFromPoint(viewX, viewY)

    let mainElement = elements[0]
    let surfaceElement = null
    let baseSurface = null
    let newPlotId = null
    let wallPlotId = null
    let willStandOn = null
    let wallType = null
    let wallLoc = null 

    for (const el of elements) {
        const surfaceName = el.dataset.surfaceName
        // console.log(el)

        if (el.dataset.surfaceName === "wall") console.log("YES YOU GOT ME", el)

        if (!surfaceElement && (surfaceName === "land" || surfaceName === "water")) {
            surfaceElement = el
            baseSurface = el.dataset.surfaceName
            newPlotId = parseInt(el.dataset.plotId || "")
        }

        if (el === mainElement) {
            wallPlotId = el.dataset.wallPlotId ? parseInt(el.dataset.wallPlotId) : null
            wallType = el.dataset.wallType
            wallLoc = el.dataset.wallLoc ?? null
            willStandOn = surfaceName   
        }

        if (surfaceElement && newPlotId !== null && wallPlotId !== null) break
    }       

    const heldEntity = myCoords.holding
    const isHoldingUser = heldEntity?.userStyleId
    const otherUsersId = heldEntity?.userStyleId?.userId._id 
    const { userStyleId, ...movementPayload } = myCoords
    let payload
    
    if (layerIdx > 0) {
        const isOnWallNow = myCoords.on === "wall"
        const isMovingToWall = willStandOn === "wall"
        const isChangingWall = wallPlotId !== myCoords.wallPlotId || wallLoc !== myCoords.wallLoc
        const isChangingPlot = newPlotId !== currentPlotId

        // 🚫 Step 1: Block movement between walls on different plots
        if (isOnWallNow && isMovingToWall && isChangingWall) return

        // ✅ Step 2: Allow moving along a wall without changing plots
        if (isMovingToWall && isChangingPlot) {
            payload = { plotId: myCoords.plotId, layerIdx, x: Math.round(targetX), y: Math.round(targetY), on: "wall", wallPlotId, wallLoc, facing }
            emitUserMovement(socket, { _id: myCoords._id, ...payload, modifiedStats }, emitView.current)
            if (isHoldingUser) {
                const otherUser = usersInView.current.get(heldEntity._id)
                emitUserMovement(socket, { ...payload, _id: heldEntity._id, otherUsersId }, emitView.current)
                usersInView.current.set(otherUser._id, { ...otherUser, ...payload })
            }
            return setMyCoords(prev => ({ ...prev, ...payload, userStyleId: { ...prev.userStyleId, stats: { ...prev.userStyleId.stats, ...modifiedStats } } }))
        }

        // 🚫 Step 3: Prevent entering a new plot from the wall
        if (isOnWallNow && isChangingPlot) return

        // ✅ Step 4: Regular move within same plot or onto same wall
        if (!surfaceElement || !newPlotId || !isChangingPlot) {
            payload = { plotId: myCoords.plotId, layerIdx, x: Math.round(targetX), y: Math.round(targetY), on: willStandOn, wallPlotId, wallLoc, facing }
            emitUserMovement(socket, { _id: myCoords._id, ...payload, modifiedStats },  emitView.current)
            if (isHoldingUser) {
                const otherUser = usersInView.current.get(heldEntity._id)
                emitUserMovement(socket, { ...payload, _id: heldEntity._id, otherUsersId }, emitView.current)
                usersInView.current.set(otherUser._id, { ...otherUser, ...payload })
            }
            return setMyCoords(prev => ({ ...prev, ...payload, userStyleId: { ...prev.userStyleId, stats: { ...prev.userStyleId.stats, ...modifiedStats } } }))
        }
    }

    // outside the grid so keep the same plot Id or if moving within the same plot
    if (!surfaceElement || !newPlotId || myCoords.plotId === newPlotId) {
        payload = { plotId: myCoords.plotId, layerIdx, x: Math.round(targetX), y: Math.round(targetY), on: willStandOn, wallPlotId, wallLoc, facing }
        emitUserMovement(socket, { _id: myCoords._id, ...payload, modifiedStats },  emitView.current)
        if (isHoldingUser) {
            const otherUser = usersInView.current.get(heldEntity._id)
            emitUserMovement(socket, { ...payload, _id: heldEntity._id, otherUsersId }, emitView.current)
            usersInView.current.set(otherUser._id, { ...otherUser, ...payload })
        }
        return setMyCoords(prev => ({ ...prev, ...payload, userStyleId: { ...prev.userStyleId, stats: { ...prev.userStyleId.stats, ...modifiedStats } } }))
    }


    // within the grid and moving to a new plot
    const { xOffset: tXOffStr, yOffset: tYOffStr, skewOffset: tSkewStr, 
    width: tWidthStr, height: tHeightStr} = surfaceElement?.dataset

    const tXOffset = parseFloat(tXOffStr)
    const tYOffset = parseFloat(tYOffStr)
    const tSkewOffset = parseFloat(tSkewStr)
    const tWidth = parseFloat(tWidthStr)
    const tHeight = parseFloat(tHeightStr)
    const surfaceRect = surfaceElement?.getBoundingClientRect()

    const rawTargetX = viewX - surfaceRect.left
    const logicalY = viewY - surfaceRect.top
    const logicalX = rawTargetX - tSkewOffset - tanSkew * logicalY

    const localX = logicalX - tXOffset
    const localY = logicalY - tYOffset

    payload = { plotId: newPlotId, layerIdx, x: Math.round(localX), y: Math.round(localY), on: willStandOn, wallPlotId, wallLoc, facing }

    emitView.current = getSurroundingPlots(payload.plotId)
    emitUserMovement(socket, { _id: myCoords._id, ...payload, modifiedStats },  emitView.current)
    if (isHoldingUser) {
        const otherUser = usersInView.current.get(heldEntity._id)
        emitUserMovement(socket, { ...payload, _id: heldEntity._id, otherUsersId }, emitView.current)
        usersInView.current.set(otherUser._id, { ...otherUser, ...payload })
    }
    setMyCoords(prev => ({ ...prev, ...payload, userStyleId: { ...prev.userStyleId, stats: { ...prev.userStyleId.stats, ...modifiedStats } } }))
}

export const omit = (obj, isWater) => {
    const keys = isWater
    ? ['waterPlants', 'aquaticAnimals', 'airAnimals', 'naturalResource']
    : ['landPlants', 'landAnimals', 'airAnimals', 'naturalResource']
    return Object.fromEntries(Object.entries(obj).filter(([key]) => !keys.includes(key)))
}

export const getSurroundingPlots = (clickedCellId, cols = 50, rows = 20, ratio=1) => {
    if (!clickedCellId) return []
    const surroundingPlots = new Set()

    // Get row and column of the clicked cell
    const row = Math.floor((clickedCellId - 1) / cols)
    const col = (clickedCellId - 1) % cols

    // Loop through a 5x5 square around the clicked cell (distance of 1)
    for (let r = row - ratio; r <= row + ratio; r++) { // replace with 2 if you want 25
        for (let c = col - ratio; c <= col + ratio; c++) { // replace with 2 if you want 25
            // Check if it's within grid bounds
            if (r >= 0 && r < rows && c >= 0 && c < cols) {
                const cellId = r * cols + c + 1
                surroundingPlots.add(cellId)
            }
        }
    }

    // surroundingPlots.delete(clickedCellId) // Exclude the clicked cell itself
    return Array.from(surroundingPlots)
}

export const goFullscreen = (containerRef, setMyCoords, myBoundRef) => {
    const el = containerRef.current
    if (!el) return
    
    if (el.requestFullscreen) el.requestFullscreen()
    else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen()
    else if (el.msRequestFullscreen) el.msRequestFullscreen()
    myBoundRef.current?.focus({ preventScroll: true })
    setMyCoords(prev => ({...prev}))
}

export const handleSelectAction = async (action, myCity, filteredPlots, isCreatePlotLoading, clickActionRef, myCoords, rideActions, myBoundRef,
layerCacheRef, createPlot, emissionView, setFilteredPlots, finalPlots, actionsMap, fetchCity, origin  ) => {
    if (!action || !action.entity || !action.action || !myCity || !filteredPlots
    || isCreatePlotLoading || clickActionRef.current) return
    clickActionRef.current = true

    const myPlotId = myCoords.plotId
    const isPlotModified = filteredPlots.find(p => p.id === myPlotId).modified

    const actionName = action.action
    const actionEntity = action.entity
    if (!isPlotModified && !rideActions.includes(actionName)) {
        myBoundRef.current?.blur()
        const myPlotData = layerCacheRef.current.get(myPlotId)
        const newPlotData = await createPlot({ cityId: myCity._id, plotId: myPlotId, layers: myPlotData.layers, emitView: emissionView.current })
        if (!newPlotData || !newPlotData?.success) {
            myBoundRef.current?.focus()
            return clickActionRef.current = false
        }
        fetchCity(origin)
        myPlotData.layers = newPlotData.plot
        setFilteredPlots(prev => prev.map(p => p.id === myPlotId ? {...p, modified: true, layers: myPlotData.layers} : p))
        finalPlots[myPlotId - 1].modified = true
        myBoundRef.current?.focus()
        return clickActionRef.current = false
    }

    actionsMap[actionName]?.(actionName, actionEntity)

    clickActionRef.current = false
}

export const facingTranslator = {
    "t": "ArrowUp",
    "b": "ArrowDown",
    "l": "ArrowLeft",
    "r": "ArrowRight",
}