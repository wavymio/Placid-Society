const mongoose = require("mongoose")
const Conversation = require("../models/Conversations")
const Message = require("../models/Messages")
const uploadMedia = require("../utils/uploadMedia")
const { io, userSocketMap } = require("../socket/socket")

const getConversation = async (req, res) => {
    try {
        const { conversationId } = req.params
        console.log(conversationId)

        let conversation
        try {
            conversation = await Conversation
            .findById(conversationId)
            .populate({
                path: "messages",
                populate: {
                    path: "senderId",
                    select: "username profilePicture"
                }
            })
            if (!conversation) {
                return res.status(404).json({ error: "Conversation not found" })
            }
        } catch (err) {
            return res.status(404).json({ error: "Conversation not found" })
        }

        res.status(200).json(conversation)
    } catch (err) {
        console.log(err)
        return res.status(500).json({ error: "Unable to send message" })
    }
}

const getSeenStatuses = async (req, res) => {
    try {
        const { conversationId } = req.params
        console.log(conversationId)

        let conversation
        try {
            conversation = await Conversation
            .findById(conversationId)
            .populate({
                path: "messages",
                select: "seen"
            })

            if (!conversation) {
                return res.status(404).json({ error: "Conversation not found" })
            }
            
        } catch (err) {
            return res.status(404).json({ error: "Conversation not found" })
        }

        res.status(200).json(conversation)
    } catch (err) {
        console.log(err)
        return res.status(500).json({ error: "Unable mark as seen" })
    }
}

const sendMessage = async (req, res) => {
    const session = await mongoose.startSession()
    session.startTransaction()

    try {
        const { userId } = req
        const { conversationId } = req.params
        const { room } = req.body
        const { tempMessageId } = req.body

        let conversation
        try {
            conversation = await Conversation.findById(conversationId).session(session)
            if (!conversation) {
                return res.status(404).json({ error: "Conversation not found" })
            }
        } catch (err) {
            return res.status(404).json({ error: "Conversation not found" })
        }

        let message
        let imageCaption
        const imageMessage = req.file
        const messageMode = req.body.messageMode
        if (imageMessage) {
            try {
                message = await uploadMedia(imageMessage, 'image')
                imageCaption = req.body.imageCaption
            } catch (err) {
                console.log(err)
                return res.status(400).json({ error: "Error sending image" })
            }
        } else {
            message = req.body.message
        }

        const newMessage = new Message({
            senderId: userId,
            message,
            imageCaption: imageCaption ? imageCaption : null,
            type: messageMode
        })
        
        await newMessage.save({ session })

        conversation.messages.push(newMessage._id)
        await conversation.save({ session })

        await session.commitTransaction()
        session.endSession()

        res.status(201).json({ 
            success: "message sent successfully!",
            tempMessageId
        })

        const senderSocketId = userSocketMap.get(userId)
        io.to(room._id.toString()).except(senderSocketId).emit('newMessage')
    } catch (err) {
        console.log(err)
        await session.abortTransaction()
        session.endSession()
        return res.status(500).json({ error: "Unable to send message" })
    }
}

module.exports = {
    getConversation,
    getSeenStatuses,
    sendMessage
}