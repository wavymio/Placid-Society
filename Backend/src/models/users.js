const mongoose = require('mongoose')

const userSchema = new mongoose.Schema({
    username: { 
        type: String, 
        required: true 
    },
    password: { 
        type: String, 
        required: true 
    },
    badge: { 
        type: String, 
        enum: ['Noob', 'Amateur', 'Pro', 'Legend'] 
    },
    email: { 
        type: String,
        unique: true,
        default: null 
    },
    name: { 
        type: String 
    },
    gender: { 
        type: String, 
        enum: ['male', 'female', 'non-binary', 'other'] 
    },
    country: { 
        type: String 
    },
    age: { 
        type: Number 
    },
    accountCreatedAt: { 
        type: Date, 
        default: Date.now 
    },
    profilePicture: { 
        type: String 
    },
    verified: { 
        type: Boolean, 
        default: false 
    },
    friends: [{ 
        userId: { 
            type: mongoose.Schema.Types.ObjectId, 
            ref: 'User' 
        },
        dateAdded: { 
            type: Date, 
            default: Date.now 
        }
    }],
    rooms: [{ 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Room' 
    }],
    savedRooms: [{ 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Room',
        default: [] 
    }],
    favoriteRooms: [{ 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Room',
        default: [] 
    }],
    currentRoom: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Room',
        default: null
    },
    recentRooms: [{
        roomId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Room'
        },
        joinedAt: {
            type: Date,
            default: Date.now
        }
    }],
    notifications: [{ 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Notification' 
    }],
    sentFriendRequests: [{ 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User' 
    }],
    receivedFriendRequests: [{ 
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    receivedRoomInvites: [{ 
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        room: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Room'
        }
    }],
    savedVideos: [{ 
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Video'
    }],
    downloads: [{ 
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Video'
    }],
    token: {
        type: String,
        default: null
    },
    tokenExpiryDate: {
        type: Date,
        default: null
    }, 
    pendingEmail: {
        type: String,
        default: null
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    location: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'City'
    },
    origin: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'City'
    },
    fingerprints: [ String ],
})


userSchema.index({ username: 1 })
userSchema.index({ sentFriendRequests: 1 }) 
userSchema.index({ receivedFriendRequests: 1 }) 
userSchema.index({ 'receivedRoomInvites.user': 1, 'receivedRoomInvites.room': 1 }) 
userSchema.index({ friends: 1 }) 
userSchema.index({ rooms: 1 }) 
userSchema.index({ savedRooms: 1 }) 
userSchema.index({ favoriteRooms: 1 })
userSchema.index({ fingerprints: 1 })

const User = mongoose.model("User", userSchema)
module.exports = User
