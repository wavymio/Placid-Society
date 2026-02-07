const mongoose = require('mongoose')

const notificationSchema = new mongoose.Schema({
    text: {
        type: String,
        required: true,
    },
    date: {
        type: Date,
        default: Date.now,
    },
    seen: {
        type: Boolean,
        default: false,
    },
    type: {
        type: String,
        enum: ['regular', 'friend-request', 'room-request', 'room-invite'],
        default: 'regular',
    },
    link: {
        type: String,
    },
    from: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    to: { 
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    priority: {
        type: String,
        enum: ['high', 'medium', 'low'],
        default: 'medium',
    },
})

notificationSchema.index({ type: 1, from: 1, to: 1 }) 

const Notification = mongoose.model('Notification', notificationSchema)
module.exports = Notification