const { default: mongoose } = require("mongoose")
const Country = require("../models/Countries")
const { City, CityRoles, CityConfig, CityUser } = require("../models/Cities")
const User = require("../models/users")
const { createError } = require("../utils/databaseHelpers")
const { UserStyle } = require("../models/UserStyles")
const { updateCount } = require("../utils/actions")
const { Plant, Animal, AirAnimal, ObjectEntity, Earthly, NaturalResource, Food } = require("../models/Entities")
const { redis } = require("../db/redisClient")

const getCurrentCity = async (req, res) => {
    try {
        const { cityId } = req.params
        if (!cityId) throw createError("No City Id", 400)
        
        const cityIdForSearch = new mongoose.Types.ObjectId(cityId)
        if (!cityIdForSearch) throw createError("Bad Id", 400)

        const city = await City.findById(cityIdForSearch)
        const cityConfig = await CityConfig.findOne({cityId: cityIdForSearch})
        if (!city) throw createError("No City Found", 404)
        if (!cityConfig) throw createError("No City Config Found", 404)

        return res.status(200).json({ success: "City successfully retrieved", city, cityConfig })
    } catch (err) {
        console.log(err)
        return res.status(err.statusCode || 500).json({ error: err.message || "Internal Server Error" })
    }
}

const getCities = async (req, res) => {
    try {
        return res.status(200).json({ error: "Cities Retrieved" })
    } catch (err) {
        console.log(err)
        return res.status(500).json({ error: "Internal Server Error" })
    }
}

const getCountryCities = async (req, res) => {
    try {
        const { countryId } = req.params
        const country = await Country.findById(countryId)
        if (!country) {
            return res.status(404).json({ error: "Country not found" })
        }

        const cities = await City.find({ country: countryId })
        if (!cities) {
            return res.status(200).json([])
        }
        return res.status(200).json(cities)
    } catch (err) {
        console.log(err)
        return res.status(500).json({ error: "Internal Server Error" })
    }
}

const getCityRoles = async (req, res) => {
    try {
        const { userId, userObjectId } = req
        
        const user = await User.findById(userId)
        if (!user) {
            throw createError("No User Found!", 404)
        }

        const cityLocation = user.location.city
        if (!cityLocation) {
            throw createError("No City Found!", 404)
        }

        const cityRoles = await CityRoles.findOne({ cityId: cityLocation })
        if (!cityRoles) {
            throw createError("No City Roles Found!", 404)
        }

        return res.status(200).json(cityRoles)
    } catch (err) {
        console.log(err)
        return res.status(err.statusCode || 500).json({ error: err.message || "Internal Server Error" })
    }
}

const getCityUsers = async (req, res) => {
    try {
        const { userId } = req
        const myStyle = await UserStyle.findOne({ userId }).select("_id").lean()
        if (!myStyle) throw createError("No user found", 404)

        const { plotIds, layerIdx, cityId } = req.body
        if (typeof layerIdx !== 'number' || !Number.isInteger(layerIdx) || !cityId || !Array.isArray(plotIds) || plotIds.length === 0) {
            throw createError("Bad Request", 400)
        }

        const cityIdForSearch = new mongoose.Types.ObjectId(cityId)

        // get the users that I can see, and the users that can see me
        const cityUsers = await CityUser.find({ cityId: cityIdForSearch, layerIdx, userStyleId: { $ne: myStyle._id },
            // $or: [ { plotId: { $in: plotIds } }, { view: myPlotId } ] // old version
            // might neew to delete view from user schema since I'm not using the old version
            plotId: { $in: plotIds }
        })
        .select('-cityId -__v')
        .populate({
            path: 'userStyleId',
            select: '-__v',
            populate: [{
                path: 'userId',
                select: 'username'
            },
            {
                path: 'clothes.top',
                select: '-__v -regions -zones -name -clothType -colours'
            },
            {
                path: 'clothes.bottom',
                select: '-__v -regions -zones -name -clothType -colours'
            },
            {
                path: 'hair',
                select: '-__v -regions -zones -colour -name -pref'
            },]
        })
        .populate({
            path: 'holding',
            select: '_id userStyleId',
            populate: {
                path: 'userStyleId',
                select: 'userId -_id',
                populate: {
                    path: 'userId',
                    select: 'username'
                } 
            },
        })
        .lean()  

        if (!cityUsers) throw createError("Error fetching city users", 400)  
        const updatedCityUsers = cityUsers.map(u => {
            const userStats = u.userStyleId.stats
            if (!userStats) throw createError("Couldn't find User Coords", 404) 
            const { count: energy, lastGenerated: lgn } = updateCount(100, Date.now(), userStats.energy, 30000, userStats.lgn)
            return { ...u, userStyleId: { ...u.userStyleId, stats: { ...userStats, energy, lgn } } }
        }) 

        return res.status(200).json({ success: "City users retrieved", cityUsers: updatedCityUsers})
    } catch (err) {
        console.log(err)
        return res.status(err.statusCode || 500).json({ error: err.message || "Internal Server Error" })
    }
}

const getCityEntities = async (req, res) => {
    try {
        let groupEntityMap = await redis.get("groupEntityMap")

        if (groupEntityMap) return res.status(200).json({ success: JSON.parse(groupEntityMap) })

        const [
            plantArray,
            animalArray,
            airAnimalArray,
            foodArray,
            objectArray,
            earthlyArray,
            naturalResourceArray
        ] = await Promise.all([
            Plant.find({}).lean(),
            Animal.find({}).lean(),
            AirAnimal.find({}).lean(),
            Food.find({}).lean(),
            ObjectEntity.find({}).lean(),
            Earthly.find({}).lean(),
            NaturalResource.find({}).lean()
        ])

        if (!plantArray.length ||
            !animalArray.length ||
            !airAnimalArray.length ||
            !foodArray.length ||
            !objectArray.length ||
            !earthlyArray.length ||
            !naturalResourceArray.length
        ) throw createError("Missing Entities", 404)

        groupEntityMap = {
            plant: transformArrToObj(plantArray),
            animal: transformArrToObj(animalArray),
            airAnimal: transformArrToObj(airAnimalArray),
            food: transformArrToObj(foodArray),
            fruit: transformArrToObj(foodArray),
            leaf: transformArrToObj(foodArray),
            object: transformArrToObj(objectArray),
            earthly: transformArrToObj(earthlyArray),
            naturalResource: transformArrToObj(naturalResourceArray)
        }

        await redis.set("groupEntityMap", JSON.stringify(groupEntityMap))

        res.status(200).json({ success: groupEntityMap })
    } catch (err) {
        console.log(err)
        res.status(err.statusCode || 500).json({ error: err.message || "Internal Server Error" })
    }
}

const transformArrToObj = (entityArray) => {
    const entityObj = {}
    for (const entity of entityArray) {
        entityObj[entity.name] = entity
    }
    return entityObj
}

module.exports = { getCities, getCountryCities, getCityRoles, getCurrentCity, getCityUsers, getCityEntities }