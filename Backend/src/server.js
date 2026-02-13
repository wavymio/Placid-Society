const express = require('express')
const cors = require('cors')
const dotenv = require('dotenv/config.js')
const cookieParser = require('cookie-parser')
const {v2: cloudinary} = require('cloudinary')
const path = require('path')
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
})
const { app, server, io, userSocketMap } = require('./socket/socket')
const Room = require('./models/rooms')

// Route Importation
const myUserRoutes = require('./routes/myUserRoutes')
const myNotificatonRoutes = require('./routes/myNotificationRoutes')
const myVideoRoutes = require('./routes/myVideoRoutes')
const myRoomRoutes = require('./routes/myRoomRoutes')
const roomRoutes = require('./routes/roomRoutes')
const searchRoutes = require('./routes/searchRoutes') 
const userRoutes = require('./routes/userRoutes')
const conversationRoutes = require('./routes/conversationRoutes')
const continentRoutes = require('./routes/continentRoute')
const countryRoutes = require('./routes/countryRoute')
const cityRoutes = require('./routes/cityRoutes')
const plotRoutes = require('./routes/plotRoutes')
const mapRoutes = require('./routes/mapRoute')
const buildingRoutes = require('./routes/buildingRoute')
const myBuildingRoutes = require('./routes/myBuildingRoute')

// Database Connection
const connectToMongodb = require('./db/conncet')
const { connectToRedis } = require('./db/redisClient')

// Middleware Setup
app.use(express.static(path.join(__dirname, '../../Frontend/dist')))
const allowedOrigins = [process.env.FRONTEND_URL, process.env.DOMAIN_NAME]
app.use(cors({
    origin: function (origin, callback) {
        if (allowedOrigins.includes(origin) || !origin) {
            callback(null, true)
        } else {
            callback(new Error('Not allowed by CORS'))
        }
    },
    credentials: true
}))
app.use(express.json({ limit: '600kb' }))
app.use(cookieParser())

// Router Setup
app.use('/api/my/user', myUserRoutes)
app.use('/api/my/notifications', myNotificatonRoutes)
app.use('/api/my/videos', myVideoRoutes)
app.use('/api/my/room', myRoomRoutes)
app.use('/api/my/buildings', myBuildingRoutes)

app.use('/api/continent', continentRoutes)
app.use('/api/country', countryRoutes)
app.use('/api/city', cityRoutes)
app.use('/api/plot', plotRoutes)
app.use('/api/map', mapRoutes)
app.use('/api/room', roomRoutes)
app.use('/api/search', searchRoutes)
app.use('/api/user', userRoutes)
app.use('/api/conversation', conversationRoutes)
app.use('/api/buildings', buildingRoutes)

app.get("/ip", (req, res) => {
    const ip = req.socket.remoteAddress
    console.log(req.socket)
    res.send(`Your IP is ${ip}`)
})

app.get('/health', async (req, res) => {
    res.status(200).json({ message: "I am healthy" })
})

app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "../../Frontend/dist/index.html"))
})

const cleanupOnShutdown = async () => {
    console.log("Server shutting down, disconnecting clients...")

    // Handle all active socket connections
    for (let [userId, socketId] of userSocketMap) {
        const userSocket = io.sockets.sockets.get(socketId)
        if (userSocket) {
            const currentRoomId = Object.keys(userSocket.rooms)[1] // Get the current room
            if (currentRoomId) {
                await Room.updateOne(
                    { _id: currentRoomId },
                    { $pull: { participants: { userId } } }
                )
                io.to(currentRoomId).emit('userLeft', { userId })
            }
        }
    }

    // Close the server
    server.close(() => {
        console.log("Server shut down gracefully.")
        process.exit(0)
    })
}

// Listen for shutdown signals
process.on('SIGINT', cleanupOnShutdown)
process.on('SIGTERM', cleanupOnShutdown)


server.listen(8080, async () => {
    try {
        await connectToMongodb()
        await connectToRedis()
    } catch (e) {
        console.log(e)
    }
    console.log("App Connected Successfully on Port 8080")
})