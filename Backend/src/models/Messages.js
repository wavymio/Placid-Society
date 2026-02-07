const mongoose = require('mongoose')

const messageSchema = new mongoose.Schema({
    senderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    message: {
        type: String,
        required: true
    },
    seen: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }],
    type: {
        type: String,
        enum: ['text', 'image', 'document', 'gif', 'sticker']
    },
    replyTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Message",
    },
    replies: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Message",
    }],
    imageCaption: {
        type: String
    },
    reactions: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
        type: {
            type: String
        }
    }]
}, {timestamps: true})

const Message = mongoose.model("Message", messageSchema)

module.exports = Message