const mongoose = require('mongoose')

const roomSchema = new mongoose.Schema({
    name: { 
        type: String,
        required: true
    },
    owner: [{ 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User' 
    }],
    video: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Video' 
    },
    conversation: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Conversation',
        required: true
    },
    participants: [{
        userId: { 
            type: mongoose.Schema.Types.ObjectId, 
            ref: 'User' 
        },
        dateJoined: { 
            type: Date, 
            default: Date.now
        } 
    }],
    admins: [{ 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User' 
    }],
    invitedUsers: [{ 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User' 
    }],
    receivedRequests: [{ 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User' 
    }],
    coverPhoto: {
        type: String,
        default: ''
    },
    theme: { 
        type: String, 
        enum: ['none', 'romance', 'sad', 'comedy', 'horror'],
        default: 'none' 
    },
    privacy: { 
        type: String, 
        enum: ['public', 'private'],
        default: 'public' 
    },
    rating: {
        type: Number,
        default: 0
    },
    isPlaying: {
        type: Boolean,
        default: false
    },
    currentTime: {
        type: Number,
        default: 0
    },
    lastUpdated: {
        type: Date,
        default: Date.now()
    },
    createdAt: {
        type: Date, 
        default: Date.now 
    }
})

roomSchema.index({ name: 1 })

const Room = mongoose.model('Room', roomSchema)
module.exports = Room