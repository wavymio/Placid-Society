const { default: mongoose } = require("mongoose")
const { handleEndSession, handleSuccessSession, createError } = require("../utils/databaseHelpers")
const { Plot } = require("../models/Plots")
const { City, CityConfig } = require("../models/Cities")
const { userSocketMap, io } = require("../socket/socket")
const { handleCollect, handlePick, handleDrop, handlePickEarthly, handleDropEarthly, handlePickUser, handleDropUser, handleEscape, handleWalk, handleHitUser, handleHitEntity, handleHitDestroyEntity, handlePlant, handleRideRest, handleRideWalk, handleRide, handleRideIns, handleAlight, handleEat } = require("../utils/actions")

const getPlots = async (req, res) => {
    try {
        const { cityId, plots } = req.body

        if (!cityId || !plots) throw createError("Incomplete payload", 400)
        if (!Array.isArray(plots)|| plots?.length === 0) throw createError("Please provide the plots", 400)

        const existingCity = await City.findById(cityId)
        if (!existingCity) throw createError("City not found", 404)

        const existingPlots = await Plot.find({ city: cityId, id: { $in: plots } }).lean()
        if (!existingPlots) throw createError("Couldn't get plots", 400)

        return res.status(200).json({success: "Plots retrieved Successfully!", plots: existingPlots})
    } catch (err) {
        console.log(err)
        return res.status(err.statusCode || 500).json({error: err.message || "Internal Server Error"})
    }
} 

const createPlots = async (req, res) => {
    const session = await mongoose.startSession()
    session.startTransaction()
    
    try {
        const { cityId, plotId, layers, emitView } = req.body

        if (!cityId || !plotId || !layers || !emitView) throw createError("Incomplete payload", 400)
        if (!Array.isArray(layers)) throw createError("Layers must be an array", 400)
        if (!Array.isArray(emitView)) throw createError("Please provide emission plots", 400)

        const existingCityConfig = await CityConfig.findOne({ cityId }).session(session)
        if (!existingCityConfig) throw createError("City not found", 404)

        const result = await Plot.updateOne(
            { city: cityId, id: plotId },       // filter: target document
            { $setOnInsert: { layers } },       // only insert if missing
            { upsert: true, session }           // atomic upsert
        )

        // result will look like
        // {
        // acknowledged: true,
        // matchedCount: 1,
        // modifiedCount: 0,
        // upsertedId: ObjectId("...") // exists only if an insert happened ie for the first sender
        // }

        const isCreated = !!result.upsertedId
        if (!isCreated) throw createError("Plot already exists", 400)

        await CityConfig.updateOne(
            { cityId },
            { $addToSet: { modifiedPlots: plotId } },
            { session }
        )

        const plot = await Plot.findOne({ city: cityId, id: plotId }, { layers: 1 }).session(session).lean()
        const mySocketId = userSocketMap.get(req.userId)
        if (!mySocketId) throw createError("Socket not found", 404)
            
        const theCityId = 'testId'
        for (const emitId of emitView) {
            const room = `cityId-${theCityId}-plotId-${emitId}`
            io.to(room).except(mySocketId).emit("plotCreated", { id: plotId, layers: plot.layers  })
        }

        await handleSuccessSession(session)
        return res.status(201).json({success: "Plot Created Successfully!", plot: plot.layers})
    } catch (err) {
        console.log(err)
        await handleEndSession(session)
        return res.status(err.statusCode || 500).json({error: err.message || "Internal Server Error"})
    }
}

const handleActions = async (req, res) => {
    const { action, ...rest } = req.body
    const { myCoordsId: myCoordsIdFromReq } = req
    if (!action || !actionsMap[action]) return res.status(400).json({error: "No action specified"})
    const mySocketId = userSocketMap.get(req.userId)
    if (!mySocketId) throw createError("Socket not found", 404)
    await actionsMap[action]({ ...rest, myCoordsIdFromReq, mySocketId, res })
}

const actionsMap = {
    "collect": handleCollect,
    "pick": handlePick,
    "pickEarthly": handlePickEarthly,
    "pickUser": handlePickUser,
    "drop": handleDrop,
    "dropEarthly": handleDropEarthly,
    "dropUser": handleDropUser,
    "escape": handleEscape,
    "walk": handleWalk,
    "hitUser": handleHitUser,
    "hitEntity": handleHitEntity,
    "hitDestroyEntity": handleHitDestroyEntity,
    "plant": handlePlant,
    "ride": handleRide,
    "ride-walk": handleRideIns,
    "ride-run": handleRideIns,
    "ride-rest": handleRideIns,
    "alight": handleAlight,
    "eat": handleEat
}

module.exports = { getPlots, createPlots, handleActions }