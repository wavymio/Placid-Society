const mongoose = require('mongoose')

const videoSchema = new mongoose.Schema({
    videoUrl: { 
        type: String, 
        required: true 
    },
    owner: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    }, 
    rating: { 
        type: Number, 
        default: 0 
    },
    name: { 
        type: String, 
        required: true 
    }, 
    coverPhoto: { 
        type: String,  
    },
    size: { 
        type: Number, 
        required: true 
    }, 
    downloads: { 
        type: Number, 
        default: 0 
    },
    duration: {
        type: Number,
        required: true
    },
    format: {
        type: String,
        required: true
    },
    resolution: {
        type: String,
    },
    tags: [{
        type: String,
    }],
    visibility: {
        type: String,
        enum: ['public', 'private'],
        default: 'public'
    }
}, { timestamps: true })

videoSchema.index({ owner: 1 }) 
videoSchema.index({ name: 1 }) 

const Video = mongoose.model('Video', videoSchema)
module.exports = Video
