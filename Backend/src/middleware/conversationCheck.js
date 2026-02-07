const Conversation = require("../models/Conversations")
const Room = require("../models/rooms")
const User = require("../models/users")

const validateConversation = async (req, res, next) => {
    const { userId } = req
    const { conversationId } = req.params
    const { roomId } = req.body

    let user
    try {
        user = await User.findById(userId).select("username")
        if (!user) {
            return res.status(404).json({ error: "User not found" })
        }
    } catch (err) {
        return res.status(404).json({ error: "User not found" })
    }

    let room
    try {
        room = await Room.findById(roomId)
        if (!room) {
            return res.status(404).json({ error: "Room not found" })
        }
    } catch (err) {
        return res.status(404).json({ error: "Room not found" })
    }

    if (room.conversation.toString() !== conversationId.toString()) {
        return res.status(409).json({ error: "What are you trying??" })
    }

    // req.body.conversation = conversation
    req.body.room = room
    next()
}

module.exports = validateConversation