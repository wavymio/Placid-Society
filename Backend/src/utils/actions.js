const { default: mongoose } = require("mongoose")
const { Plot, layerEntitySchema } = require("../models/Plots")
const { createError, handleSuccessSession, handleEndSession } = require("./databaseHelpers")
const { mins, maxs, statMins, statMaxs } = require('./userHelpers')
const { CityUser } = require("../models/Cities")
const { io } = require("../socket/socket")
const { redis } = require('../db/redisClient')
const { UserStyle } = require("../models/UserStyles")

const updateCount = (max, currentTime, currentCount, growthTime, lastGenerated) => {
    if (isNaN(currentCount) || currentCount === max) return { count: currentCount, lastGenerated: currentTime }
    const tDiff = currentTime - (lastGenerated ?? 0)
    const quantityRegenerated = Math.floor(tDiff/growthTime)
    if (quantityRegenerated === 0) return { count: currentCount, lastGenerated }

    const newTime = ((quantityRegenerated * growthTime) + lastGenerated)
    
    return { count: Math.min(max, currentCount + quantityRegenerated), lastGenerated: newTime }
}

const deleteKeys = async (keysArr) => {
    for (let x=0; x < keysArr.length; x++) {
        const keyGroup = keysArr[x]
        if (keyGroup.length === 1) {
            await redis.del(keyGroup[0])
        } else {
            if (keyGroup[0]) redis.del(keyGroup[1])
        }
    }
}

function hgetallToObject(arr) {
  const obj = {}
  for (let i = 0; i < arr.length; i += 2) {
    const key = arr[i]
    const value = arr[i + 1]

    obj[key] = Number.isNaN(Number(value))
      ? value
      : Number(value)
  }
  return obj
}

const luaGetSetScript =  `
    local current = redis.call("GET", KEYS[1])
    if current then
        local num = tonumber(current) - 1
        if num <= 0 then
            return -1
        end
        redis.call("SET", KEYS[1], num, "KEEPTTL")
        return num
    else
        local num = tonumber(ARGV[1]) - 1
        redis.call("SET", KEYS[1], num, "EX", 30)
        return num
    end
`

const luaGetSetDropping = `
    local current = redis.call("GET", KEYS[1])
    if current then
        local num = tonumber(current) + 1
        redis.call("SET", KEYS[1], num, "KEEPTTL")
        return num
    else
        local num = tonumber(ARGV[1]) + 1
        redis.call("SET", KEYS[1], num, "EX", 30)
        return num
    end
`

const MAX_ATTEMPTS = 6

const isTransientError = (err) => {
    if (!err) return false;
    // Mongo transient labels
    if (typeof err.hasErrorLabel === 'function' && err.hasErrorLabel('TransientTransactionError')) return true
    if (err.errorLabels && Array.isArray(err.errorLabels) && err.errorLabels.includes('TransientTransactionError')) return true
    // write conflict code
    if (err.code === 112) return true
    // Transaction aborted (sometimes appears)
    if (err.code === 251) return true
    // network / retryable errors could be added here
    return false
}

// holding updates
const handleCollect = async ({ parent, child, myCoords, cityId, emissionView, droppingEarthlyData, myCoordsIdFromReq, mySocketId, res }) => {
    if (!parent || !child || !myCoords || !myCoords.userStyleId?.stats || !myCoords?.on || myCoords.held || !cityId) return res.status(400).json({ error: "Bad request"})
    if (String(myCoords._id) !== String(myCoordsIdFromReq)) return res.status(409).json({ error: "Unauthorised user"})
    const myStats = myCoords.userStyleId.stats
    if (myStats.energy <= 0  || myStats.health <= 0) return res.status(400).json({ error: "Energy depleted" })
    const { produceType, q: collectedAmount, ...realChild } = child
    if (!collectedAmount || isNaN(collectedAmount)) return res.status(400).json({ error: "Specify quantity to be collected"})
      
    const layerIdx = myCoords.layerIdx     
    const parentId = new mongoose.Types.ObjectId(parent._id)
    const childId = new mongoose.Types.ObjectId()
    const myUserKey = `user:${myCoords._id}`
    const parentKey = `entity:${parentId}`
    const childKey = `entity:${childId}`
    const userLock = await redis.set(myUserKey, 'locked', { EX: 3, NX: true })
    const parentLock = await redis.set(parentKey, 'locked', { EX: 3, NX: true })
    const childLock = await redis.set(childKey, 'locked', { EX: 3, NX: true })
    const keysArr = [ [userLock, myUserKey], [parentLock, parentKey], [childLock, childKey] ]
    if (!userLock || !parentLock || !childLock) {
        await deleteKeys(keysArr)
        res.status(409).json({ error: 'Item is being used, try again' })
    }

    let entityForPlace = null
    let droppedEntityKey = null 
    if (myCoords.holding) {
        if (myCoords.holding.userStyleId) {
            droppedEntityKey = `user:${myCoords.holding._id}`
            const droppedEntityLock = await redis.set(droppedEntityKey, 'locked', { EX: 3, NX: true })
            if (!droppedEntityLock) {
                await deleteKeys(keysArr)
                return res.status(409).json({ error: 'Item is being used, try again' })
            } else keysArr.push([ droppedEntityLock, droppedEntityKey ])
            entityForPlace = myCoords.holding
        } else if (myCoords.holding.grp === "earthly" && droppingEarthlyData) {
            droppedEntityKey = `earthly:${myCoords.holding._id}`
            const droppedEntityLock = await redis.set(droppedEntityKey, 'locked', { EX: 3, NX: true })
            if (!droppedEntityLock) {
                await deleteKeys(keysArr)
                return res.status(409).json({ error: 'Item is being used, try again' })
            } else keysArr.push([ droppedEntityLock, droppedEntityKey ])
            const { _id: droppingEarthlyId, q: droppingEarthlyQ, t } = droppingEarthlyData
            const droppingEarthlyKey = `earthly:${droppingEarthlyId}`
            let currentDroppingEarthlyCount
            try {
                currentDroppingEarthlyCount = await redis.eval(luaGetSetDropping, {
                    keys: [droppingEarthlyKey],
                    arguments: [String(droppingEarthlyQ)],
                })
            } catch (err) {
                console.log(err)
                await deleteKeys(keysArr)
                return res.status(409).json({ error: "Failed to drop earthly" })
            }
            entityForPlace = { q: currentDroppingEarthlyCount, t, _id: droppingEarthlyId, grp: "earthly", on: myCoords.on }
        } else {
            droppedEntityKey = `entity:${myCoords.holding._id}`
            const droppedEntityLock = await redis.set(droppedEntityKey, 'locked', { EX: 3, NX: true })
            if (!droppedEntityLock) {
                await deleteKeys(keysArr)
                return res.status(409).json({ error: 'Item is being used, try again' })
            } else keysArr.push([ droppedEntityLock, droppedEntityKey ])
            entityForPlace = { ...myCoords.holding, p: [myCoords.x, myCoords.y] }
        }
        
    }

    const session = await mongoose.startSession()
    try {
        if (!session) throw createError("No session", 400) 
        session.startTransaction()
        const produceField = parent[produceType]
        if (!produceField) throw createError("Invalid produce type", 400)

        // Step 2: Re-check the last generated time and the updated count of the found entity
        const currentTime = Date.now()
        const { count: regeneratedCount, lastGenerated: regeneratedLgn } = updateCount(parent.max, currentTime, produceField.count, parent.growthTime, produceField.lastGenerated)
        const newCount = regeneratedCount - collectedAmount
        if (newCount < 0) throw createError("Not enough produce left", 400)
        const updated = await Plot.findOneAndUpdate(
            { city: cityId, id: myCoords.plotId },
            {
                $set: {
                    [`layers.${layerIdx}.entities.$[elem].${produceType}`]: {
                        count: newCount,
                        lastGenerated: regeneratedLgn
                    },
                    [`layers.${layerIdx}.entities.$[elem].s`]: parent.s
                }
            },
            { arrayFilters: [{ "elem._id": parentId }], new: true, session } 
        )
        if (!updated) throw createError("Couldn't update parent", 400) // non transient reasons

        const newParent = updated.layers[layerIdx].entities.find(ent => ent._id.toString() === parentId.toString()) 

        // Step 4: Create the child entity
        // const newChild = { _id: new mongoose.Types.ObjectId(), ...testChild } not very safe since it doesn't pass through schema checks
        const testChild = { _id: childId, ...(collectedAmount === 1 ? {} : {q: collectedAmount}), createdAt: Date.now(), ...realChild }
        const newChildDoc = new mongoose.Document(testChild, layerEntitySchema)
        const newChild = newChildDoc.toObject()

        console.log({ newParent, newChild, entityForPlace })

        // Step 5: If the user is holding another entity, add the entity to the plot.layers[layerIdx].entities array (dropping)
        if (entityForPlace) {
            const plot = await dropHolding(entityForPlace, myCoords, cityId, session)
            if (!plot) throw createError("Unable to drop entity", 400)
        }

        // Step 6: Set the new child as what the user is holding
        const myNewCoords = await CityUser.findByIdAndUpdate(myCoords._id, { $set: { holding: newChild } }, { new: true, session })
        if (!myNewCoords) throw createError("Unable to update my coords", 400)

        await handleSuccessSession(session)
        const results = { action: "collect", holding: newChild, adding: entityForPlace, updating: newParent, otherUsersData: { _id: myCoords._id, layerIdx, plotId: myCoords.plotId, on: myCoords.on } }
        console.log(results)
        
        const theCityId = 'testId'
        for (const emitId of emissionView) {
            const room = `cityId-${theCityId}-plotId-${emitId}`
            io.to(room).except(mySocketId).emit("entityCollected", results)
        }
        await deleteKeys(keysArr)
        return res.status(201).json({success: "Collected Item Successfully!", results}) 
    } catch (err) { 
        console.log(err)
        await deleteKeys(keysArr)
        await handleEndSession(session)
        return res.status(err.statusCode || 500).json({error: err.message || "Internal Server Error"})
    }
}

const handlePick = async ({ entity, myCoords, cityId, emissionView, quantity, droppingEarthlyData, myCoordsIdFromReq, mySocketId, res }) => {
    if (!entity || !myCoords || !myCoords.userStyleId?.stats || !myCoords?.on || myCoords.held || !cityId) return res.status(400).json({ error: "Bad request"})
    if (String(myCoords._id) !== String(myCoordsIdFromReq)) return res.status(409).json({ error: "Unauthorised user"})
    const myStats = myCoords.userStyleId.stats
    if (myStats.energy <= 0  || myStats.health <= 0) return res.status(400).json({ error: "Energy depleted" })

    const layerIdx = myCoords.layerIdx     
    const entityId = new mongoose.Types.ObjectId(entity._id)
    const entityKey = `entity:${entity._id}`
    const entityMultiple = entity.q && entity.q > 1
    const remainingEntity = entityMultiple ? ((entity.q ?? 0) - (quantity ?? 0)) : null
    const pickMultiple = entityMultiple && remainingEntity
    const childId = pickMultiple ? new mongoose.Types.ObjectId() : null
    const childKey = pickMultiple ? `entity:${childId}` : null

    // Step 1: Set the key in redis, if it exists return early 
    const lock = await redis.set(entityKey, 'locked', { EX: 3, NX: true })
    const lockTwo = pickMultiple ? await redis.set(childKey, 'locked', { EX: 3, NX: true }) : null
    const myUserKey = `user:${myCoords._id}`
    const userLock = await redis.set(myUserKey, 'locked', { EX: 3, NX: true })

    const keysArr = [ [lock, entityKey], [lockTwo, childKey], [userLock, myUserKey] ]
    console.log({ lock, lockTwo })
    if (!lock || (pickMultiple && !lockTwo) || !userLock) {
        await deleteKeys(keysArr)
        return res.status(409).json({ error: 'Item is being used, try again' })
    }

    let droppedEntityKey = null
    let entityForPlace = myCoords.holding
    if (entityForPlace) {
        if (entityForPlace.userStyleId) {
            droppedEntityKey = `user:${entityForPlace._id}`
            const droppedEntityLock = await redis.set(droppedEntityKey, 'locked', { EX: 3, NX: true })
            if (!droppedEntityLock) {
                await deleteKeys(keysArr)
                return res.status(409).json({ error: 'Item is being used, try again' })
            } else keysArr.push([ droppedEntityLock, droppedEntityKey ])
        } else if (entityForPlace.grp === "earthly" && droppingEarthlyData) {
            droppedEntityKey = `earthly:${entityForPlace._id}`
            const droppedEntityLock = await redis.set(droppedEntityKey, 'locked', { EX: 3, NX: true })
            if (!droppedEntityLock) {
                await deleteKeys(keysArr)
                return res.status(409).json({ error: 'Item is being used, try again' })
            } else keysArr.push([ droppedEntityLock, droppedEntityKey ])

            const { _id: droppingEarthlyId, q: droppingEarthlyQ, t } = droppingEarthlyData
            const droppingEarthlyKey = `earthly:${droppingEarthlyId}`
            let currentDroppingEarthlyCount
            try {
                currentDroppingEarthlyCount = await redis.eval(luaGetSetDropping, {
                    keys: [droppingEarthlyKey],
                    arguments: [String(droppingEarthlyQ)],
                })
            } catch (err) {
                console.log(err)
                await deleteKeys(keysArr)
                return res.status(409).json({ error: "Failed to drop earthly" })
            }
            entityForPlace = { q: currentDroppingEarthlyCount, t, _id: droppingEarthlyId, grp: "earthly", on: myCoords.on }
        } else {
            droppedEntityKey = `entity:${entityForPlace._id}`
            const droppedEntityLock = await redis.set(droppedEntityKey, 'locked', { EX: 3, NX: true })
            if (!droppedEntityLock) {
                await deleteKeys(keysArr)
                return res.status(409).json({ error: 'Item is being used, try again' })
            } else keysArr.push([ droppedEntityLock, droppedEntityKey ])
            entityForPlace = { ...entityForPlace, p: [myCoords.x, myCoords.y] }
        }
        
    }

    // Step 2a: If key sets, crete results payload
    const theCityId = 'testId'
    let results
    const otherUsersData = { _id: myCoords._id, layerIdx, plotId: myCoords.plotId, on: myCoords.on } 
    if (pickMultiple) {
        if (remainingEntity < 0) return res.status(400).json({ error: "Not enough entities to pick" })
        const { q, ...realParent } = entity
        const parent = { ...realParent, ...(remainingEntity === 1 ? {} : { q: remainingEntity }), p: [myCoords.x, myCoords.y] } 
        const testChild = { ...realParent, _id: childId, ...(quantity === 1 ? {} : { q: quantity }) }
        const childDoc = new mongoose.Document(testChild, layerEntitySchema)
        const child = childDoc.toObject()
        results = { holding: child, adding: entityForPlace, updating: parent, otherUsersData }
    } else {
        results = { holding: entity, adding: entityForPlace, updating: null, otherUsersData }
    }

    const session = await mongoose.startSession()
    try {       
        // Step 2b: Emit the results payload to users
        for (const emitId of emissionView) {
            const room = `cityId-${theCityId}-plotId-${emitId}`
            io.to(room).emit("entityPicked", results)
        }

        // Step 3: Handle db operations
        session.startTransaction()
        
        // Pick and drop if already holding
        const { updating, holding, adding } = results
        const options = { new: true, session, ...(updating ? { arrayFilters: [{ "ent._id": entityId }] }: {})}
        const updated = await Plot.findOneAndUpdate(
            { city: cityId, id: myCoords.plotId,},{ 
                ...(!updating 
                    ? { $pull: {[`layers.${layerIdx}.entities`]: { _id: entityId }} } 
                    : { $set: {[`layers.${layerIdx}.entities.$[ent]`]: updating } }
                ),
            }, options
        )
        if (!updated) throw createError("Unable to pick entity", 400)
        if (adding) {
            const added = await dropHolding(adding, myCoords, cityId, session)
            if (!added) throw createError("Unable to pick entity", 400)
        }     
        
        // Hold new
        const myNewCoords = await CityUser.findByIdAndUpdate(myCoords._id, { $set: { holding } }, { new: true, session })
        console.log({ myNewCoords })
        if (!myNewCoords) throw createError("Unable to update my coords", 400)

        await handleSuccessSession(session)
        await deleteKeys(keysArr)
        console.log("finished")
        res.status(201).json({ success: "Entity picked successfully" })
    } catch (err) {
        console.log(err)
        await deleteKeys(keysArr)
        await handleEndSession(session)
        res.status(err.statusCode || 500).json({error: err.message || "Internal Server Error"})
    }
}

const handleDrop = async ({ entity, myCoords, cityId, emissionView, quantity, myCoordsIdFromReq, mySocketId, res }) => {
    if (!entity || !myCoords || !myCoords?.on || myCoords.held || !cityId) return res.status(400).json({ error: "Bad request"})
    if (String(myCoords._id) !== String(myCoordsIdFromReq)) return res.status(409).json({ error: "Unauthorised user"})
 
    const layerIdx = myCoords.layerIdx     
    const entityKey = `entity:${entity._id}`
    const entityMultiple = entity.q && (entity.q > 1)
    const remainingEntity = entityMultiple ? ((entity.q ?? 0) - (quantity ?? 0)) : null
    const dropMultiple = entityMultiple && remainingEntity
    const childId = dropMultiple ? new mongoose.Types.ObjectId() : null
    const childKey = dropMultiple ? `entity:${childId}` : null

    // Step 1: Set the key in redis, if it exists return early 
    const lock = await redis.set(entityKey, 'locked', { EX: 3, NX: true })
    const lockTwo = dropMultiple ? await redis.set(childKey, 'locked', { EX: 3, NX: true }) : null
    const myUserKey = `user:${myCoords._id}`
    const userLock = await redis.set(myUserKey, 'locked', { EX: 3, NX: true })

    const keysArr = [ [lock, entityKey], [lockTwo, childKey], [userLock, myUserKey] ]
    console.log({ lock, lockTwo })
    if (!lock || (dropMultiple && !lockTwo) || !userLock) {
        await deleteKeys(keysArr)
        return res.status(409).json({ error: 'Item is being used, try again' })
    }

    // Step 2a: If key sets, create results payload
    const theCityId = 'testId'
    let results
    const otherUsersData = { _id: myCoords._id, layerIdx, plotId: myCoords.plotId, on: myCoords.on } 
    if (dropMultiple) {
        if (remainingEntity < 0) return res.status(400).json({ error: "Not enough entities to drop" })
        const { q, ...realParent } = entity
        const parent = { ...realParent, ...(remainingEntity === 1 ? {} : { q: remainingEntity }), p: [0, 0] } 
        const testChild = { ...realParent, _id: childId, ...(quantity === 1 ? {} : { q: quantity }) }
        const childDoc = new mongoose.Document(testChild, layerEntitySchema)
        const child = childDoc.toObject()
        results = { holding: parent, adding: child, entityMultiple, otherUsersData }
    } else {
        results = { holding: null, adding: entity, entityMultiple, otherUsersData }
    }

    const session = await mongoose.startSession()
    try {       
        // Step 2b: Emit results payload
        for (const emitId of emissionView) {
            const room = `cityId-${theCityId}-plotId-${emitId}`
            io.to(room).emit("entityDropped", results)
        } 

        // Step 3: Handle db operations
        session.startTransaction()
        
        // Drop entity
        const updated = await dropHolding((results.adding), myCoords, cityId, session)
        if (!updated) throw createError("Unable to drop entity", 400)
        
        // Hold new
        const myNewCoords = await CityUser.findByIdAndUpdate(myCoords._id, { $set: { holding: results.holding } }, { new: true, session })
        if (!myNewCoords) throw createError("Unable to update my coords", 400)
        
        await handleSuccessSession(session)
        await deleteKeys(keysArr)
        console.log("finished")
        res.status(201).json({ success: "Entity dropped successfully" })
    } catch (err) {
        console.log(err)
        await deleteKeys(keysArr)
        await handleEndSession(session)
        res.status(err.statusCode || 500).json({error: err.message || "Internal Server Error"})
    }
}

const handlePickEarthly = async ({ entity, myCoords, cityId, emissionView, droppingEarthlyData, myCoordsIdFromReq, mySocketId, res }) => {
    if (!entity || !myCoords || !myCoords.userStyleId?.stats || !myCoords?.on || myCoords.held || !cityId) return res.status(400).json({ error: "Bad request"})
    if (String(myCoords._id) !== String(myCoordsIdFromReq)) return res.status(409).json({ error: "Unauthorised user"})
    if (entity.q === 0) return res.status(400).json({ error: "Not enough earthlies"})
    const myStats = myCoords.userStyleId.stats
    if (myStats.energy <= 0  || myStats.health <= 0) return res.status(400).json({ error: "Energy depleted" })

    // Step 1: Set the key in redis, if it exists return early
    const myUserKey = `user:${myCoords._id}`
    const userLock = await redis.set(myUserKey, 'locked', { EX: 3, NX: true })
    if (!userLock) return res.status(409).json({ error: 'Item is being used, try again' })
    const keysArr = [ [userLock, myUserKey] ]
    
    const { q, _id: earthlyGroupId, ...rest } = entity
    const earthlyKey = `earthly:${earthlyGroupId}`
    let currentEarthlyCount    
    try {
        currentEarthlyCount = await redis.eval(luaGetSetScript, {
            keys: [earthlyKey],
            arguments: [String(q)],
        })
    } catch (err) {
        console.log(err)
        await deleteKeys(keysArr)
        return res.status(409).json({ error: "Failed to pick earthly" })
    }

    if (currentEarthlyCount === -1) {
        console.log(err)
        await deleteKeys(keysArr)
        return res.status(400).json({ error: "No more earthlies" })
    }
 
    const holding = { _id: new mongoose.Types.ObjectId(), createdAt: Date.now(), ...rest }
    const holdingKey = `earthly:${holding._id}`
    const holdingLock = await redis.set(holdingKey, 'locked', { EX: 3, NX: true })
    if (!holdingLock) {
        await deleteKeys(keysArr)
        return res.status(409).json({ error: "Failed to hold earthly" })
    } else keysArr.push( [holdingLock, holdingKey] )
    const updating = { _id: earthlyGroupId, q: currentEarthlyCount, t: holding.t, on: myCoords.on } 

    let droppedEntityKey = null
    let adding = myCoords.holding
    if (adding) {
        if (adding.userStyleId) {
            droppedEntityKey = `user:${adding._id}`
            const droppedEntityLock = await redis.set(droppedEntityKey, 'locked', { EX: 3, NX: true })
            if (!droppedEntityLock) {
                await deleteKeys(keysArr)
                return res.status(409).json({ error: 'Item is being used, try again' })
            } else keysArr.push([ droppedEntityLock, droppedEntityKey ])
        } else if (adding.grp === "earthly" && droppingEarthlyData) {
            droppedEntityKey = `earthly:${adding._id}`
            const droppedEntityLock = await redis.set(droppedEntityKey, 'locked', { EX: 3, NX: true })
            if (!droppedEntityLock) {
                await deleteKeys(keysArr)
                return res.status(409).json({ error: 'Item is being used, try again' })
            } else keysArr.push([ droppedEntityLock, droppedEntityKey ])

            const { _id: droppingEarthlyId, q: droppingEarthlyQ, t } = droppingEarthlyData
            const droppingEarthlyKey = `earthly:${droppingEarthlyId}`
            let currentDroppingEarthlyCount
            try {
                currentDroppingEarthlyCount = await redis.eval(luaGetSetDropping, {
                    keys: [droppingEarthlyKey],
                    arguments: [String(droppingEarthlyQ)],
                })
            } catch (err) {
                console.log(err)
                await deleteKeys(keysArr)
                return res.status(409).json({ error: "Failed to drop earthly" })
            }
            adding = { q: currentDroppingEarthlyCount, _id: droppingEarthlyId, t, on: myCoords.on, grp: "earthly"  }
        } else {
            droppedEntityKey = `entity:${adding._id}`
            const droppedEntityLock = await redis.set(droppedEntityKey, 'locked', { EX: 3, NX: true })
            if (!droppedEntityLock) {
                await deleteKeys(keysArr)
                return res.status(409).json({ error: 'Item is being used, try again' })
            } else keysArr.push([ droppedEntityLock, droppedEntityKey ])
            adding = { ...adding, p: [myCoords.x, myCoords.y] }
        }
    }

    // Step 2: If key sets, emit the values to users
    const theCityId = 'testId'
    const layerIdx = myCoords.layerIdx 
    const otherUsersData = { _id: myCoords._id, layerIdx, plotId: myCoords.plotId, on: myCoords.on } 
    const results = { adding, updating, holding, otherUsersData }

    const session = await mongoose.startSession()
    try { 
        // Step 3: Emit results
        for (const emitId of emissionView) {
            const room = `cityId-${theCityId}-plotId-${emitId}`
            io.to(room).emit("earthlyPicked", results)
        }

        // Step 4: Handle DB operations
        session.startTransaction()

        const { updating, holding, adding } = results

        // remove the picked
        const { q, t, on } = updating
        if (!t || !on) throw createError("Unable to pick earthly", 400)
        const updated = await Plot.findOneAndUpdate(
            { city: cityId, id: myCoords.plotId },
            { $set: { [`layers.${myCoords.layerIdx}.earthlies.${on}.$[earthly].q`]: q } },
            { arrayFilters: [ { "earthly.t": t }], new: true, session }
        )
        if (!updated) throw createError("Unable to pick earthly", 400)
        
        // if dropped, add the dropped
        if (adding) {
            const added = await dropHolding(adding, myCoords, cityId, session)
            if (!added) throw createError("Unable to pick earthly", 400)
        }     
        
        // Hold new
        const myNewCoords = await CityUser.findByIdAndUpdate(myCoords._id, { $set: { holding } }, { new: true, session })
        if (!myNewCoords) throw createError("Unable to update my coords", 400)

        await handleSuccessSession(session)
        await deleteKeys(keysArr)
        console.log("finished")
        res.status(201).json({ success: "Entity picked successfully" })

    } catch (err) {
        console.log(err)
        await deleteKeys(keysArr)
        await handleEndSession(session)
        res.status(err.statusCode || 500).json({error: err.message || "Internal Server Error"})
    }
}

const handleDropEarthly = async ({ entity, myCoords, cityId, emissionView, myCoordsIdFromReq, mySocketId, res }) => {
    if (!entity || !myCoords || !myCoords?.on || myCoords.held || !cityId) return res.status(400).json({ error: "Bad request"})
    if (String(myCoords._id) !== String(myCoordsIdFromReq)) return res.status(409).json({ error: "Unauthorised user"})
    if (myCoords.holding?.grp !== "earthly") return res.status(400).json({ error: "There is no earthly to drop"})
    
    const myUserKey = `user:${myCoords._id}`
    const userLock = await redis.set(myUserKey, 'locked', { EX: 3, NX: true })
    if (!userLock) res.status(409).json({ error: 'Item is being used, try again' })

    const holding = null
    let adding = null

    const { droppingEarthlyData } = entity
    if (droppingEarthlyData) {
        const { q, _id: earthlyGroupId, t } = droppingEarthlyData 
        const earthlyKey = `earthly:${earthlyGroupId}`  
        let currentDroppingEarthlyCount
        try {
            currentDroppingEarthlyCount = await redis.eval(luaGetSetDropping, {
                keys: [earthlyKey],
                arguments: [String(q)],
            })
        } catch (err) {
            console.log(err)
            await redis.del(myUserKey)
            return res.status(409).json({ error: "Failed to drop earthly" })
        }
        adding = { q: currentDroppingEarthlyCount, _id: earthlyGroupId, t, on: myCoords.on, grp: "earthly"  }
    } 
    
    // Step 2: If key sets, emit the values to users
    const theCityId = 'testId'
    const layerIdx = myCoords.layerIdx 
    const otherUsersData = { _id: myCoords._id, layerIdx, plotId: myCoords.plotId, on: myCoords.on } 
    const results = { adding, holding, otherUsersData }

    const session = await mongoose.startSession()
    try { 
        for (const emitId of emissionView) {
            const room = `cityId-${theCityId}-plotId-${emitId}`
            io.to(room).emit("earthlyDropped", results)
        }

        session.startTransaction()
        const { holding, adding } = results
        
        // if dropped, add the dropped
        if (adding) {
            const added = await dropHolding(adding, myCoords, cityId, session)
            if (!added) throw createError("Unable to drop earthly", 400)
        }     
        
        // Hold new
        const myNewCoords = await CityUser.findByIdAndUpdate(myCoords._id, { $set: { holding } }, { new: true, session })
        if (!myNewCoords) throw createError("Unable to update my coords", 400)

        await redis.del(myUserKey)
        await handleSuccessSession(session)
        console.log("finished")
        res.status(201).json({ success: "Earthly dropped successfully" })

    } catch (err) {
        console.log(err)
        await redis.del(myUserKey)
        await handleEndSession(session)
        res.status(err.statusCode || 500).json({error: err.message || "Internal Server Error"})
    }
}

const handlePickUser = async ({ entity, myCoords, cityId, emissionView, droppingEarthlyData, otherUserDed, myCoordsIdFromReq, mySocketId, res }) => {
    if (!entity || !myCoords || !myCoords.userStyleId?.stats || !myCoords?.on || myCoords.held || !cityId) return res.status(400).json({ error: "Bad request"})
    if (String(myCoords._id) !== String(myCoordsIdFromReq)) return res.status(409).json({ error: "Unauthorised user"})
    const myStats = myCoords.userStyleId.stats
    if (myStats.energy <= 0  || myStats.health <= 0) return res.status(400).json({ error: "Energy depleted" })

    // Step 1: Create locks for my user and the entity I'm picking
    const myUserKey = `user:${myCoords._id}`
    const pickedUserKey = `user:${entity._id}`

    const userLock = await redis.set(myUserKey, 'locked', { EX: 3, NX: true })
    const pickedUserLock = await redis.set(pickedUserKey, 'locked', { EX: 3, NX: true })

    const keysArr = [ [userLock, myUserKey], [pickedUserLock, pickedUserKey] ]
    console.log({ userLock, pickedUserLock })
    if (!userLock || !pickedUserLock) {
        await deleteKeys(keysArr)
        return res.status(409).json({ error: 'Item is being used, try again' })
    }
    
    // Step 2: Drop what my user is holding and set locks on the dropped entities
    let adding = null
    let droppedEntityKey = null
    if (myCoords.holding) {
        if (myCoords.holding.userStyleId) {
            droppedEntityKey = `user:${myCoords.holding._id}`
            const droppedEntityLock = await redis.set(droppedEntityKey, 'locked', { EX: 3, NX: true })
            if (!droppedEntityLock) {
                await deleteKeys(keysArr)
                return res.status(409).json({ error: 'Item is being used, try again' })
            } else keysArr.push([ droppedEntityLock, droppedEntityKey ])
            adding = myCoords.holding
        } else if (myCoords.holding.grp === "earthly" && droppingEarthlyData) {
            droppedEntityKey = `earthly:${myCoords.holding._id}`
            const droppedEntityLock = await redis.set(droppedEntityKey, 'locked', { EX: 3, NX: true })
            if (!droppedEntityLock) {
                await deleteKeys(keysArr)
                return res.status(409).json({ error: 'Item is being used, try again' })
            } else keysArr.push([ droppedEntityLock, droppedEntityKey ])

            const { _id: droppingEarthlyId, q: droppingEarthlyQ, t } = droppingEarthlyData
            const droppingEarthlyKey = `earthly:${droppingEarthlyId}`
            let currentDroppingEarthlyCount
            try {
                currentDroppingEarthlyCount = await redis.eval(luaGetSetDropping, {
                    keys: [droppingEarthlyKey],
                    arguments: [String(droppingEarthlyQ)],
                })
            } catch (err) {
                await deleteKeys(keysArr)
                return res.status(409).json({ error: 'Failed to drop earthly' })
            }
            adding = { q: currentDroppingEarthlyCount, _id: droppingEarthlyId, t, on: myCoords.on, grp: "earthly"  }
        } else {
            droppedEntityKey = `entity:${myCoords.holding._id}`
            const droppedEntityLock = await redis.set(droppedEntityKey, 'locked', { EX: 3, NX: true })
            if (!droppedEntityLock) {
                await deleteKeys(keysArr)
                return res.status(409).json({ error: 'Item is being used, try again' })
            } else keysArr.push([ droppedEntityLock, droppedEntityKey ])
            adding = { ...myCoords.holding, p: [myCoords.x, myCoords.y] }
        }
    }

    // Step 3: Drop what the about to be picked user is holding
    let otherUserAdding = null
    if (entity.holding) {
        if (entity.holding.userStyleId) {
            otherUserAdding = entity.holding
        } else if (entity.holding.grp === "earthly" && otherUserDed) {
            const { _id: droppingEarthlyId, q: droppingEarthlyQ, t } = otherUserDed
            const droppingEarthlyKey = `earthly:${droppingEarthlyId}`
            let currentDroppingEarthlyCount
            try {
                currentDroppingEarthlyCount = await redis.eval(luaGetSetDropping, {
                    keys: [droppingEarthlyKey],
                    arguments: [String(droppingEarthlyQ)],
                })
            } catch (err) {
                await deleteKeys(keysArr)
                return res.status(409).json({ error: 'Failed to drop earthly' })
            }
            otherUserAdding = { q: currentDroppingEarthlyCount, _id: droppingEarthlyId, t, on: myCoords.on, grp: "earthly"  }
        } else {
            otherUserAdding = { ...myCoords.holding, p: [myCoords.x, myCoords.y] }
        }
    }

    // Step 4: Create emission objects
    const holding = { _id: entity._id, userStyleId: entity.userStyleId }
    const otherUserHolding = { holding: null, held: myCoords._id }
    const theCityId = 'testId'
    const layerIdx = myCoords.layerIdx 
    const otherUsersData = { _id: myCoords._id, layerIdx, plotId: myCoords.plotId, on: myCoords.on } 
    const results = { adding, otherUserAdding, holding, otherUserHolding, otherUsersData }

    const session = await mongoose.startSession()
    try {
        // Step 5: Emit results to interested parties
        for (const emitId of emissionView) {
            const room = `cityId-${theCityId}-plotId-${emitId}`
            io.to(room).emit("userPicked", results)
        } 

        // Step 6: Save results to DB
        session.startTransaction()

        const { holding, otherUserHolding, adding, otherUserAdding } = results
        
        // if dropped, add the dropped
        if (adding) {
            const added = await dropHolding(adding, myCoords, cityId, session)
            if (!added) throw createError("Unable to pick user", 400)
        } 

        if (otherUserAdding) {
            const otherAdded = await dropHolding(otherUserAdding, entity, cityId, session)
            if (!otherAdded) throw createError("Unable to pick user", 400)
        }     
        
        // Hold new
        const myNewCoords = await CityUser.findByIdAndUpdate(myCoords._id, { $set: { holding } }, { new: true, session })
        if (!myNewCoords) throw createError("Unable to update my coords", 400)
        
        const otherUserNewCoords = await CityUser.findByIdAndUpdate(entity._id, { $set: { ...otherUserHolding } }, { new: true, session })
        if (!otherUserNewCoords) throw createError("Unable to update my coords", 400)
        
        await handleSuccessSession(session)
        await deleteKeys(keysArr)
        console.log("finished")
        res.status(201).json({ success: "Earthly dropped successfully" })

    } catch (err) {
        console.log(err)
        await deleteKeys(keysArr)
        await handleEndSession(session)
        res.status(err.statusCode || 500).json({error: err.message || "Internal Server Error"})
    }
    
}

const handleDropUser = async ({ entity, myCoords, cityId, emissionView, myCoordsIdFromReq, mySocketId, res }) => {
    if (!entity || !myCoords || myCoords.held || !cityId) return res.status(400).json({ error: "Bad request"})
    if (String(myCoords._id) !== String(myCoordsIdFromReq)) return res.status(409).json({ error: "Unauthorised user"})

    // Step 1: Create locks for my user and the entity I'm dropping
    const myUserKey = `user:${myCoords._id}`
    const droppedUserKey = `user:${entity._id}`

    const userLock = await redis.set(myUserKey, 'locked', { EX: 3, NX: true })
    const droppedUserLock = await redis.set(droppedUserKey, 'locked', { EX: 3, NX: true })

    const keysArr = [ [userLock, myUserKey], [droppedUserLock, droppedUserKey] ]

    console.log({ userLock, droppedUserLock })
    if (!userLock || !droppedUserLock) {
        await deleteKeys(keysArr)
        return res.status(409).json({ error: 'User is busy, try again' })
    }
    
    const session = await mongoose.startSession()
    try {   
        // Step 2: If key sets, emit the values to users
        const adding = myCoords.holding
        const holding = null

        const theCityId = 'testId'
        const layerIdx = myCoords.layerIdx     
        const otherUsersData = { _id: myCoords._id, layerIdx, plotId: myCoords.plotId, on: myCoords.on } 
        const results = { adding, holding, otherUsersData }

        for (const emitId of emissionView) {
            const room = `cityId-${theCityId}-plotId-${emitId}`
            io.to(room).emit("userDropped", results)
        }

        // Step 3: Handle db operations
        session.startTransaction()
        
        // Drop entity
        const updated = await dropHolding((results.adding), myCoords, cityId, session)
        if (!updated) throw createError("Unable to drop entity", 400)
        
        // Hold new
        const myNewCoords = await CityUser.findByIdAndUpdate(myCoords._id, { $set: { holding: results.holding } }, { new: true, session })
        if (!myNewCoords) throw createError("Unable to update my coords", 400)
        
        await handleSuccessSession(session)
        await deleteKeys(keysArr)
        console.log("finished")
        res.status(201).json({ success: "User dropped successfully" })
    } catch (err) {
        console.log(err)
        await deleteKeys(keysArr)
        await handleEndSession(session)
        res.status(err.statusCode || 500).json({error: err.message || "Internal Server Error"})
    }
}

const handleEscape = async ({ entity, myCoords, cityId, emissionView, myCoordsIdFromReq, mySocketId, res }) => {
    if (!entity || !myCoords || !myCoords.userStyleId?.stats || !myCoords.held || !cityId) return res.status(400).json({ error: "Bad request"})
    if (String(myCoords._id) !== String(myCoordsIdFromReq)) return res.status(409).json({ error: "Unauthorised user"})

    const myStats = myCoords.userStyleId.stats
    if (myStats.energy <= 0  || myStats.health <= 0) return res.status(400).json({ error: "Energy depleted" })

    // Step 1: Create locks for my user and the entity I'm dropping
    const myUserKey = `user:${myCoords._id}`
    const holderKey = `user:${entity}`

    const userLock = await redis.set(myUserKey, 'locked', { EX: 3, NX: true })
    const holderLock = await redis.set(holderKey, 'locked', { EX: 3, NX: true })

    const keysArr = [ [userLock, myUserKey], [holderLock, holderKey] ]

    console.log({ userLock, holderLock })
    if (!userLock || !holderLock) {
        await deleteKeys(keysArr)
        return res.status(409).json({ error: 'User is busy, try again' })
    }
    
    const session = await mongoose.startSession()
    try {        
        // Step 2: If key sets, emit the values to users
        const adding = myCoords
        const holder = entity

        const theCityId = 'testId'
        const layerIdx = myCoords.layerIdx     
        const otherUsersData = { _id: myCoords._id, layerIdx, plotId: myCoords.plotId, on: myCoords.on } 
        const results = { adding, holder, otherUsersData }

        for (const emitId of emissionView) {
            const room = `cityId-${theCityId}-plotId-${emitId}`
            io.to(room).emit("userEscaped", results)
        }

        // Step 3: Handle db operations
        session.startTransaction()
        
        // Drop entity
        const updated = await dropHolding((results.adding), myCoords, cityId, session)
        if (!updated) throw createError("Unable to drop entity", 400)
        
        // Hold new for holder
        const holderNewCoords = await CityUser.findByIdAndUpdate(holder, { $set: { holding: null } }, { new: true, session })
        if (!holderNewCoords) throw createError("Unable to update my coords", 400)
        
        await handleSuccessSession(session)
        await deleteKeys(keysArr)
        console.log("finished")
        res.status(201).json({ success: "User dropped successfully" })
    } catch (err) {
        console.log(err)
        await deleteKeys(keysArr)
        await handleEndSession(session)
        res.status(err.statusCode || 500).json({error: err.message || "Internal Server Error"})
    }
}

const dropHolding = async (entityForPlace, myCoords, cityId, session) => {
    console.log("Dropping: ", entityForPlace)
    if (!entityForPlace || !myCoords || !cityId) throw createError("Bad request at handleDrop", 400)

    if (entityForPlace.userStyleId) {
        const result = await CityUser.findByIdAndUpdate(entityForPlace._id, { $set: { held: null } }, { new: true, session })
        return result
    } else if (entityForPlace.grp === "earthly") {
        const { q, t, on } = entityForPlace
        if (!t || !on) return null
        const result = await Plot.findOneAndUpdate(
            { city: cityId, id: myCoords.plotId },
            { $set: { [`layers.${myCoords.layerIdx}.earthlies.${on}.$[earthly].q`]: q } },
            { arrayFilters: [ { "earthly.t": t }], new: true, session }
        )
        return result
    } else {
        const result = await Plot.findOneAndUpdate(
            { city: cityId, id: myCoords.plotId },       
            { $addToSet: { [`layers.${myCoords.layerIdx}.entities`]: entityForPlace } },
            { new: true, session }     
        )
        return result
    }
}

// stat updates
const userStatCache = new Map()
setInterval(async () => {
    if (userStatCache.size === 0) return

    try {
        const updates = [ ...userStatCache.values() ]
        userStatCache.clear()
        console.log({ updates })
        await UserStyle.bulkWrite(updates.map(u => {
            const { userStyleId, ...rest } = u
            console.log("REST", { ...rest })
            return {
                updateOne: {
                    filter: { _id: userStyleId  },
                    update: { $set: { ...rest }  }
                }
            }
        }))

        console.log("Flushed user stats to DB")
    } catch (err) {
        console.log(err, "something bad happened")
    }
}, 5000)

const luaStatsUpdateScript = `
    local key = KEYS[1]
    local cost = tonumber(ARGV[1])
    local statField = ARGV[2]

    if redis.call("EXISTS", key) == 0 then
        redis.call("HSET", key,
            "health", ARGV[4],
            "immunity", ARGV[5],
            "energy", ARGV[6],
            "endurance", ARGV[7],
            "strength", ARGV[8],
            "smarts", ARGV[9],
            "speed", ARGV[10],
            "damage", ARGV[11],
            "lgn", ARGV[12]
        )

        redis.call("EXPIRE", key, 30)
    end

    local current = redis.call("HGET", key, statField)
    if not current then
        return {"ERR", "STAT_NOT_FOUND"}
    end
    local currentNum = tonumber(current)

    if statField == "energy" then
    -- regenaration logic if the energy field is being updated
        local frontendLgn = tonumber(ARGV[3])
        local currentTime = ARGV[13]
        local regenTime = 30000
        local endurance = tonumber(redis.call("HGET", key, "endurance"))
        local newEnergy = 0 

        if currentNum == 100 then
            newEnergy = math.max(currentNum - cost, 0)
            redis.call("HSET", key, statField, newEnergy)
            redis.call("HSET", key, "lgn", frontendLgn)
        else
            local tDiff = tonumber(currentTime) - frontendLgn
            local quantityRegenerated = math.floor(tDiff/regenTime)
            if quantityRegenerated > 0 then 
                local newTime = ((quantityRegenerated * regenTime) + frontendLgn)
                local regenEnergy = math.min(currentNum + quantityRegenerated, 100)
                newEnergy = math.max(0, regenEnergy - cost)

                redis.call("HSET", key, statField, newEnergy)
                redis.call("HSET", key, "lgn", newTime)
            else
                if currentNum <= 0 then 
                    return {"ERR", "STAT_CANNOT_BE_MODIFIED"}
                end
                newEnergy = math.max(currentNum - cost, 0)
                redis.call("HSET", key, statField, newEnergy)
            end
        end

        --boost the user's endurance if his energy level is depleted
        if newEnergy == 0 then
            redis.call("HSET", key, "endurance", endurance + 1)
        end
    else
        if currentNum <= 0 then 
            return {"ERR", "STAT_CANNOT_BE_MODIFIED"}
        end
        local newValue = math.max(currentNum - cost, 0)
        redis.call("HSET", key, statField, newValue)
    end

    return {"OK", redis.call("HGETALL", key)}   
`
const handleWalk = async ({ myCoords, frontendLgn, actualEnergyCost, update, cityId, emissionView,  myCoordsIdFromReq, mySocketId, res }) => {
    if (!myCoords || !myCoords.userStyleId || !myCoords.userStyleId?.stats || !cityId) return res.status(400).json({ error: "Bad request"})
    if (String(myCoords._id) !== String(myCoordsIdFromReq)) return res.status(409).json({ error: "Unauthorised user"})

    const userStyle = myCoords.userStyleId
    const userStyleId = userStyle._id
    const myStats = myCoords.userStyleId.stats
    if (myStats.energy <= 0  || myStats.health <= 0) return res.status(400).json({ error: "Energy depleted" })

    const neededStyle = { width: userStyle.width, musc: userStyle.musc, curve: userStyle.curve }
    let statCosts = []
    let myNewStats = {}
    let styleCosts = []
    let myNewStyle = {}
    if (update.stats) {
        const updateStats = update.stats
        Object.keys(updateStats).map(key => statCosts.push(key, updateStats[key], statMins[key], statMaxs[key]))
    }
    if (update.style) {
        const gender = userStyle.gender
        const { curve, ...rest } = update.style
        const updateStyle = gender === "female" ? update.style : rest
        Object.keys(updateStyle).map(key => styleCosts.push(key, updateStyle[key], mins[gender][key], maxs[gender][key]))
    }
    
    try {
        if (statCosts.length > 0) {
            const ARGV = [
                "__INIT__",
                "health",  myStats.health,
                "energy",  myStats.energy,
                "endurance", myStats.endurance,
                "strength", myStats.strength,
                "smarts", myStats.smarts,
                "speed", myStats.speed,
                "damage", myStats.damage,
                "immunity", myStats.immunity,
                "lgn", myStats.lgn ?? Date.now(),

                "__COST__",
                ...statCosts
            ]
            myNewStats = await updateSelectedStats(ARGV, `userstats:${myCoords._id}`, "stats")
        }
        if (styleCosts.length > 0) {
            const ARGV = [
                "__INIT__",
                "width",  neededStyle.width,
                "musc",  neededStyle.musc,
                "curve",  neededStyle.curve ?? 0,
                "__COST__",
                ...styleCosts
            ]
            myNewStyle = await updateSelectedStats(ARGV, `userstyle:${myCoords._id}`, "style")
        }

        console.log({ myNewStats })
        console.log({ myNewStyle }) 

        const oldStats = userStatCache.get(myCoords._id)
        const { statsObj, styleObj } = getStatsStyleObj(statCosts, myNewStats, styleCosts, myNewStyle)
        userStatCache.set(myCoords._id, { ...oldStats, ...statsObj, ...styleObj, userStyleId })

        res.status(201).json({ success: "User stat updated on redis" })
    } catch (err) {
        console.log(err)
        return res.status(err.statusCode || 500).json({error: err.message || "Internal Server Error"})
    }
}

const handleHitUser = async ({ myCoords, animation, entity, frontendLgn, actualEnergyCost, actualHealthCost, cityId, emissionView,  myCoordsIdFromReq, mySocketId, res }) => {
    if (!myCoords || !myCoords.userStyleId || !myCoords.userStyleId?.stats || !cityId) return res.status(400).json({ error: "Bad request"})
    if (!entity || !entity.userStyleId || !entity.userStyleId?.stats) return res.status(400).json({ error: "Bad request"})
    if (String(myCoords._id) !== String(myCoordsIdFromReq)) return res.status(409).json({ error: "Unauthorised user"})

    const userStyleId = myCoords.userStyleId._id
    const defenderStyleId = entity.userStyleId._id
    const myStats = myCoords.userStyleId.stats
    const defenderStats = entity.userStyleId.stats
    if (myStats.energy <= 0  || myStats.health <= 0) return res.status(400).json({ error: "Energy depleted" })
    if (defenderStats.health <= 0) return res.status(400).json({ error: "Already Dead" })

    const myStatField = "energy"
    const defenderStatField = "health"

    try {
        const myNewStats = await updateLuaStats(myStats, myStatField, actualEnergyCost, frontendLgn, myCoords._id)
        const defenderNewStats = await updateLuaStats(defenderStats, defenderStatField, actualHealthCost, 0, entity._id)

        const results = { 
            attacker: { _id: myCoords._id, stats: myNewStats, animation },
            defender: { _id: entity._id, stats: defenderNewStats }
        }

        const theCityId = 'testId'
        for (const emitId of emissionView) {
            const room = `cityId-${theCityId}-plotId-${emitId}`
            io.to(room).emit("userHit", results)
        }

        res.status(201).json({ success: "User stat updated on redis" })

        const oldStats = userStatCache.get(myCoords._id)
        const defenderOldStats = userStatCache.get(entity._id)
        userStatCache.set(myCoords._id, { ...oldStats, [`stats.energy`]: myNewStats.energy, [`stats.lgn`]: myNewStats.lgn, 
        [`stats.endurance`]: myNewStats.endurance, userStyleId })    
        userStatCache.set(entity._id, { ...defenderOldStats, [`stats.health`]: defenderNewStats.health, userStyleId: defenderStyleId }) 
    } catch (err) {
        console.log(err)
        return res.status(err.statusCode || 500).json({error: err.message || "Internal Server Error"})
    }
}

const handleHitEntity = async ({ myCoords, animation, entity, frontendLgn, actualEnergyCost, cityId, emissionView,  myCoordsIdFromReq, mySocketId, res }) => {
    if (!myCoords || !myCoords.userStyleId || !myCoords.userStyleId?.stats || !cityId || !entity) return res.status(400).json({ error: "Bad request"})
    if (String(myCoords._id) !== String(myCoordsIdFromReq)) return res.status(409).json({ error: "Unauthorised user"})

    const userStyleId = myCoords.userStyleId._id
    const myStats = myCoords.userStyleId.stats
    if (myStats.energy <= 0  || myStats.health <= 0) return res.status(400).json({ error: "Energy depleted" })
    if (entity.energy <= 0) return res.status(400).json({ error: "Already Destroyed" })

    // Step 1: Set the key in redis, if it exists return early 
    const layerIdx = myCoords.layerIdx     
    const entityId = new mongoose.Types.ObjectId(entity._id)    
    const { mainRider, ...realEntity } = entity

    const entityKey = `entity:${entity._id}`
    const lock = await redis.set(entityKey, 'locked', { EX: 3, NX: true })

    const keysArr = [ [lock, entityKey] ]
    let mainRiderKey
    let mainRiderLock
    
    if (mainRider) {
        mainRiderKey = `user:${mainRider._id}`
        mainRiderLock = await redis.set(mainRiderKey, 'locked', { EX: 3, NX: true })
        keysArr.push([ mainRiderLock, mainRiderKey ])
    }

    if (!lock || (mainRiderKey && !mainRiderLock)) {
        await deleteKeys(keysArr)
        return res.status(409).json({ error: 'Entity is being used, try again' })
    }

    // Step 2: Update the user's energy
    const myStatField = "energy"
    let myNewStats
    try {
        myNewStats = await updateLuaStats(myStats, myStatField, actualEnergyCost, frontendLgn, myCoords._id)
    } catch (err) {
        await redis.del(entityKey)
        console.log(err)
        return res.status(err.statusCode || 500).json({error: err.message || "Internal Server Error"})
    }
  
    const session = await mongoose.startSession()
    try {
        // Step 4: Create results payload and emit
        const theCityId = 'testId'
        changeInsTime = realEntity.grp === "animal" && realEntity.ins === "escape"
        const otherUsersData = { _id: myCoords._id, layerIdx, plotId: myCoords.plotId, on: myCoords.on, stats: myNewStats } 
        const results = { updating: changeInsTime ? { ...realEntity, insTime: Date.now() } : realEntity, mainRider, otherUsersData, animation }
        for (const emitId of emissionView) {
            const room = `cityId-${theCityId}-plotId-${emitId}`
            io.to(room).emit("entityHit", results)
        }

        // Step 5: Save to db
        const oldStats = userStatCache.get(myCoords._id)
        userStatCache.set(myCoords._id, { ...oldStats, [`stats.energy`]: myNewStats.energy, [`stats.lgn`]: myNewStats.lgn, 
        [`stats.endurance`]: myNewStats.endurance, userStyleId })

        session.startTransaction()
        const { updating } = results
        
        if (!results.mainRider) {
            const updated = await Plot.findOneAndUpdate(
                { city: cityId, id: myCoords.plotId }, 
                { $set: {[`layers.${layerIdx}.entities.$[ent]`]: updating } }, 
                { new: true, session, arrayFilters: [{ "ent._id": entityId }] }
            )
            if (!updated) throw createError("Unable to hit entity", 400)
        } else {
            const myNewCoords = await CityUser.findByIdAndUpdate(results.mainRider._id, { $set: { riding: results.updating } }, { new: true, session })
            if (!myNewCoords) throw createError("Unable to update my coords", 400)
        }

        await handleSuccessSession(session)
        await deleteKeys(keysArr)
        res.status(201).json({ success: "Entity hit successful" })
    } catch (err) {
        console.log(err)
        await deleteKeys(keysArr)
        await handleEndSession(session)
        res.status(err.statusCode || 500).json({error: err.message || "Internal Server Error"})
    }
}

const handleHitDestroyEntity = async ({ myCoords, animation, entity, entityProducts, frontendLgn, actualEnergyCost, cityId, emissionView,  myCoordsIdFromReq, mySocketId, res }) => {
    if (!myCoords || !myCoords.userStyleId || !myCoords.userStyleId?.stats || !cityId || !entity) return res.status(400).json({ error: "Bad request"})
    if (String(myCoords._id) !== String(myCoordsIdFromReq)) return res.status(409).json({ error: "Unauthorised user"})
        
    const userStyleId = myCoords.userStyleId._id
    const myStats = myCoords.userStyleId.stats
    if (myStats.energy <= 0  || myStats.health <= 0) return res.status(400).json({ error: "Energy depleted" })
    if (entity.energy <= 0) return res.status(400).json({ error: "Already Destroyed" })

    // Step 1: Set the key in redis, if it exists return early 
    const layerIdx = myCoords.layerIdx     
    const entityKey = `entity:${entity._id}`
    const lock = await redis.set(entityKey, 'locked', { EX: 3, NX: true })

    // Step 2: Create keys and locks for entity products
    let primaryKey
    let secondaryKey
    let resourceKey
    let primaryLock
    let secondaryLock
    let resourceLock
    let entityProductsWithIds
    let mainRiderKey
    let mainRiderLock

    if (entityProducts.length > 0) {
        entityProductsWithIds = entityProducts.map(ep => {
            const { type, ...realEp } = ep 
            const testChild = { _id: new mongoose.Types.ObjectId(), createdAt: Date.now(), ...realEp }
            const newChildDoc = new mongoose.Document(testChild, layerEntitySchema)
            const newChild = newChildDoc.toObject()
            const key = `entity:${newChild._id}`
            if (type === "primary") primaryKey = key
            else if (type === "secondary") secondaryKey = key
            else if (type === "resource") resourceKey = key
            return newChild
        })

        primaryLock = primaryKey ? await redis.set(primaryKey, 'locked', { EX: 3, NX: true }) : null
        secondaryLock = secondaryKey ? await redis.set(secondaryKey, 'locked', { EX: 3, NX: true }) : null
        resourceLock = resourceKey ? await redis.set(resourceKey, 'locked', { EX: 3, NX: true }) : null
    }

    // step 2b: Create keyArray
    const { mainRider, ...realEntity } = entity

    const keysArr = [ [lock, entityKey], [primaryLock, primaryKey],
    [secondaryLock, secondaryKey], [resourceLock, resourceKey] ]
    
    if (mainRider) {
        mainRiderKey = `user:${mainRider._id}`
        mainRiderLock = await redis.set(mainRiderKey, 'locked', { EX: 3, NX: true })
        keysArr.push([ mainRiderLock, mainRiderKey ])
    }

    if (!lock || (primaryKey && !primaryLock) || (secondaryKey && !secondaryLock) || (resourceKey && !resourceLock) 
    || (mainRiderKey && !mainRiderLock)) {
        await deleteKeys(keysArr)
        return res.status(409).json({ error: 'Entity is being used, try again' })
    }

    // Step 3: Update the user's energy
    const myStatField = "energy"
    let myNewStats
    try {
        myNewStats = await updateLuaStats(myStats, myStatField, actualEnergyCost, frontendLgn, myCoords._id)
    } catch (err) {
        await deleteKeys(keysArr)
        console.log(err)
        return res.status(err.statusCode || 500).json({error: err.message || "Internal Server Error"})
    }

    // Step 4a: Create results payload 
    const theCityId = 'testId'
    const otherUsersData = { _id: myCoords._id, layerIdx, plotId: myCoords.plotId, on: myCoords.on, stats: myNewStats } 
    const results = { removing: mainRider ? null : realEntity, mainRider, adding: entityProductsWithIds, otherUsersData, animation }

    const session = await mongoose.startSession()
    try {
        // Step 4b: Emit to users
        for (const emitId of emissionView) {
            const room = `cityId-${theCityId}-plotId-${emitId}`
            io.to(room).emit("destroyHit", results)
        }

        // Step 5: Save to db
        const oldStats = userStatCache.get(myCoords._id)
        userStatCache.set(myCoords._id, { ...oldStats, [`stats.energy`]: myNewStats.energy, [`stats.lgn`]: myNewStats.lgn, 
        [`stats.endurance`]: myNewStats.endurance, userStyleId })  

        session.startTransaction()
        const { adding, removing } = results

        const layerPath = `layers.${layerIdx}.entities`
        if (removing?._id) {
            const updated = await Plot.updateOne(
                { city: cityId, id: myCoords.plotId },
                { $pull: { [layerPath]: { _id: new mongoose.Types.ObjectId(removing._id) } } },
                { session }
            )
            if (!updated) throw createError("Unable to hit entity", 400)
        }

        if (adding?.length > 0) {
            const updated = await Plot.updateOne(
                { city: cityId, id: myCoords.plotId },
                { $addToSet: { [layerPath]: { $each: adding } } },
                { session }
            )
            if (!updated) throw createError("Unable to hit entity", 400)
        }
        
        if (results.mainRider) {
            const myNewCoords = await CityUser.findByIdAndUpdate(results.mainRider._id, { $set: { riding: null} }, { new: true, session })
            if (!myNewCoords) throw createError("Unable to update my coords", 400)
        }
        await handleSuccessSession(session)
        await deleteKeys(keysArr)
        res.status(201).json({ success: "Entity hit successful" })
    } catch (err) {
        console.log(err)
        await deleteKeys(keysArr)
        await handleEndSession(session)
        res.status(err.statusCode || 500).json({error: err.message || "Internal Server Error"})
    }
}

const updateLuaStats = async (myStats, statField, cost, frontendLgn, userId) => {
    const args = [
        cost, statField, frontendLgn ?? 0, myStats.health, myStats.immunity, myStats.energy, myStats.endurance, 
        myStats.strength, myStats.smarts, myStats.speed, myStats.damage, myStats.lgn ?? 0, Date.now() 
    ].map(v => String(v))
    const result = await redis.eval(luaStatsUpdateScript, {
        keys: [`userstats:${userId}`],
        arguments: args
    })

    const [status, payload] = result

    if (status !== "OK") {
        console.log(payload)
        throw createError("Redis failed to update stats", 409)
    }

    const stats = hgetallToObject(payload)
    const myNewStats = { ...stats, lgn: stats.lgn ? stats.lgn : null } // return 0 back to null
    return myNewStats
}

// Planting trees
const handlePlant = async ({ entity, myCoords, cityId, emissionView,  myCoordsIdFromReq, mySocketId, res }) => {
    if (!entity || !myCoords || !myCoords.userStyleId || !myCoords?.on || myCoords.held || !cityId) return res.status(400).json({ error: "Bad request"})
    if (String(myCoords._id) !== String(myCoordsIdFromReq)) return res.status(409).json({ error: "Unauthorised user"})

    const userStyleId = myCoords.userStyleId._id
    const myStats = myCoords.userStyleId.stats
    if (myStats.energy <= 0  || myStats.health <= 0) return res.status(400).json({ error: "Energy depleted" })

    const plantId = new mongoose.Types.ObjectId()
    const updatedEntity = { _id: plantId, ...entity }
    const plantDoc = new mongoose.Document(updatedEntity, layerEntitySchema)
    const plant = plantDoc.toObject()
    if (!plant) return res.status(400).json({ error: "Plant could not be created" })

    
    // Step 1: Create locks for my user and the plant
    const myUserKey = `user:${myCoords._id}`
    const plantKey = `entity:${plant._id}`

    const userLock = await redis.set(myUserKey, 'locked', { EX: 3, NX: true })
    const plantLock = await redis.set(plantKey, 'locked', { EX: 3, NX: true })

    const keysArr = [ [userLock, myUserKey], [plantLock, plantKey] ]

    console.log({ userLock, plantLock })
    if (!userLock || !plantLock) {
        await deleteKeys(keysArr)
        return res.status(409).json({ error: 'User is busy, try again' })
    }

    // Step 2: create results payload
    const holding = null
    const adding = plant
    const theCityId = 'testId'
    const layerIdx = myCoords.layerIdx     
    const otherUsersData = { _id: myCoords._id, layerIdx, plotId: myCoords.plotId, on: myCoords.on } 
    const results = { holding, adding, otherUsersData }
    
    const session = await mongoose.startSession()
    try {   
        // Step 3: Emit the results to users
        for (const emitId of emissionView) {
            const room = `cityId-${theCityId}-plotId-${emitId}`
            io.to(room).emit("entityDropped", results)
        }

        // Step 3: Handle db operations
        session.startTransaction()
        
        // Drop entity
        const updated = await dropHolding((results.adding), myCoords, cityId, session)
        if (!updated) throw createError("Unable to drop entity", 400)
        
        // Hold new
        const myNewCoords = await CityUser.findByIdAndUpdate(myCoords._id, { $set: { holding: results.holding } }, { new: true, session })
        if (!myNewCoords) throw createError("Unable to update my coords", 400)
        
        await handleSuccessSession(session)
        await deleteKeys(keysArr)
        console.log("finished")
        res.status(201).json({ success: "Seeds planted successfully" })
    } catch (err) {
        console.log(err)
        await deleteKeys(keysArr)
        await handleEndSession(session)
        res.status(err.statusCode || 500).json({error: err.message || "Internal Server Error"})
    }
}

// Riding entities
const handleRide = async ({ myCoords, entity, cityId, emissionView, myCoordsIdFromReq, mySocketId, res }) => {
    if (!entity || !myCoords || !myCoords.userStyleId || !myCoords?.on || myCoords.held || !cityId) return res.status(400).json({ error: "Bad request"})
    if (String(myCoords._id) !== String(myCoordsIdFromReq)) return res.status(409).json({ error: "Unauthorised user"})

    const myStats = myCoords.userStyleId.stats
    if (myStats.energy <= 0  || myStats.health <= 0) return res.status(400).json({ error: "Energy depleted" })

    // Step 1: Create locks for my user and the plant
    const myUserKey = `user:${myCoords._id}`
    const entityKey = `entity:${entity._id}`

    const userLock = await redis.set(myUserKey, 'locked', { EX: 3, NX: true })
    const entityLock = await redis.set(entityKey, 'locked', { EX: 3, NX: true })

    const keysArr = [ [userLock, myUserKey], [entityLock, entityKey] ]

    console.log({ userLock, entityLock })
    if (!userLock || !entityLock) {
        await deleteKeys(keysArr)
        return res.status(409).json({ error: 'Entity is being used, try again' })
    }

    // Step 2: create results payload
    const removing = entity
    const theCityId = 'testId'
    const layerIdx = myCoords.layerIdx     
    const otherUsersData = { _id: myCoords._id, layerIdx, plotId: myCoords.plotId, on: myCoords.on } 
    const results = { removing, otherUsersData }
    
    const session = await mongoose.startSession()
    try {   
        // Step 3: Emit the results to users
        for (const emitId of emissionView) {
            const room = `cityId-${theCityId}-plotId-${emitId}`
            io.to(room).emit("ride", results)
        }
        // return res.json({ success: "OK" })

        // Step 3: Handle db operations
        session.startTransaction()
        
        // Update entity
        const updated = await Plot.updateOne(
            { city: cityId, id: myCoords.plotId },
            { $pull: { [`layers.${layerIdx}.entities`]: { _id: removing._id } } },
            { session }
        )
        if (!updated) throw createError("Unable to ride entity", 400)
        
        // Update myCoords
        const myNewCoords = await CityUser.findByIdAndUpdate(
            myCoords._id, 
            { $set: { riding: removing, x: removing.p[0], y: removing.p[1], facing: removing.f } }, 
            { new: true, session })
        if (!myNewCoords) throw createError("Unable to update my coords", 400)
        
        await handleSuccessSession(session)
        await deleteKeys(keysArr)
        console.log("finished")
        res.status(201).json({ success: "Entity mounted successfully" })
    } catch (err) {
        console.log(err)
        await deleteKeys(keysArr)
        await handleEndSession(session)
        res.status(err.statusCode || 500).json({error: err.message || "Internal Server Error"})
    }
}

const handleRideIns = async ({ myCoords, entity, cityId, emissionView, myCoordsIdFromReq, mySocketId, res }) => {
    if (!entity || !myCoords || !myCoords.userStyleId || !myCoords?.on || myCoords.held || !cityId) return res.status(400).json({ error: "Bad request"})
    if (String(myCoords._id) !== String(myCoordsIdFromReq)) return res.status(409).json({ error: "Unauthorised user"})

    const myStats = myCoords.userStyleId.stats
    if (myStats.health <= 0) return res.status(400).json({ error: "Health depleted" })

    // Step 1: Create locks for my user and the plant
    const myUserKey = `user:${myCoords._id}`
    const entityKey = `entity:${entity._id}`

    const userLock = await redis.set(myUserKey, 'locked', { EX: 3, NX: true })
    const entityLock = await redis.set(entityKey, 'locked', { EX: 3, NX: true })

    const keysArr = [ [userLock, myUserKey], [entityLock, entityKey] ]
    console.log({ userLock, entityLock })
    if (!userLock || !entityLock) {
        await deleteKeys(keysArr)
        return res.status(409).json({ error: 'Entity is being used, try again' })
    }

    // Step 2: create results payload
    const updating = { ins: entity.ins, insTime: entity.insTime }
    const theCityId = 'testId'
    const layerIdx = myCoords.layerIdx     
    const otherUsersData = { _id: myCoords._id, layerIdx, plotId: myCoords.plotId, on: myCoords.on } 
    const results = { updating, otherUsersData }
    
    const session = await mongoose.startSession()
    try {   
        // Step 3: Emit the results to users
        for (const emitId of emissionView) {
            const room = `cityId-${theCityId}-plotId-${emitId}`
            io.to(room).emit("ride-ins", results)
        }
        // return res.status(201).json({ success: "OK" })

        // Step 3: Handle db operations
        session.startTransaction()
        
        // Update user
        const myNewCoords = await CityUser.findByIdAndUpdate(
            myCoords._id, 
            { $set: { 'riding.ins': updating.ins, 'riding.insTime': updating.insTime } }, 
            { new: true, session })
        if (!myNewCoords) throw createError("Unable to update my coords", 400)
        
        await handleSuccessSession(session)
        await deleteKeys(keysArr)
        console.log("finished")
        res.status(201).json({ success: "Entity walking successfully" })
    } catch (err) {
        console.log(err)
        await deleteKeys(keysArr)
        await handleEndSession(session)
        res.status(err.statusCode || 500).json({error: err.message || "Internal Server Error"})
    }
}

const handleAlight = async ({ myCoords, entity, cityId, emissionView, myCoordsIdFromReq, mySocketId, res }) => {
    if (!entity || !myCoords || !myCoords.userStyleId || !myCoords?.on || myCoords.held || !cityId) return res.status(400).json({ error: "Bad request"})
    if (String(myCoords._id) !== String(myCoordsIdFromReq)) return res.status(409).json({ error: "Unauthorised user"})

    const myStats = myCoords.userStyleId.stats
    if (myStats.health <= 0) return res.status(400).json({ error: "Health depleted" })

    // Step 1: Create locks for my user and the plant
    const myUserKey = `user:${myCoords._id}`
    const entityKey = `entity:${entity._id}`

    const userLock = await redis.set(myUserKey, 'locked', { EX: 3, NX: true })
    const entityLock = await redis.set(entityKey, 'locked', { EX: 3, NX: true })

    const keysArr = [ [userLock, myUserKey], [entityLock, entityKey] ]

    console.log({ userLock, entityLock })
    if (!userLock || !entityLock) {
        await deleteKeys(keysArr)
        return res.status(409).json({ error: 'Entity is being used, try again' })
    }

    // Step 2: create results payload
    const adding = entity
    const theCityId = 'testId'
    const layerIdx = myCoords.layerIdx     
    const otherUsersData = { _id: myCoords._id, layerIdx, plotId: myCoords.plotId, on: myCoords.on } 
    const results = { adding, otherUsersData }
    
    const session = await mongoose.startSession()
    try {   
        // Step 3: Emit the results to users
        for (const emitId of emissionView) {
            const room = `cityId-${theCityId}-plotId-${emitId}`
            io.to(room).emit("alight", results)
        }
        // return res.json({ success: "OK" })

        // Step 3: Handle db operations
        session.startTransaction()
        
        // Update entity
        const updated = await dropHolding((results.adding), myCoords, cityId, session)
        if (!updated) throw createError("Unable to drop entity", 400)
        
        // Update myCoords
        const myNewCoords = await CityUser.findByIdAndUpdate(
            myCoords._id, 
            { $set: { riding: null } }, 
            { new: true, session })
        if (!myNewCoords) throw createError("Unable to update my coords", 400)
        
        await handleSuccessSession(session)
        await deleteKeys(keysArr)
        console.log("finished")
        res.status(201).json({ success: "Entity mounted successfully" })
    } catch (err) {
        console.log(err)
        await deleteKeys(keysArr)
        await handleEndSession(session)
        res.status(err.statusCode || 500).json({error: err.message || "Internal Server Error"})
    }
}

const luaStatsStyleUpdate = `
    local key = KEYS[1]
    local i = 1

    local function round1(x)
        return math.floor(x * 10 + 0.5) / 10
    end

    local function toNumber(val)
        if val == "__INF__" then
            return math.huge
        elseif val == "__NEG_INF__" then
            return -math.huge
        else
            return tonumber(val)
        end
    end

    if redis.call("EXISTS", key) == 0 then
        if ARGV[i] ~= "__INIT__" then
            return {"ERR", "INIT_REQUIRED"}
        end
        i = i + 1

        while ARGV[i] ~= "__COST__" do
            local field = ARGV[i]
            local value = ARGV[i + 1]
            redis.call("HSET", key, field, value)
            i = i + 2
        end
        redis.call("EXPIRE", key, 30)
    end

    while ARGV[i] ~= "__COST__" do
        i = i + 1
    end
    i = i + 1

    local time = redis.call("TIME")
    local currentTime = (time[1] * 1000) + math.floor(time[2] / 1000)
    
    while i <= #ARGV do
        local field = ARGV[i]
        local cost = tonumber(ARGV[i + 1])
        local min = toNumber(ARGV[i + 2])
        local max = toNumber(ARGV[i + 3])
        local newValue
        local currentValue = tonumber(redis.call("HGET", key, field)) or 0

        if field == "energy" then
            local frontendLgn = tonumber(redis.call("HGET", key, "lgn"))
            local regenTime = 30000

            if currentValue == 100 then
                newValue = round1(math.min(math.max(currentValue + cost, min), max))
            else
                local tDiff = tonumber(currentTime) - frontendLgn
                local quantityRegenerated = math.floor(tDiff/regenTime)
                
                if quantityRegenerated > 0 then 
                    local newTime = ((quantityRegenerated * regenTime) + frontendLgn)
                    local regenEnergy = math.min(currentValue + quantityRegenerated, 100)
                    newValue = round1(math.min(math.max(regenEnergy + cost, min), max))
                    currentTime = newTime
                else
                    if currentValue <= 0 then 
                        return {"ERR", "STAT_CANNOT_BE_MODIFIED"}
                    end
                    newValue = round1(math.min(math.max(currentValue + cost, min), max))
                    currentTime = frontendLgn
                end
            end
        elseif field == "lgn" then
            newValue = currentTime
        else
            newValue = round1(math.min(math.max(currentValue + cost, min), max))
        end

        redis.call("HSET", key, field, newValue)
        i = i + 4
    end

    return {"OK", redis.call("HGETALL", key)}
`

const updateSelectedStats = async (args, key, mode) => {
    const argvs = args.map(v => String(v))
    // console.log({ argvs })
    const result = await redis.eval(luaStatsStyleUpdate, {
        keys: [key],
        arguments: argvs
    })

    const [status, payload] = result

    if (status !== "OK") {
        console.log(payload)
        throw createError("Redis failed to update stats", 409)
    }

    const stats = hgetallToObject(payload)
    const myNewStats = { ...stats, ...(mode === "stats" ? {lgn: stats.lgn ? stats.lgn : null} : {}) } // return 0 back to null
    return myNewStats
}

const handleEat = async ({ myCoords, entity, nutrient, bite, cityId, emissionView, myCoordsIdFromReq, mySocketId, res }) => {
    if (!entity || !nutrient || !bite || !myCoords || !myCoords.userStyleId || !myCoords?.on || myCoords.held || !cityId) return res.status(400).json({ error: "Bad request"})
    if (String(myCoords._id) !== String(myCoordsIdFromReq)) return res.status(409).json({ error: "Unauthorised user"})

    const myStats = myCoords.userStyleId.stats
    if (myStats.health <= 0) return res.status(400).json({ error: "Health depleted" })
    if (entity.energy <= 0) return res.status(400).json({ error: "Already eaten" })

    const userStyle = myCoords.userStyleId
    const neededStyle = { width: userStyle.width, musc: userStyle.musc, curve: userStyle.curve }

    // Step 1: Set the key in redis, if it exists return early 
    const myUserKey = `user:${myCoords._id}`
    const entityKey = `entity:${entity._id}`
    
    const userLock = await redis.set(myUserKey, 'locked', { EX: 3, NX: true })
    const entityLock = await redis.set(entityKey, 'locked', { EX: 3, NX: true })

    const keysArr = [ [userLock, myUserKey], [entityLock, entityKey] ]

    console.log({ userLock, entityLock })
    if (!userLock || !entityLock) {
        await deleteKeys(keysArr)
        return res.status(409).json({ error: 'Entity is being used, try again' })
    }

    // Step 2: Update the user's stats
    let statCosts = []
    let myNewStats = {}
    let styleCosts = []
    let myNewStyle = {}
    if (nutrient.stats) {
        const nutrientStats = { ...nutrient.stats, lgn: Date.now() }
        Object.keys(nutrientStats).map(key => statCosts.push(key, nutrientStats[key], statMins[key], statMaxs[key]))
    }
    if (nutrient.style) {
        const gender = userStyle.gender
        const { curve, ...rest } = nutrient.style
        const nutrientStyle = gender === "female" ? nutrient.style : rest
        Object.keys(nutrientStyle).map(key => styleCosts.push(key, nutrientStyle[key], mins[gender][key], maxs[gender][key]))
    }
    try {
        if (statCosts.length > 0) {
            const ARGV = [
                "__INIT__",
                "health",  myStats.health,
                "energy",  myStats.energy,
                "endurance", myStats.endurance,
                "strength", myStats.strength,
                "smarts", myStats.smarts,
                "speed", myStats.speed,
                "damage", myStats.damage,
                "immunity", myStats.immunity,
                "lgn", myStats.lgn ?? Date.now(),

                "__COST__",
                ...statCosts
            ]
            myNewStats = await updateSelectedStats(ARGV, `userstats:${myCoords._id}`, "stats")
        }
        if (styleCosts.length > 0) {
            const ARGV = [
                "__INIT__",
                "width",  neededStyle.width,
                "musc",  neededStyle.musc,
                "curve",  neededStyle.curve ?? 0,
                "__COST__",
                ...styleCosts
            ]
            myNewStyle = await updateSelectedStats(ARGV, `userstyle:${myCoords._id}`, "style")
        }
    } catch (err) {
        await deleteKeys(keysArr)
        console.log(err)
        return res.status(err.statusCode || 500).json({error: err.message || "Internal Server Error"})
    }
    console.log({ myNewStats })
    console.log({ myNewStyle })

    // Step 3: Update the entity
    let holding
    const remaining = entity.energy - bite
    if (remaining > 0) {
        holding = { ...entity, energy: remaining }
    } else if (!remaining && entity.q && entity.q > 1) {
        const { q, ...rest } = entity
        newQ = q - 1
        holding = { ...rest, ...(newQ > 1 ? { q: newQ, energy: 100 } : { energy: 100 }) }
    } else {
        holding = null
    }

    // Step 4: Create the payload
    const theCityId = 'testId'
    const layerIdx = myCoords.layerIdx     
    const newUserStyle = { ...userStyle, ...myNewStyle, stats: myNewStats }
    const otherUsersData = { _id: myCoords._id, layerIdx, plotId: myCoords.plotId, on: myCoords.on } 
    const results = { holding, otherUsersData, mode: "eat", newUserStyle }
    
    const session = await mongoose.startSession()
    try {   
        // Step 3: Emit the results to users
        for (const emitId of emissionView) {
            const room = `cityId-${theCityId}-plotId-${emitId}`
            io.to(room).emit("entityPicked", results)
        }

        // Step 3: Handle db operations
        session.startTransaction()
        const userStyleId = userStyle._id
        const oldStats = userStatCache.get(myCoords._id)
        const { statsObj, styleObj } = getStatsStyleObj(statCosts, myNewStats, styleCosts, myNewStyle)
        userStatCache.set(myCoords._id, { ...oldStats, ...statsObj, ...styleObj, userStyleId })
        
        // Update myCoords
        const myNewCoords = await CityUser.findByIdAndUpdate(
            myCoords._id, 
            { $set: { holding: results.holding } }, 
            { new: true, session })
        if (!myNewCoords) throw createError("Unable to update my coords", 400)
        
        await handleSuccessSession(session)
        await deleteKeys(keysArr)
        console.log("finished")
        res.status(201).json({ success: "Entity eaten successfully" })
    } catch (err) {
        console.log(err)
        await deleteKeys(keysArr)
        await handleEndSession(session)
        res.status(err.statusCode || 500).json({error: err.message || "Internal Server Error"})
    }
}

const getStatsStyleObj = (statCosts, myNewStats, styleCosts, myNewStyle) => {
    const statsObj = {}
    const styleObj = {}
    for (let i = 0; i < statCosts.length; i+=4) {
        const field = statCosts[i]
        const key = `stats.${field}`
        const value = myNewStats[field]
        statsObj[key] = value
    }
    for (let i = 0; i < styleCosts.length; i+=4) {
        const field = styleCosts[i]
        const key = `${field}`
        const value = myNewStyle[field]
        styleObj[key] = value
    }
    return { statsObj, styleObj }
}

module.exports = { 
    handleCollect, handlePick, handleDrop,
    handlePickEarthly, handleDropEarthly,
    handlePickUser, handleDropUser,
    handleEscape, updateCount,
    handleWalk, handleHitUser, handleHitEntity, handleHitDestroyEntity,
    handlePlant, handleRide, handleRideIns, handleAlight,
    handleEat
}