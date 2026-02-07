const mongoose = require('mongoose')

const continentSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true
    },
    rating: {
        type: Number,
        default: 0.00
    },
    d: {
        type: String,
        required: true
    },
    fill: {
        type: String,
        required: true
    }
})

const Continent = mongoose.model("Continent", continentSchema)

module.exports = Continent