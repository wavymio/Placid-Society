const User = require("../models/users")
const Continent = require("../models/Continents")
const Country = require("../models/Countries")
const City = require("../models/Cities")

const getContinents = async (req, res) => {
    try {
        return res.status(200).json({ success: "Continents Retrieved" })
    } catch (err) {
        console.log(err)
        return res.status(500).json({ error: "Internal Server Error" })
    }
}

const getContinentsWithCountries = async (req, res) => {
    try {
        const continents = await Continent.find({})
        const countries = await Country.find({})

        const enrichedContinents = continents.map(continent => {
            const continentObj = continent.toObject()
            continentObj.countries = countries.filter(
                country => country.continent.toString() === continent._id.toString()
            )
            return continentObj
        })

        return res.status(200).json(enrichedContinents)
    } catch (err) {
        console.log(err)
        return res.status(500).json({ error: "Internal Server Error" })
    }
}

module.exports = { getContinents, getContinentsWithCountries }