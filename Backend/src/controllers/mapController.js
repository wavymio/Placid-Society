const { default: mongoose } = require("mongoose")
const { City } = require("../models/Cities")
const Continent = require("../models/Continents")
const Country = require("../models/Countries")
const { createError } = require("../utils/databaseHelpers")

const getContinents = async (req, res) => {
    try {
        const continents = await Continent.find({}).lean()

        if (!continents || continents.length === 0) throw createError("No Continents Found!", 404)

        return res.status(200).json(continents)
    } catch (err) {
        console.log(err)
        res.status(err.statusCode || 500).json({ error: err.message || "Internal Server Error" })
    }
}

const getCountries = async (req, res) => {
    try {
        const countries = await Country.find({}).lean()

        if (!countries || countries.length === 0) throw createError("No Countries Found!", 404)

        return res.status(200).json(countries)
    } catch (err) {
        console.log(err)
        res.status(err.statusCode || 500).json({ error: err.message || "Internal Server Error" })
    }
}

const getContinentCities = async (req, res) => {
    try {
        const { continentIds } = req.body
        if (!continentIds || continentIds.length === 0 || !Array.isArray(continentIds)) throw createError("At least one Continent Id is required", 400)
        
        const validContinentIds = continentIds
        .filter(id => mongoose.Types.ObjectId.isValid(id))
        .map(id => new mongoose.Types.ObjectId(id))

        if (validContinentIds.length === 0) throw createError("All provided continent IDs are invalid", 400)

        const continentCities = await City.find({ continent: { $in: validContinentIds } }).lean()
        if (!continentCities) throw createError("No cities found", 404)

        return res.status(200).json({ success: "Continent cities retrieved", cities: continentCities })
    } catch (err) {
        console.log(err)
        res.status(err.statusCode || 500).json({ error: err.message || "Internal Server Error" })
    }
}

module.exports = { getContinents, getCountries, getContinentCities }