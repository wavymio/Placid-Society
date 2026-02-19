const { Server } = require('socket.io')
const http = require('http')
const express = require('express')
const socketAuth = require('../middleware/socketAuth')
const Room = require('../models/rooms')
const User = require('../models/users')
const { CityUser } = require('../models/Cities')
const Notification = require('../models/notifications')
const mongoose = require('mongoose')
const Message = require('../models/Messages')

const app = express()

const server = http.createServer(app)
const allowedOrigins = [process.env.FRONTEND_URL, 'http://localhost:80', 'http://localhost:5173']
const io = new Server(server, {
    path: '/socket',
    cors: {
        origin: allowedOrigins,
        methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
        credentials: true
    }
})

// SocketIo Middleware
io.use(socketAuth)

const userSocketMap = new Map()
const latestPositions = new Map()

setInterval(async () => {
    if (latestPositions.size === 0) return

    // bulk write to DB
    try {
        const updates = [...latestPositions.values()]
        latestPositions.clear()

        await CityUser.bulkWrite(updates.map(u => {
            const { _id, ...rest } = u
            console.log("updating user position ", _id)
            return {
                updateOne: {
                    filter: { _id },
                    update: { $set: { ...rest } }
                }
            }
        }))

        console.log("Flushed user positions to DB")
    } catch (err) {
        console.log(err, "something bad happened")
    }
}, 5000)

const disconnect = async (socket, testCurrentRoomId) => {
    console.log(`Client disconnected ${socket.id}`)
    const userId = socket.userId
    
    if (userId) {
        userSocketMap.delete(userId)
        const user = await User.findById(userId)

        if (testCurrentRoomId && user) {
            await Room.updateOne(
                { _id: testCurrentRoomId },
                { $pull: { participants: { userId } } }
            )
            await User.findByIdAndUpdate(userId, {
                $set: {
                    currentRoom: null
                }
            })
            io.to(testCurrentRoomId).emit('userLeft', { user })
            testCurrentRoomId = null
            console.log(`User ${userId} disconnected from room ${testCurrentRoomId}`)
        }

        // Save immediately when user disconnects
        const last = latestPositions.get(userId)
        if (user && last) {
            const { _id, ...rest } = last
            await CityUser.updateOne(
            { _id },
            { $set: { ...rest } }
            ).catch("Failed saving on disconnect")
            latestPositions.delete(userId)
        }
    } else {
        console.log("User Id not found during disconnection")
    }
    socket.removeAllListeners()
}

io.on("connection", async (socket) => { // each user has their own io.connection, 10 users = 10 io.connection instances
    console.log("we have a hit")
    // const userId = socket.handshake.query.userId // not safe
    const userId = socket.userId
    let testCurrentRoomId = null 

    if (userId) {
        userSocketMap.set(userId, socket.id)
        console.log(`User connected: ${userId} with socket ID: ${socket.id}`)
    } else {
        console.log("User Id not provided during connection")
        return
    }
    // const user = await User.findById(userId)

    socket.on("joinRoom", async ({ roomId }) => {
        console.log("hit")
        const session = await mongoose.startSession()
        session.startTransaction()

        try {
            const room = await Room.findById(roomId).session(session)
            const user = await User.findById(userId).session(session)

            if (!room) {
                await session.abortTransaction()
                session.endSession()
                socket.emit('errorNotification', { error: "Room doesn't exist" })
                return
            }

            if (!user) {
                await session.abortTransaction()
                session.endSession()
                socket.emit('errorNotification', { error: "User doesn't exist" })
                return
            }

            if (testCurrentRoomId) {
                await Room.updateOne(
                    { _id: testCurrentRoomId },
                    { $pull: { participants: { userId: userId } } }
                ).session(session)
                socket.leave(testCurrentRoomId)
                io.to(testCurrentRoomId).emit('userLeft', { user })
                console.log("aha")
            }

            socket.join(roomId)
            testCurrentRoomId = roomId

            const recentRoomIndex = user.recentRooms.findIndex(
                (room) => room.roomId.toString() === roomId.toString()
            )
    
            if (recentRoomIndex !== -1) {
                user.recentRooms[recentRoomIndex].joinedAt = Date.now()
                // user.markModified('recentRooms')
            } else {
                user.recentRooms.push({ roomId, joinTime: Date.now() })
            }

            user.currentRoom = roomId
    
            await Room.findByIdAndUpdate(roomId, {
                $addToSet: {
                    participants: {
                        userId: userId,
                    },
                },
                $pull: {
                    invitedUsers: userId,
                }
            }).session(session)

            await User.findByIdAndUpdate(userId, {
                $set: {
                    currentRoom: user.currentRoom,
                    recentRooms: user.recentRooms,
                },
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

            io.to(roomId).emit('userJoined', {user, room})
            // console.log(`User ${userId} joined room ${roomId}`)
            console.log("Join room emitted")
            return
        } catch (err) {
            console.log(err)
            await session.abortTransaction()
            session.endSession()
            socket.emit('errorNotification', { error: "An error occured while joining the room" })
            return
        }
    })

    socket.on("leaveRoom", async () => {
        if (testCurrentRoomId) {
            const session = await mongoose.startSession()
            session.startTransaction()
            try {
                const user = await User.findById(userId).session(session)
                const room = await Room.findById(testCurrentRoomId).session(session)

                if (!room || !user) {
                    await session.abortTransaction()
                    session.endSession()
                    return
                }

                await Room.updateOne(
                    { _id: testCurrentRoomId },
                    { $pull: { participants: { userId: userId } } }
                ).session(session)

                await User.findByIdAndUpdate(userId, {
                    $set: {
                        currentRoom: null
                    }
                }
                ).session(session)

                await session.commitTransaction()
                session.endSession()

                socket.leave(testCurrentRoomId)

                io.to(testCurrentRoomId).emit('userLeft', { user })
                testCurrentRoomId = null
                console.log("Leave room emitted")
                // console.log(`User ${userId} disconnected from room ${testCurrentRoomId}`)
                return
            } catch (err) {
                console.log("Error leaving room", err)
                await session.abortTransaction()
                session.endSession()
                return
            }
        }
    })

    // Chat
    socket.on("markMessageAsSeen", async ({ messageId, roomId }) => {
        if (!messageId || !roomId) {
            console.error("Invalid messageId or roomId provided");
            return
        }

        const session = await mongoose.startSession()
        session.startTransaction()

        try {
            const message = await Message.findById(messageId).session(session)
            const room = await Room.findById(roomId).session(session)
            const user = await User.findById(userId).session(session)

            if (!message || !room || !user) {
                await session.abortTransaction()
                session.endSession()
                return
            }
            
            // set is faster than array operations, so for large arrays this would be better than using push
            const seenUsersSet = new Set(message.seen)

            if (!seenUsersSet.has(userId)) {
                seenUsersSet.add(userId)
                message.seen = Array.from(seenUsersSet)
            }

            const savedMessage = await message.save({ session })
            await session.commitTransaction()
            session.endSession()

            if (savedMessage) {
                io.to(roomId).emit('messageSeen', {messageId})
            }
            return
        } catch (err) {
            console.log(err)
            await session.abortTransaction()
            session.endSession()
            return
        }

    })

    // Video
    socket.on("playVideo", async ({ roomId, currentTime }) => {
        if (!roomId) {
            console.error("Invalid roomId provided")
            return
        }

        try {
            const room = await Room.findById(roomId)
            const user = await User.findById(userId)

            if (!room || !user) {
                console.log("no room or user provided")
                return
            }

            if (!room.owner.includes(userId) && !room.admins.includes(userId)) {
                console.log("you ain't an admin nigga")
                return
            }

            room.isPlaying = true
            room.currentTime = currentTime
            room.lastUpdated = Date.now()
            await room.save()

            return io.to(roomId).emit('playingTheVideo', { user, currentTime })
        } catch (err) {
            console.log(err)
            return
        }
    })

    socket.on("pauseVideo", async ({ roomId, currentTime }) => {
        if (!roomId) {
            console.error("Invalid roomId provided")
            return
        }

        try {
            const room = await Room.findById(roomId)
            const user = await User.findById(userId)

            if (!room || !user) {
                console.log("no room or user provided")
                return
            }

            if (!room.owner.includes(userId) && !room.admins.includes(userId)) {
                console.log("you ain't an admin nigga")
                return
            }

            room.isPlaying = false
            room.currentTime = currentTime
            room.lastUpdated = Date.now()
            await room.save()

            return io.to(roomId).emit('pausingTheVideo', { user, currentTime })
        } catch (err) {
            console.log(err)
            return
        }
    })

    socket.on("seekVideo", async ({ roomId , seekTime }) => {
        if (!roomId) {
            console.error("Invalid roomId provided")
            return
        }

        try {
            const room = await Room.findById(roomId)
            const user = await User.findById(userId)

            if (!room || !user) {
                console.log("no room or user provided")
                return
            }

            if (!room.owner.includes(userId) && !room.admins.includes(userId)) {
                console.log("you ain't an admin nigga")
                return
            }

            room.currentTime = seekTime
            room.lastUpdated = Date.now()
            await room.save()

            return io.to(roomId).emit('seekingTheVideo', { user, seekTime })
        } catch (err) {
            console.log(err)
            return
        }
    })

    socket.on("syncVideo", async ({ roomId }) => {
        if (!roomId) {
            console.error("Invalid roomId provided")
            return
        }

        try {
            const room = await Room.findById(roomId)
            const user = await User.findById(userId)

            if (!room || !user) {
                console.log("no room or user provided")
                return
            }

            const currentTime = room.currentTime
            const lastUpdated = room.lastUpdated

            return io.to(roomId).emit('syncingTheVideo', { currentTime, lastUpdated })
        } catch (err) {
            console.log(err)
            return
        }
    })

    // City
    socket.on("moveMyUser", async (payload) => {
        const theCityId = 'testId'
        const { otherUsersId, emitView, modifiedStats, ...realPayload } = payload
        console.log({ realPayload })
        console.log({ modifiedStats })
        const userIdForUse = otherUsersId ?? userId
        for (const plotId of emitView) {
            const room = `cityId-${theCityId}-plotId-${plotId}`
            socket.to(room).emit("userMoved", { ...realPayload, modifiedStats })
        }
        const oldPos = latestPositions.get(userIdForUse)
        latestPositions.set(userIdForUse, {...oldPos, ...realPayload})
        // console.log({ userIdForUse })
        // console.log(latestPositions.get(userIdForUse))
    })
    
    socket.on("joinLeavePlot", async ({ joining, leaving, emitView, myUserCoords }) => {
        const theCityId = 'testId'
        const roomJoining = `cityId-${theCityId}-plotId-${joining}`
        socket.join(roomJoining)
        for (const plotId of emitView) {
            const room = `cityId-${theCityId}-plotId-${plotId}`
            socket.to(room).emit("userJoinedZone", myUserCoords)
        }
        console.log("joining ", joining, myUserCoords._id)
        if (leaving) {
            const roomLeaving = `cityId-${theCityId}-plotId-${leaving}`
            socket.leave(roomLeaving)
            console.log("leaving ", leaving, myUserCoords._id)
        }
    })
    
    socket.on("disconnect", async () => {
        await disconnect(socket, testCurrentRoomId)
        return
    })
})

module.exports = {app, server, io, userSocketMap}