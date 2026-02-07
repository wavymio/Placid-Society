const mongoose = require('mongoose')

const countrySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true
    },
    continent: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Continent',
        required: true
    },
    capital: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'City'
    },
    d: {
        type: String,
        required: true
    },
    rating: {
        type: Number,
        default: 0.00
    },
})

const Country = mongoose.model('Country', countrySchema)
module.exports = Country

