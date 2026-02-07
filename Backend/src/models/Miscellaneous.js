const mongoose = require('mongoose')

const badgeSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true
    },
    pictureUrl: String,
    description: String,
    tags: [String]
}, {timestamps: true})

const naturalResourcesSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true
    },
    pictureUrl: String,
    tags: [String]
}, {timestamps: true})

// guns , building blocks
const utensilSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true
    },
    pictureUrl: String,
    damage: Number,
    strength: Number,
    lastingDuration: Number
}, {timestamps: true})

edibleSchema.pre("save", function (next) {
    if (this.category === "ingredient" && this.contents?.length) {
        return next(new Error("Ingredients should not have contents."))
    }
    next()
})

const Badge = mongoose.model('Badge', badgeSchema) 
const NaturalResource = mongoose.model('Natural Resource', naturalResourcesSchema) 
const Utensil = mongoose.model('Utensil', utensilSchema)
module.exports = { Badge, NaturalResource, Utensil }