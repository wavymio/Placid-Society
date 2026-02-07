export const grassStyles = [
    'radial-gradient(circle at center, transparent 10%, rgba(0, 0, 0, 0.3))',
    `linear-gradient(rgba(0, 0, 0, 0.03) 33.33%, rgba(0, 0, 0, 0.1) 0, rgba(0, 0, 0, 0.05) 66.66%, rgba(0, 0, 0, 0.1) 0), linear-gradient(90deg, rgba(0, 0, 0, 0.03) 33.33%, rgba(0, 0, 0, 0.1) 0, rgba(0, 0, 0, 0.05) 66.66%, rgba(0, 0, 0, 0.1) 0)`,
    // 'repeating-radial-gradient(circle, rgba(0, 0, 0, 0.2) 0px, transparent 3px, transparent 5px)',
    // 'radial-gradient(circle at center, rgba(255,255,255,0.15), rgba(0,0,0,0.15))',
    // 'radial-gradient(circle at 40% 60%, rgba(0,0,0,0.4) 20%, transparent 100%)',
    'repeating-radial-gradient(circle, rgba(0, 0, 0, 0.15) 0px, rgba(0, 0, 0, 0.15) 1px, transparent 3px)'
]

// export const groupEntityMap = {
//     plant: plantTypes,
//     animal: animalTypes,
//     airAnimal: airAnimalTypes,
//     naturalResource: naturalResourceTypes,
//     food: foodTypes,
//     fruit: foodTypes,
//     leaf: foodTypes,
//     object: objectTypes,
//     resource: objectTypes,
//     element: objectTypes,
//     earthly: earthlyTypes
// }

// export const getClosestEntity = (entityList, myCoords, groupEntityMap) => {
//     let closestDist = Infinity
//     let closestEntity = entityList[0]
    
//     const ux = myCoords.x
//     const uy = myCoords.y
//     for (let i=0; i < entityList.length; i++) {
//         const theEntity = entityList[i]
//         const isUser = theEntity.userStyleId
//         const eh = isUser ? theEntity.userStyleId.height/2 : (groupEntityMap[theEntity.grp][theEntity.t]?.states[theEntity.s].size[0])/2
//         const ew = isUser ? theEntity.userStyleId.width/2 : (groupEntityMap[theEntity.grp][theEntity.t]?.states[theEntity.s].size[0])/2
//         const [ex, ey] = isUser ? [theEntity.x, theEntity.y] : theEntity.p
//         const dx = Math.abs((ex + ew) - ux)
//         const dy = Math.abs((ey + eh) - uy)

//         // const dist = dx + dy
//         const dist = Math.sqrt(dx * dx + dy * dy)

//         if (dist < closestDist) {
//             closestDist = dist
//             closestEntity = theEntity
//         }
//     }
//     return closestEntity
// }

export const getClosestEntity = (entityList, myCoords) => {
    const ux = myCoords.x
    const uy = myCoords.y
    
    let hypothenus = Infinity
    let closestEntity = entityList[0]
    // console.log({ entityList })
    const allHypos = []
    for (let count = 0; count < entityList.length; count++) {
        const theEntity = entityList[count]
        const isUser = theEntity.userStyleId
        const [ex, ey] = isUser ? [theEntity.x, theEntity.y] : theEntity.p

        const dx = Math.abs(ux - ex)
        const dy = Math.abs(uy - ey)
        // console.log({ ex, ey, dx, dy, ux, uy })
        const testHypothenus = Math.sqrt((dx * dx) + (dy * dy))
        allHypos.push(testHypothenus)
        if (testHypothenus < hypothenus) {
            closestEntity = theEntity
            hypothenus = testHypothenus
        } else if (testHypothenus === hypothenus) {
            const isCEUser = closestEntity.userStyleId
            const [cex, cey] = isCEUser ? [closestEntity.x, closestEntity.y] : closestEntity.p
            if (ex !== cex || ey !== cey) {
                if (cex < ex || cey < ey) {
                    closestEntity = theEntity
                    hypothenus = testHypothenus
                }
            }
        }
    }
    // console.log({ closestEntity })
    // console.log({ allHypos })
    return closestEntity
}

export const isIntersecting = (myCoords, entityX, entityY, entityH, entityW, scale = 1) => {
    const buffer = 30
    const entityLeft = (entityX - entityW) * scale
    const entityRight = entityX * scale
    const entityTop = (entityY - entityH) * scale
    const entityBottom = entityY * scale

    const myLeft = myCoords.x - myCoords.width
    const myRight = myCoords.x
    const myTop = myCoords.y - myCoords.height
    const myBottom = myCoords.y

    const horizontallyOverlaps = ((myRight + buffer) > entityLeft) && (entityRight > (myLeft - buffer))
    const verticallyOverlaps = ((myBottom + buffer) > entityTop) && (entityBottom > (myTop - buffer))

    return horizontallyOverlaps && verticallyOverlaps
}

export function getEntityP(entity, xSteps, ySteps, elapsedSec, plotMargins, walkToTarget, jitteredStride) {
    const stride = jitteredStride

    const baseX = entity.base[0]
    const baseY = entity.base[1]

    const totalX = stride * xSteps
    const totalY = stride * ySteps

    const boundR = plotMargins.r
    const boundB = plotMargins.b

    const xAdd = baseX + totalX <= boundR
    const xSecond = xAdd ? baseX + totalX : baseX - totalX
    const xF = walkToTarget ? (xAdd ? "r" : "l") : (xAdd ? "l" : "r")

    const yAdd = baseY + totalY <= boundB
    const ySecond = yAdd ? baseY + totalY : baseY - totalY
    const yF = walkToTarget ? (yAdd ? "b" : "t") : (yAdd ? "t" : "b")

    let px, py, f
    const going = walkToTarget

    if (elapsedSec < xSteps) {
        const t = elapsedSec + 1
        const factor = totalX * (going ? (t / xSteps) : ((xSteps - t) / xSteps))
        px = xAdd ? baseX + factor : baseX - factor
        py = going ? baseY : ySecond
        f = xF
    } else {
        const ySec = elapsedSec - xSteps + 1
        const factor = totalY * (going ? (ySec / ySteps) : ((ySteps - ySec) / ySteps))
        py = yAdd ? baseY + factor : baseY - factor
        px = going ? xSecond : baseX
        f = yF
    }

    const newP = [px, py]

    // console.log({ goingToBasePoint: !walkToTarget,basePoint: [baseX, baseY], secondPoint: [xSecond, ySecond] })
    // console.log({ timeSecond, newX: newP[0], newY: newP[1], targetX: target[0],targetY: target[1] })
    // console.log({ xSteps, ySteps, f, elapsedSec })
    // console.log("---------------------------------------------")

    return { newP, f }
}

export function walkToNewBase(entity, xSteps, ySteps, elapsedSec, plotMargins, jitteredStride) {
    const stride = jitteredStride

    const baseX = entity.base[0]
    const baseY = entity.base[1]

    const totalX = stride * xSteps
    const totalY = stride * ySteps

    const boundR = plotMargins.r
    const boundB = plotMargins.b

    const tempTargetX = baseX + totalX 
    const isTempXRight = tempTargetX > boundR ? false : tempTargetX + totalX <= boundR ? false : true 
    // const xPrevBase = isTempXRight ? tempTargetX : baseX - totalX
    const xF = isTempXRight ? "l" : "r"
    
    const tempTargetY = baseY + totalY 
    const isTempYRight = tempTargetY > boundB ? false : tempTargetY + totalY <= boundB ? false : true 
    const yPrevBase = isTempYRight ? tempTargetY : baseY - totalY
    const yF = isTempYRight ? "t" : "b"

    let px, py, f

    if (elapsedSec < xSteps) {
        const t = elapsedSec + 1
        const factor = totalX * ((xSteps - t) / xSteps)
        px = isTempXRight ? baseX + factor : baseX - factor
        py = yPrevBase
        f = xF
    } else {
        const ySec = elapsedSec - xSteps + 1
        const factor = totalY * ((ySteps - ySec) / ySteps)
        py = isTempYRight ? baseY + factor : baseY - factor
        px = baseX
        f = yF
    }

    const newP = [px, py]

    // console.log({ goingToBasePoint: !walkToTarget,basePoint: [baseX, baseY], secondPoint: [xSecond, ySecond] })
    // console.log({ timeSecond, newX: newP[0], newY: newP[1], targetX: target[0],targetY: target[1] })
    // console.log({ xSteps, ySteps, f, elapsedSec })
    // console.log("---------------------------------------------")

    return { newP, f }
}