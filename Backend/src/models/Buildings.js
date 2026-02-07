const mongoose = require('mongoose')

const buildingRequestSchema = new mongoose.Schema({
    name: String,
    buildingType: {
        type: String,
        required: true
    },
    pictureUrl: String,
    maxRooms: Number,
    maxOccupants: Number,
    price: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ["pending", "approved", "denied"],
        required: true
    },
    architect: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    supervisor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    location: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'City',
        required: true
    },
    comments: String
}, {timestamps: true})

const preBoughtBuildingSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true
    },
    buildingType: {
        type: String,
        required: true
    },
    pictureUrl: String,
    tags: [String],
    maxRooms: Number,
    maxOccupants: Number,
    price: {
        type: String,
        required: true
    },
    architect: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    supervisor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }, 
    location: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'City',
        required: true
    }
}, {timestamps: true})


const boughtBuildingSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true
    },
    buildingType: {
        type: String,
        required: true
    },
    pictureUrl: {
        type: String,
        required: true
    },
    maxRooms: Number,
    maxOccupants: Number,
    lobby: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Room'
    },
    rooms: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Room'
    }],
    price: {
        type: String,
        required: true
    },
    locked: {
        type: Boolean,
        default: true
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    location: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'City',
        required: true
    },

}, {timestamps: true})

buildingRequestSchema.index({ architect: 1 })
buildingRequestSchema.index({ location: 1 })

const BuildingRequest = mongoose.model('Building Request', buildingRequestSchema) 
const PreBoughtBuilding = mongoose.model('Pre-Bought Building', preBoughtBuildingSchema) 
const BoughtBuilding = mongoose.model('Bought Building', boughtBuildingSchema) 

module.exports = { BuildingRequest, PreBoughtBuilding, BoughtBuilding }