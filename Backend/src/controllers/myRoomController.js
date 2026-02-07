const mongoose = require("mongoose")
const User = require("../models/users")
const Conversation = require("../models/Conversations")
const uploadMedia = require("../utils/uploadMedia")
const Room = require("../models/rooms")
const Notification = require("../models/notifications")
const  { io, userSocketMap } = require ('../socket/socket')
const Video = require("../models/videos")

const createMyRoom = async (req, res) => {
    const session = await mongoose.startSession()
    session.startTransaction()
    
    try {
        const { userId } = req

        const user = await User.findById(userId).session(session)
        if (!user) {
            session.abortTransaction()
            session.endSession()
            return res.status(404).json({ error: "User not found" })
        }

        if (!req.body.roomName) {
            session.abortTransaction()
            session.endSession()
            return res.status(400).json({ error: "Room name is required" })
        }

        let coverPhoto = ''
        if (req.file) {
            try {
                coverPhoto = await uploadMedia(req.file, 'image')
            } catch (err) {
                console.log(err)
                return res.status(400).json({ error: "Error uploading image" })
            }
            
        }

        let invitedUsers
        if (req.body.invitedUsers) {
            invitedUsers = JSON.parse(req.body.invitedUsers)
        }

        const conversation = new Conversation()
        await conversation.save({ session })
        const conversationId = conversation._id

        const roomDetails = {
            name: req.body.roomName,
            owner: userId,
            coverPhoto,
            conversation: conversationId,
            // participants: {
            //     userId,
            //     role: 'owner'
            // },
            privacy: req.body.privacy,
            theme: req.body.roomTheme,
            invitedUsers,
        }

        const newRoom = new Room(roomDetails)
        if (!newRoom) {
            await session.abortTransaction()
            session.endSession()
            return res.status(400).json({ error: "Unable to create room" })
        }
        await newRoom.save({ session })
        
        user.rooms.push(newRoom._id)
        await user.save({ session })

        if (invitedUsers) {
            for (const invitedUserId of invitedUsers) {
                const invitedUser = await User.findById(invitedUserId).session(session)
    
                invitedUser.receivedRoomInvites.push({
                    user: userId,
                    room: newRoom._id
                })
                
                const notification = new Notification({
                    text: `${user.username} has invited you to join their room '${newRoom.name}'`,
                    type: 'room-invite',
                    from: userId,
                    to: invitedUserId,
                    link: `/room/${newRoom._id}`,
                })
                await notification.save({ session })

                invitedUser.notifications.push(notification._id)
                await invitedUser.save({ session })

                const recevingUserSocketId = userSocketMap.get(invitedUserId)
                if (recevingUserSocketId) {
                    io.to(recevingUserSocketId).emit("roomInviteReceived", { from: user.username, id: userId})
                    // io.to(recevingUserSocketId).emit("newNotificationReceived", {from: user})
                }
                
                const creatorSocketId = userSocketMap.get(userId)
                if (creatorSocketId) {
                    io.to(creatorSocketId).emit("roomCreated", { room: newRoom })
                    // Join the room
                    io.sockets.sockets.get(creatorSocketId)?.join(newRoom._id.toString())
                }
            } 
        }      

        await session.commitTransaction()
        session.endSession()

        return res.status(201).json({ success: "Room Successfully Created", room: newRoom })
    } catch (err) {
        console.log(err)
        await session.abortTransaction()
        session.endSession()
        return res.status(500).json({ error: "Internal Server Error" })
    }
}

const editNameAndTheme = async (req, res) => {
    try {
        const { userId } = req
        const { roomId } = req.params

        let room
        try {
            room = await Room.findById(roomId)
            if (!room) {
                return res.status(404).json({ error: "Room not found" })
            }
        } catch (err) {
            return res.status(404).json({ error: "Room not found" })
        }

        let user
        try {
            user = await User.findById(userId).select("username")
            if (!user) {
                return res.status(404).json({ error: "User not found" })
            }
        } catch (err) {
            return res.status(404).json({ error: "User not found" })
        }
        
        if (!room.admins.includes(userId) && !room.owner.includes(user._id)) {
            return res.status(409).json({ error: "You're not an admin nigga"})
        }

        room.name = req.body.name
        room.theme = req.body.theme

        const updatedRoom = await room.save()
        if (updatedRoom) {
            io.to(roomId).emit('roomUpdated', { user })
            res.status(201).json({ success: "Room Updated!" })
        }
    } catch (err) {
        console.log(err)
        res.status(500).json({ error: "Internal server error" })
    }
}

const editCoverPhoto = async (req, res) => {
    const { userId } = req
    const { roomId } = req.params

    let room
    try {
        room = await Room.findById(roomId)
        if (!room) {
            return res.status(404).json({ error: "Room not found" })
        }
    } catch (err) {
        return res.status(404).json({ error: "Room not found" })
    }

    let user
    try {
        user = await User.findById(userId).select("username")
        if (!user) {
            return res.status(404).json({ error: "User not found" })
        }
    } catch (err) {
        return res.status(404).json({ error: "User not found" })
    }
    
    if (!room.admins.includes(userId) && !room.owner.includes(user._id)) {
        return res.status(409).json({ error: "You're not an admin nigga"})
    }

    let coverPhoto = room.coverPhoto
    if (req.file) {
        try {
            coverPhoto = await uploadMedia(req.file, 'image')
        } catch (err) {
            console.log(err)
            return res.status(400).json({ error: "Error uploading image" })
        } 
    }

    room.coverPhoto = coverPhoto
    const updatedRoom = await room.save()
    if (updatedRoom) {
        io.to(roomId).emit('roomUpdated', { user })
        res.status(201).json({ success: "Room Updated!" })
    }
}

const kickParticipant = async (req, res) => {
    try {
        const { userId } = req
        const { roomId } = req.params
        const { participantId } = req.body

        let room
        try {
            room = await Room.findById(roomId)
            if (!room) {
                return res.status(404).json({ error: "Room not found" })
            }
        } catch (err) {
            return res.status(404).json({ error: "Room not found" })
        }

        let user
        try {
            user = await User.findById(userId).select("username")
            if (!user) {
                return res.status(404).json({ error: "User not found" })
            }
        } catch (err) {
            return res.status(404).json({ error: "User not found" })
        }

        let participant
        try {
            participant = room.participants.some((participant) => participant.userId.toString() === participantId.toString())
            if (!participant) {
                return res.status(404).json({ error: "User not found" })
            }
        } catch (err) {
            return res.status(404).json({ error: "User not found" })
        }
        
        if (!room.admins.includes(userId) && !room.owner.includes(user._id)) {
            return res.status(409).json({ error: "You're not an admin nigga"})
        }

        const kickedUserSocketId = userSocketMap.get(participantId)
        if (kickedUserSocketId) {
            io.to(kickedUserSocketId).emit('getLost', { user })
            return res.status(200).json({ success: "user kicked successfully" }) 
        }
    } catch (err) {
        console.log(err)
        res.status(500).json({ error: "Internal server error" })
    }
}

const changeVideo = async (req, res) => {
    try {
        const { userId } = req
        const { roomId } = req.params
        const { video: videoId } = req.body

        let room
        try {
            room = await Room.findById(roomId)
            if (!room) {
                return res.status(404).json({ error: "Room not found" })
            }
        } catch (err) {
            return res.status(404).json({ error: "Room not found" })
        }

        let user
        try {
            user = await User.findById(userId).select("username")
            if (!user) {
                return res.status(404).json({ error: "User not found" })
            }
        } catch (err) {
            return res.status(404).json({ error: "User not found" })
        }

        let video
        try {
            video = await Video.findById(videoId)
            if (!video) {
                return res.status(404).json({ error: "Video not found" })
            }
        } catch (err) {
            return res.status(404).json({ error: "Video not found" })
        }

        if (!room.admins.includes(userId) && !room.owner.includes(user._id)) {
            return res.status(409).json({ error: "You're not an admin nigga"})
        }

        room.video = videoId
        room.currentTime = 0
        room.isPlaying = false
        room.lastUpdated = Date.now()
        const updatedRoom = await room.save()

        if (updatedRoom) {
            io.to(roomId).emit('videoChanged', { user })
            res.status(201).json({ success: "video changed!" })
        }
    } catch (err) {
        console.log(err)
        return res.status(500).json({ error: 'Internal server error'})
    }
}

const inviteUser = async (req, res) => {
    const session = await mongoose.startSession()
    session.startTransaction()

    try {
        const { userId } = req
        const { roomId } = req.params
        const { invitedUserId } = req.body 

        let room
        try {
            room = await Room.findById(roomId).session(session)
            if (!room) {
                const error = new Error("Room not found")
                error.status = 404
                throw error
            }
        } catch (err) {
            await session.abortTransaction()
            session.endSession()
            return res.status(err.status || 500).json({ error: err.message })
        }

        let user
        try {
            user = await User.findById(userId).select("username").session(session)
            if (!user) {
                const error = new Error("User not found")
                error.status = 404
                throw error
            }
        } catch (err) {
            await session.abortTransaction()
            session.endSession()
            return res.status(err.status || 500).json({ error: err.message })
        }

        let invitedUser
        try {
            invitedUser = await User.findById(invitedUserId).session(session)
            if (!invitedUser) {
                const error = new Error("Invited user not found")
                error.status = 404
                throw error
            }
        } catch (err) {
            await session.abortTransaction()
            session.endSession()
            return res.status(err.status || 500).json({ error: err.message })
        }

        if (!room.invitedUsers.includes(invitedUserId)) {
            room.invitedUsers.push(invitedUserId)
        }

        invitedUser.receivedRoomInvites.push({
            user: userId,
            room: roomId
        })
        
        const notification = new Notification({
            text: room.owner.includes(userId) ? `${user.username} has invited you to join their room '${room.name}'` : `${user.username} has invited you to the room '${room.name}'`,
            type: 'room-invite',
            from: userId,
            to: invitedUserId,
            link: `/room/${room._id}`,
        })
        await notification.save({ session })

        invitedUser.notifications.push(notification._id)
        await invitedUser.save({ session })
        await room.save({ session })

        const recevingUserSocketId = userSocketMap.get(invitedUserId)
        if (recevingUserSocketId) {
            io.to(recevingUserSocketId).emit("roomInviteReceived", { from: user.username, id: userId})
        } 
        
        io.to(roomId).emit("userInvited", {user})

        await session.commitTransaction()
        session.endSession()
        res.status(201).json({ success: "Invite sent!" })

    } catch (err) {
        await session.abortTransaction()
        session.endSession()
        console.log(err)
        res.status(500).json({ error: "Internal server error" })
    }
} 

const promoteToAdmin = async (req, res) => {
    try {
        const { userId } = req
        const { roomId } = req.params
        const { participantId } = req.body

        let room
        try {
            room = await Room.findById(roomId)
            if (!room) {
                return res.status(404).json({ error: "Room not found" })
            }
        } catch (err) {
            return res.status(404).json({ error: "Room not found" })
        }

        let user
        try {
            user = await User.findById(userId).select("username")
            if (!user) {
                return res.status(404).json({ error: "User not found" })
            }
        } catch (err) {
            return res.status(404).json({ error: "User not found" })
        }

        let participantExists
        try {
            participantExists = room.participants.some((participant) => participant.userId.toString() === participantId.toString())
            if (!participantExists) {
                return res.status(404).json({ error: "Participant not found in room" })
            }
        } catch (err) {
            return res.status(404).json({ error: "User not found" })
        }

        let participant
        try {
            participant = await User.findById(participantId).select("username")
            if (!participant) {
                return res.status(404).json({ error: "User not found" })
            }
        } catch (err) {
            return res.status(404).json({ error: "Participant not found" })
        }
        
        if (!room.admins.includes(userId) && !room.owner.includes(user._id)) {
            return res.status(409).json({ error: "You're not an admin nigga"})
        }

        room.admins.push(participantId)
        const newRoom = await room.save()

        if (newRoom) {
            io.to(roomId).emit('promotedAdmin', { 
                user: { username: user.username, _id: userId }, 
                participant: { username: participant.username, _id: participant._id } 
            })
            return res.status(200).json({ success: `${participant.username} has been promoted`})
        }
    } catch (err) {
        console.log(err)
        res.status(500).json({ error: "Internal server error" })
    }
}

const demoteMyAdmin = async (req, res) => {
    try {
        const { userId } = req
        const { roomId } = req.params
        const { participantId } = req.body

        let room
        try {
            room = await Room.findById(roomId)
            if (!room) {
                return res.status(404).json({ error: "Room not found" })
            }
        } catch (err) {
            return res.status(404).json({ error: "Room not found" })
        }

        let user
        try {
            user = await User.findById(userId).select("username")
            if (!user) {
                return res.status(404).json({ error: "User not found" })
            }
        } catch (err) {
            return res.status(404).json({ error: "User not found" })
        }

        let participantExists
        try {
            participantExists = room.participants.some((participant) => participant.userId.toString() === participantId.toString())
            if (!participantExists) {
                return res.status(404).json({ error: "Participant not found in room" })
            }
        } catch (err) {
            return res.status(404).json({ error: "User not found" })
        }

        let participant
        try {
            participant = await User.findById(participantId).select("username")
            if (!participant) {
                return res.status(404).json({ error: "User not found" })
            }
        } catch (err) {
            return res.status(404).json({ error: "Participant not found" })
        }
        
        if (!room.admins.includes(userId) && !room.owner.includes(user._id)) {
            return res.status(409).json({ error: "You're not an admin nigga"})
        }

        room.admins = room.admins.filter(adminId => adminId.toString() !== participantId.toString())
        const newRoom = await room.save()

        if (newRoom) {
            io.to(roomId).emit('demotedAdmin', { 
                user: { username: user.username, _id: userId }, 
                participant: { username: participant.username, _id: participant._id } 
            })
            return res.status(200).json({ success: `${participant.username} has been demoted`})
        }
    } catch (err) {
        console.log(err)
        res.status(500).json({ error: "Internal server error" })
    }
}

const saveRoom = async (req, res) => {
    try {
        const { userId } = req
        const { roomId } = req.params

        let room
        try {
            room = await Room.findById(roomId)
            if (!room) {
                return res.status(404).json({ error: "Room not found" })
            }
        } catch (err) {
            return res.status(404).json({ error: "Room not found" })
        }

        let user
        try {
            user = await User.findById(userId)
            if (!user) {
                return res.status(404).json({ error: "User not found" })
            }
        } catch (err) {
            return res.status(404).json({ error: "User not found" })
        }

        if (user.savedRooms.includes(roomId)) {
            user.savedRooms = user.savedRooms.filter(savedRoomId => savedRoomId.toString() !== roomId.toString())
            await user.save()
            return res.status(200).json({ success: "Room unsaved!" })
        }

        user.savedRooms.push(roomId)
        await user.save()
        return res.status(200).json({ success: "Room saved!" })
    } catch (err) {
        console.log(err)
        res.status(500).json({ error: "Internal server error" })
    }
}

const likeRoom = async (req, res) => {
    try {
        const { userId } = req
        const { roomId } = req.params

        let room
        try {
            room = await Room.findById(roomId)
            if (!room) {
                return res.status(404).json({ error: "Room not found" })
            }
        } catch (err) {
            return res.status(404).json({ error: "Room not found" })
        }

        let user
        try {
            user = await User.findById(userId)
            if (!user) {
                return res.status(404).json({ error: "User not found" })
            }
        } catch (err) {
            return res.status(404).json({ error: "User not found" })
        }

        if (user.favoriteRooms.includes(roomId)) {
            user.favoriteRooms = user.favoriteRooms.filter(favoriteRoomsId => favoriteRoomsId.toString() !== roomId.toString())
            await user.save()
            return res.status(200).json({ success: "Room unliked!" })
        }

        user.favoriteRooms.push(roomId)
        await user.save()
        return res.status(200).json({ success: "Room liked!" })
    } catch (err) {
        console.log(err)
        res.status(500).json({ error: "Internal server error" })
    }
}

const rejectInvite = async (req, res) => {
    try {
        const { userId } = req
        const { roomId } = req.params

        const session = await mongoose.startSession()
        session.startTransaction()

        let room
        try {
            room = await Room.findById(roomId).session(session)
            if (!room) {
                await session.abortTransaction()
                session.endSession()
                return res.status(404).json({ error: "Room not found" })
            }
        } catch (err) {
            await session.abortTransaction()
            session.endSession()
            return res.status(404).json({ error: "Room not found" })
        }

        let user
        try {
            user = await User.findById(userId).session(session)
            if (!user) {
                await session.abortTransaction()
                session.endSession()
                return res.status(404).json({ error: "User not found" })
            }
        } catch (err) {
            await session.abortTransaction()
            session.endSession()
            return res.status(404).json({ error: "User not found" })
        }

        await Room.findByIdAndUpdate(roomId, {
            $pull: {
                invitedUsers: userId,
            }
        }).session(session)

        await User.findByIdAndUpdate(userId, {
            $pull: {
                receivedRoomInvites: { room: roomId },
                notifications: {
                    $in: await Notification.find({
                        to: userId,
                        type: "room-invite",
                        link: `/room/${roomId}`
                    }).select('_id').session(session)
                }
            }
        }).session(session)

        await Notification.deleteMany({
            to: userId,
            type: "room-invite",
            link: `/room/${roomId}`
        }).session(session)

        await session.commitTransaction()
        session.endSession()

        io.to(roomId).emit('inviteRejected')
        return res.status(201).json({ success: "Room Invite Rejected!" })

    } catch (err) {
        await session.abortTransaction()
        session.endSession()
        console.log(err)
        res.status(500).json({ error: "Internal server error" })
    }
}

module.exports =  {
    createMyRoom,
    editNameAndTheme,
    editCoverPhoto,
    kickParticipant,
    changeVideo,
    inviteUser,
    promoteToAdmin,
    demoteMyAdmin,
    saveRoom,
    likeRoom,
    rejectInvite
}