const mongoose = require('mongoose')
const Room = require('../models/rooms')
const User = require('../models/users')

const connectToMongodb = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_CONNECTION_STRING)
        console.log("Connected to database!")
        await Room.updateMany({}, { $set: { participants: [] } })
        await User.updateMany({}, { $set: { currentRoom: null } })
        console.log("All room participants cleared on database connection.")
    } catch (err) {
        console.log("Error connecting to database", err)
    }
}

module.exports = connectToMongodb