const { default: mongoose } = require("mongoose")
const { BuildingRequest } = require("../models/Buildings")
const User = require("../models/users")
const { CityRoles } = require("../models/Cities")
const { handleEndSession, handleSuccessSession, createError } = require("../utils/databaseHelpers")
const uploadMedia = require("../utils/uploadMedia")

const getMyBuildingRequests = async (req, res) => {
    const { userId, userObjectId } = req

    const session = await mongoose.startSession()
    session.startTransaction()

    try {
        const user = await User.findById(userId)
        if (!user) {
            throw createError("User not found", 404)
        }

        const cityRoles = await CityRoles.findOne({ cityId: user.location.city })
        if (!cityRoles) {
            throw createError("No city roles found!", 404)
        }

        const buildingSupervisors = new Set(cityRoles.buildingSupervisors.map((id) => id.toString()))
        let myBuildingRequests
        if (!buildingSupervisors.has(userId)) {
            myBuildingRequests = await BuildingRequest.find({ architect: userObjectId }).sort({ createdAt: -1 }).populate({
                path: "supervisor",
                select: "username"
            })
        } else {
            myBuildingRequests = await BuildingRequest.find({ location: cityRoles.cityId }).populate({
                path: 'location',
                select: 'name country continent',
                populate: [
                    {
                        path: 'country',
                        select: 'name'
                    }, {
                        path: 'continent',
                        select: 'name'
                    }
                ]
            }).populate({
                path: "architect",
                select: "username"
            }).populate({
                path: "supervisor",
                select: "username"
            })
        }

        await handleSuccessSession(session)
        if (!myBuildingRequests) {
            return res.status(200).json([])
        }
        return res.status(200).json(myBuildingRequests)
    } catch (err) {
        console.log(err)
        handleEndSession(session)
        return res.status(err.statusCode || 500).json({error: err.message || "Internal Server Error"})
    }
}

const createBuildingRequest = async (req, res) => {
    const session = await mongoose.startSession()
    session.startTransaction()

    try {
        const { userId, userObjectId } = req
        const user = await User.findById(userId).session(session)
        const { name, buildingType, maxRooms, maxOccupants, price } = req.body

        if (!req.file) {
            throw createError("No Building Image", 400)
        }

        if (!user) {
            throw createError("No user found", 404)
        }

        if (!buildingType || !name || !parseInt(maxRooms) || (!isNaN(maxRooms) && maxRooms < 2) 
            || !parseInt(maxOccupants) || (!isNaN(maxOccupants) && maxOccupants < 1) 
            || !price || isNaN(parseFloat(price))) {
            throw createError("Invalid Inputs", 404)
        }

        let pictureUrl = null
        try {
            pictureUrl = await uploadMedia(req.file, 'image')
        } catch (err) {
            throw createError("Error Uploading Image", 400)
        }

        const requestDetails = {
            name,
            buildingType,
            maxRooms,
            maxOccupants,
            price,
            pictureUrl,
            status: "pending",
            architect: userId,
            location: user.location.city
        }

        const newRequest = new BuildingRequest(requestDetails)

        if (!newRequest) {
            throw createError("Failed to create building request", 400)
        }

        await newRequest.save({ session })
        await handleSuccessSession(session)

        return res.status(201).json({ success: "Request Sent", request: newRequest })
    } catch (err) {
        console.log(err)
        handleEndSession(session)
        return res.status(err.statusCode || 500).json({error: err.message || "Internal Server Error"})
    }
}

module.exports = { getMyBuildingRequests, createBuildingRequest }