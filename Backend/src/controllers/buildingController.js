const { default: mongoose } = require("mongoose")
const User = require("../models/users")
const { createError, handleEndSession, handleSuccessSession } = require("../utils/databaseHelpers")
const { BuildingRequest, PreBoughtBuilding } = require("../models/Buildings")
const { CityRoles } = require("../models/Cities")

const approveBuildingRequest = async (req, res) => {
    const session = await mongoose.startSession()
    session.startTransaction()

    try {
        const { userId, userObjectId } = req

        const user = await User.findById(userId)
        if (!user) {
            throw createError("No user found", 404)
        }

        if (!user.location?.city) {
            throw createError("User does not have a city assigned", 400)
        }        

        const cityRoles = await CityRoles.findOne({ cityId: user.location.city })
        if (!cityRoles) {
            throw createError("No city roles found!", 404)
        }

        const buildingSupervisors = new Set(cityRoles.buildingSupervisors.map((id) => id.toString()))
        if (!buildingSupervisors.has(userId)) {
            throw createError("Unauthorized Supervisor", 400)
        }

        const { tags, requestId } = req.body
        if (!mongoose.Types.ObjectId.isValid(requestId)) {
            throw createError("Invalid request ID", 400)
        }

        const buildingRequest = await BuildingRequest.findById(requestId)
        if (!buildingRequest) {
            throw createError("No request found", 404)
        }

        if (!Array.isArray(tags) || tags.length === 0 || tags.some(tag => typeof tag !== 'string' || tag.trim() === '')) {
            throw createError("Invalid tags", 400)
        }

        if (buildingRequest.status !== "pending") {
            throw createError("Request already processed", 400)
        }

        buildingRequest.status = "approved"
        buildingRequest.supervisor = userObjectId
        const savedRequest = await buildingRequest.save({ session })

        const newBuildingData = {
            name: buildingRequest.name,
            buildingType: buildingRequest.buildingType,
            pictureUrl: buildingRequest.pictureUrl,
            tags,
            maxRooms: buildingRequest.maxRooms,
            maxOccupants: buildingRequest.maxOccupants,
            price: buildingRequest.price,
            architect: buildingRequest.architect,
            supervisor: userObjectId,
            location: new mongoose.Types.ObjectId(user.location.city)
        }

        const newBuildingInstance = new PreBoughtBuilding(newBuildingData)
        const newBuilding = await newBuildingInstance.save({ session })
        
        handleSuccessSession(session)
        return res.status(200).json({ success: "Building Plan Created!", building: newBuilding, request: savedRequest })
    } catch (err) {
        console.error(`[APPROVE_BUILDING_REQUEST] Error for user ${req?.userId || ''} - ${err.stack || err}`)
        handleEndSession(session)
        return res.status(err.statusCode || 500).json({ error: err.message || "Internal Server Error" })
    }
}

const denyBuildingRequest = async (req, res) => {
    const session = await mongoose.startSession()
    session.startTransaction()

    try {
        const { userId, userObjectId } = req

        const user = await User.findById(userId)
        if (!user) {
            throw createError("No user found", 404)
        }

        if (!user.location?.city) {
            throw createError("User does not have a city assigned", 400)
        }        

        const cityRoles = await CityRoles.findOne({ cityId: user.location.city })
        if (!cityRoles) {
            throw createError("No city roles found!", 404)
        }

        const buildingSupervisors = new Set(cityRoles.buildingSupervisors.map((id) => id.toString()))
        if (!buildingSupervisors.has(userId)) {
            throw createError("Unauthorized Supervisor", 400)
        }

        const { comments, requestId } = req.body
        if (!mongoose.Types.ObjectId.isValid(requestId)) {
            throw createError("Invalid request ID", 400)
        }

        const buildingRequest = await BuildingRequest.findById(requestId)
        if (!buildingRequest || !comments) {
            throw createError("Incomplete field", 400)
        }

        buildingRequest.comments = comments
        buildingRequest.status = "denied"
        buildingRequest.supervisor = userObjectId
        const savedRequest = await buildingRequest.save({ session })

        await handleSuccessSession(session)
        return res.status(200).json({ success: "Request Denied", request: savedRequest })
    } catch (err) {
        console.error(`[DENY_BUILDING_REQUEST] Error for user ${req?.userId || ''} - ${err.stack || err}`)
        await handleEndSession(session)
        return res.status(err.statusCode || 500).json({ error: err.message || "Internal Server Error" })
    }
}

module.exports = { approveBuildingRequest, denyBuildingRequest }