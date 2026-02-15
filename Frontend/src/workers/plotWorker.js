import { getClosestEntity, getEntityP, isIntersecting, walkToNewBase } from '../lib/plotUtils.js'
import { seededRandom, betterHash, updateCount } from '../lib/cityUtils.js'
import { isItemVisible } from '../lib/entityUtils.js'

function getCurrentAction(timetable, hour) {
    let action = timetable[0][1]

    for (const [startHour, act] of timetable) {
        if (startHour <= hour) action = act
        else break
    }

  return action
}

const restActions = ["sleep", "rest", "catch-breath"]

const getNewState = (currentMs, stateList, createdAt, transform) => {
    let regenState
    let msLeft

    for (let x=0; x < stateList.length; x++) {
        const theState = stateList[x]
        const stateMultiplier = stateList.length - (x+1) 
        const msSinceCreation = (currentMs - createdAt)
        const transformThreshold = (stateMultiplier * transform)
        if (msSinceCreation >= transformThreshold) {
            regenState = theState
            msLeft = msSinceCreation - transformThreshold
            break
        }
    }

    return { regenState, msLeft }
}

self.onmessage = (e) => {
    const { layer, layerIdx, plot, usersInViewSnapshot, viewport, scale, myCoords, fetchTimetable, timeData, groupEntityMap } = e.data
    const { second, prev10Second, next10Second, prevHourMin, nextHourMin, timeHour, currentMs } = timeData

    const plotMargins = plot.margins
    const walkToTarget = prev10Second % 20 === 0

    if (!layer || !viewport) {
        // if (plot.id === 778) console.log("No layer or viewport...")
        self.postMessage(null)
        return
    }
    // if (plot.id === 778) console.log("Plot worker in action...")
    const allUsers = [ ...usersInViewSnapshot, ...((myCoords?.riding) ? [myCoords] : []) ]
    const usersStandingUnheld = []
    const riddenEntities = []
    for (const user of allUsers) {
        if ((user.plotId === plot.id) && (user.layerIdx === layerIdx) && !user.held && !user.riding) usersStandingUnheld.push(user)
        else if ((user.plotId === plot.id) && user.riding) riddenEntities.push({ ...user.riding, mainRider: user, f: user.facing, p: [user.x, user.y], base: [user.x, user.y], })
    }

    const newEntities = layer.entities.map(lEnt => {
        if (lEnt.grp === "animal") {
            let newAction
            const timetable = groupEntityMap[lEnt.grp][lEnt.t]?.timetable
            if (fetchTimetable) { // Fetch the current action the first time you come in or if the hour changes   
                newAction = getCurrentAction(timetable, timeHour)
            } else newAction = lEnt.ins // if you have come in before and the hour hasn't changed, use the prev instruction

            // if (lEnt._id === "6960bc0149b2c653c753b0be") console.log({ lEntr })
            // if (plot.id === 778) console.log("Getting timetable: ", newAction)

            // if (lEnt._id === "6960bc0149b2c653c753b0be") console.log({ mod20: second % 20 })
            if (lEnt.ins === "escape") {
                const elapsedSec = Math.round((currentMs - lEnt.insTime)/1000)
                if (((lEnt.p?.[0] === lEnt.base[0]) && (lEnt.p?.[1] === lEnt.base[1])) || elapsedSec > 9) {
                    const secMinElaps = second - elapsedSec
                    const startSec = secMinElaps < 0 ? 60 + secMinElaps + 9 : secMinElaps + 9
                    const secItReachedTarget =  startSec > 59 ? startSec%60 : startSec 
                    const firstStopPoint = ((20 - secItReachedTarget%20) + secItReachedTarget)%60
                    const hasAlreadyHit20s = elapsedSec > 19 || secItReachedTarget%20 === 19 || (second >= firstStopPoint)
                    if (hasAlreadyHit20s) {
                        const newAction =  getCurrentAction(timetable, timeHour)
                        const changePToBase = restActions.includes(newAction)
                        // if (lEnt._id === "6960bc0149b2c653c753b0be") console.log("changing action after catching breath...", { timeHour }, { ...lEnt, ins: newAction, p: changePToBase ? lEnt.base : lEnt.p })
                        return { ...lEnt, ins: newAction, p: changePToBase ? lEnt.base : lEnt.p }
                    }
                    // if (lEnt._id === "6960bc0149b2c653c753b0be") console.log("catching breath...", {elapsedSec}, { ...lEnt, p: lEnt.base, ins: "catch-breath" })
                    return { ...lEnt, p: lEnt.base, ins: "catch-breath" }
                } else {
                    const seed = `${lEnt.t}-${lEnt.dl}`
                    const rng = seededRandom(betterHash(seed))
                    const stride = lEnt.stride
                    const xSteps = Math.floor(rng() * 10)
                    const ySteps = 10 - xSteps

                    const { newP, f } = walkToNewBase(lEnt, xSteps, ySteps, elapsedSec, plotMargins, stride)
                    // if (lEnt._id === "6960bc0149b2c653c753b0be") console.log("escaping...", {xSteps, ySteps, elapsedSec}, { ...lEnt, p: newP, f, ins: "escape" })
                    return { ...lEnt, p: newP, f, ins: "escape" }
                }
            } else if (lEnt.ins === "catch-breath") {
                if (second % 20 === 19) {
                    const newAction =  getCurrentAction(timetable, timeHour)
                    // if (lEnt._id === "6960bc0149b2c653c753b0be") console.log("changing action after catching breath...", { timeHour }, { ...lEnt, ins: newAction })
                    return { ...lEnt, ins: newAction }
                }
                // if (lEnt._id === "6960bc0149b2c653c753b0be") console.log("catching breath", lEnt)
                return lEnt
            } else if (newAction === "roam" || newAction === "rest") {
                const seed = walkToTarget ? `${lEnt.dl}-${nextHourMin}-${next10Second}-walk` // at 0s 12-43-10
                                        : `${lEnt.dl}-${prevHourMin}-${prev10Second}-walk` // at 10s 12-43-10
                const targetRng = seededRandom(betterHash(seed))

                const willWalk = Math.floor(targetRng() * 2)
                if (willWalk) {
                    const xSteps = Math.floor(targetRng() * 10)
                    const ySteps = 10 - xSteps
                    const jitteredStride = Math.floor(lEnt.stride * (0.5 + targetRng() * 0.5))
                    const elapsedSec = second - prev10Second

                    const { newP, f } = getEntityP(lEnt, xSteps, ySteps, elapsedSec, plotMargins, walkToTarget, jitteredStride)
                    // if (lEnt._id === "6960bc0149b2c653c753b0be") console.log("roaming", { ...lEnt, p: newP, f, ins: "roam"  })
                    return { ...lEnt, p: newP, f, ins: "roam"  }
                } else return { ...lEnt, p: lEnt.base, ins: "rest" }
            } else if (newAction === "sleep") {
                return { ...lEnt, ins: newAction, p: lEnt.base }
            }
        }
        if (lEnt.grp === "plant") {
            if (lEnt.s === "grown") return lEnt
            let newPlant = null
            const stateList = ["grown", "mid", "young"]
            const plantRef = groupEntityMap.plant[lEnt.t]
            const { regenState, msLeft } = getNewState(currentMs, stateList, lEnt.createdAt, plantRef.transform)
            const stateRef = plantRef.states[regenState]
            newPlant = { 
                ...lEnt, s: regenState, 
                primary: !stateRef.primary ? null : lEnt.primary ? lEnt.primary : { count: 0, lastGenerated: lEnt.createdAt + plantRef.transform  },
                secondary: !stateRef.secondary ? null : lEnt.secondary ? lEnt.secondary : { count: 0, lastGenerated: lEnt.createdAt } 
            }
            // if (plot.id === 778) console.log({ regenState, msLeft })
            return newPlant
        }
        return lEnt
    })

    const allIntersecting = []
    const visibleEntities = [...newEntities, ...riddenEntities, ...usersStandingUnheld].filter(entity => {
        const isUser = entity.userStyleId
        const height = isUser
            ? entity.userStyleId.height
            : entity.t === "hole"
                ? entity.energy
                : groupEntityMap[entity.grp][entity.t]?.states[entity.s].size[0]

        const width = isUser
            ? entity.userStyleId.width
            : entity.t === "hole"
                ? entity.energy
                : groupEntityMap[entity.grp][entity.t]?.states[entity.s].size[1]

        const x = isUser ? entity.x : entity.p[0]
        const y = isUser ? entity.y : entity.p[1]

        const isVis = isItemVisible(x, y, plot.x, plot.y, viewport, scale, height, width) || ((myCoords?.riding) && (entity._id === myCoords?.riding?._id))

        if (isVis && myCoords) {
            const neededCoords = { x: myCoords.x, y: myCoords.y, height: myCoords.userStyleId.height, width: myCoords.userStyleId.width }
            const isInt = isIntersecting(neededCoords, x, y, height, width)
            if (isInt) allIntersecting.push(entity)
        }
    
        return isVis
    })

    // Compute ceKey
    let ceKey = null
    let ridingEntity = null
    if (myCoords) {
        const heldUserEntityId = myCoords.holding?._id
        const ridingEntityId = myCoords.riding?._id
        const realIntersecting = []
        for (const entity of allIntersecting) {
            const entityId = entity._id || entity.id
            if (![heldUserEntityId, ridingEntityId].includes(entityId)) realIntersecting.push(entity)
            if (ridingEntityId === entityId) {
                const { mainRider, ...realEntity } = entity
                ridingEntity = realEntity
            } 
        }

        if (realIntersecting.length > 0) {
            const closestEntity = realIntersecting.length > 1
                ? getClosestEntity(realIntersecting, myCoords, groupEntityMap)
                : realIntersecting[0]
            const isUser = closestEntity.userStyleId
            ceKey = isUser ? closestEntity._id : `${closestEntity.t}-${closestEntity.p[0]}-${closestEntity.p[1]}`
        } else ceKey = myCoords.on
    }

    // console.log(plot.id, visibleEntities.map(e => e.grp === "plant").length)

    self.postMessage({ visibleEntities, ceKey, newEntities, ridingEntity })
}