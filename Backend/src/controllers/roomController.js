const mongoose= require('mongoose')
const { io, userSocketMap } = require('../socket/socket')
const Room = require('../models/rooms')
const User = require('../models/users')

const getTrendingRooms = async (req, res) => {
    try {
        const rooms = await Room.aggregate([
            // Add a new field "participantsCount" which contains the length of the participants array
            { 
                $addFields: { participantsCount: { $size: "$participants" } }
            },
            // Sort by "participantsCount" in descending order
            { 
                $sort: { participantsCount: -1 }
            },
            // Limit the results to 20 rooms
            { 
                $limit: 20
            }
        ])

        if (!rooms) {
            return res.status(400).json({ error: "No rooms found" })
        }
        
        return res.status(200).json(rooms)
    } catch (err) {
        console.log(err)
        res.status(500).json({ error: "Internal server error" })
    }
}

const getRecentRooms = async (req, res) => {
    try {
        const rooms = await Room.find()
            .sort({ createdAt: -1 }) // Sort by createdAt field in descending order (newest to oldest)
            .limit(20) // Limit to 20 rooms

        if (!rooms) {
            return res.status(400).json({ error: "No rooms found" })
        }
        
        return res.status(200).json(rooms)
    } catch (err) {
        console.log(err)
        res.status(500).json({ error: "Internal server error" })
    }
}

const getTopRooms = async (req, res) => {
    try {
        const { userId } = req
        const rooms = await User.findById(userId)
            .select("recentRooms")
            

        if (!rooms) {
            return res.status(400).json({ error: "No rooms found" })
        }
        
        return res.status(200).json(rooms)
    } catch (err) {
        console.log(err)
        res.status(500).json({ error: "Internal server error" })
    }
}

const getRoom = async (req, res) => {
    try {
        const { roomId } = req.params
        let room
        try {
            room = await Room.findById(roomId)
            .populate({
                path: 'participants.userId',
                select: 'username profilePicture'
            })
            .populate('video')
            .populate('invitedUsers')
            .populate({
                path: 'owner',
                select: 'username profilePicture'
            })
            .populate({
                path: 'admins',
                select: 'username profilePicture'
            })
            .populate('conversation')

            if (!room) {
                return res.status(404).json({ error: "Room not found" })
            }
        } catch (err) {
            return res.status(404).json({ error: "Room not found" })
        }

        res.status(200).json(room)
    } catch (err) {
        console.log(err)
        res.status(500).json({ error: "Internal server error" })
    }
}

const joinRoom = async (req, res) => {
    try {
        let currentRoomId = null
        const { userId } = req

    } catch (err) {
        console.log(err)
        return res.status(500).json({ error: "Internal server error" })
    }
}

const rejectRoomInvite = async (req, res) => {
    try {
        const userSendingId = req.userId
        const roomReceivingId = req.body.to

        const session = await mongoose.startSession()
        session.startTransaction()


    } catch (err) {
        console.log(err)
        res.status(500).json({ error: "Internal server error" })
    }
}

module.exports = {
    joinRoom,
    getRoom,
    getTrendingRooms,
    getRecentRooms,
    getTopRooms
}