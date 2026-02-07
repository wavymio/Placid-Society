const mongoose = require('mongoose')

const citySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true
    },
    d: {
        type: String,
        required: true
    },
    continent: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Continent',
        required: true
    }, 
    country: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Country',
        required: true
    },
    tzOff: Number,
    population: {
        type: Number,
        default: 0
    },
    temperature: {
        type: Number,
        default: 20
    },
    rating: {
        type: Number,
        default: 0.00
    },
    region: {
        type: String,
        enum: ["fire", "earth", "water", "air"],
        required: true
    },
    zone: {
        type: String,
        enum: ["green", "blue", "white", "yellow", "grey"],
        required: true
    },
    skintones: [ String ],
    averageBuild: {
        type: {
            _id: false,
            male: {
                _id: false,
                height: {type: Number, required: true},
                width: {type: Number, required: true},
                musc: {type: Number, required: true},
                offset: {type: Number, required: true},
            },
            female: {
                _id: false,
                height: {type: Number, required: true},
                width: {type: Number, required: true},
                musc: {type: Number, required: true},
                curve: {type: Number, required: true},
                offset: {type: Number, required: true},
            }
        },
        default: null
    }
})

const cityEntityTrackerSchema = new mongoose.Schema({
    count: Number, 
    lastGenerated: {
        type: Date,
        default: null
    }
}, { _id: false })

const entityConfigSchema = new mongoose.Schema({
    energy: Number,
    stride: { type: Number, default: null },
    primary: { type: cityEntityTrackerSchema, default: null },
    secondary: { type: cityEntityTrackerSchema, default: null },
    lastHitAt: { type: Date, default: null },
    deadAt: { type: Date, default: null },
    dna: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null }
}, { _id: false })

const cityConfigEntitySchema = new mongoose.Schema({
    name: { type: String, required: true },
    quantity: { type: Number, required: true },
    layers: { type: [Number], required: true },
    entityConfig: { type: entityConfigSchema, default: {} }
}, { _id: false })

const cityConfigAirAnimalSchema = new mongoose.Schema({
    name: { type: String, required: true },
    env: { type: String, enum: ['land', 'water'], required: true },
    quantity: { type: Number, required: true },
    layers: { type: [Number], required: true },
    entityConfig: { type: entityConfigSchema, default: {} }
}, { _id: false })

const cityConfigNaturalResourceSchema = new mongoose.Schema({
    name: { type: String, required: true },
    quantity: { type: Number, required: true },
    layers: { type: [Number], required: true },
    blessedPlots: { type: [Number], required: true }
}, { _id: false })

const earthlyEntitySchema = new mongoose.Schema({
    t: String,
    grp: String,
    s: String,
    q: Number
}, { _id: false })

const cityConfigSchema = new mongoose.Schema({
    cityId: { type: mongoose.Schema.Types.ObjectId, ref: 'City', required: true, unique: true },
    totalPlots: Number,
    landPlots: Number,
    waterPlots: Number,
    naturalResourcePlots: Number,
    landPlotLayers: Number,
    waterPlotLayers: Number,

    maxPerPlot: {
        landPlants: Number,
        waterPlants: Number,
        landAnimals: Number,
        aquaticAnimals: Number,
        airAnimalsLand: Number,
        airAnimalsWater: Number,
        naturalResourcesLand: Number,
        naturalResourcesWater: Number
    },

    maxPerLayer: {
        landPlants: Number,
        waterPlants: Number,
        landAnimals: Number,
        aquaticAnimals: Number,
        airAnimalsLand: Number,
        airAnimalsWater: Number,
        naturalResources: Number
    },

    waterPlotIds: [Number],

    plants: {
        land: [cityConfigEntitySchema],
        water: [cityConfigEntitySchema]
    },

    animals: {
        land: [cityConfigEntitySchema],
        aquatic: [cityConfigEntitySchema],
        air: [cityConfigAirAnimalSchema]
    },

    naturalResourceWater: [cityConfigNaturalResourceSchema],
    naturalResourceLand: [cityConfigNaturalResourceSchema],

    landEarthlies: {
        land: [ earthlyEntitySchema ],
        road: [ earthlyEntitySchema ]
    },
    waterEarthlies: {
        water: [ earthlyEntitySchema ]
    },

    modifiedPlots: [ Number ]
})

const cityUsersSchema = new mongoose.Schema({
    cityId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'City',
        required: true,
        index: true
    },
    userStyleId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User Style',
        required: true,
        unique: true
    },
    plotId: {
        type: Number,
        required: true,
    },
    view: [{
        type: Number,
        required: true,
    }],
    layerIdx: { type: Number, required: true},
    x: { type: Number, required: true},
    y: { type: Number, required: true},
    on: String,
    wallPlotId: {
        type: Number,
        default: null
    },
    wallLoc: {
        type: String,
        default: null
    },
    facing: {
        type: String,
        enum: ['t', 'b', 'l', 'r'],
        default: "l"
    },
    held: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'City Users',
        default: null
    },
    // holding: {
    //     type: mongoose.Schema.Types.ObjectId,
    //     refPath: 'holdingModel',   // dynamic reference!
    //     default: null
    // },
    // holdingModel: {
    //     type: String,
    //     enum: ['City Users'],  // list of possible models
    //     default: null
    // }
    holding: {
        type: mongoose.Schema.Types.Mixed,
        default: null,
    },
    riding: {
        type: mongoose.Schema.Types.Mixed,
        default: null
    },

})


const cityRolesSchema = new mongoose.Schema({
    cityId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'City',
        required: true,
        unique: true
    },
    king: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    queen: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    buildingSupervisors: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
})

const cityAnimalsSchema = new mongoose.Schema({
    cityId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "City",
        required: true
    }, 
    animals: [{
        animal: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Animal'
        },
        quantity: Number
    }],
    animalToMeatRatio: Number,
    animalToMilkRatio: Number
})

const cityPlantsSchema = new mongoose.Schema({
    cityId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "City",
        required: true
    }, 
    plants: [{
        plant: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Plant'
        },
        quantity: Number
    }],
    plantToSeedRatio: Number,
    plantToFruitRatio: Number,
    plantToLeafRatio: Number,
    plantToMineralRatio: Number
})

citySchema.index({ continent: 1, country: 1, name: 1 })
cityUsersSchema.index({ cityId: 1, plotId: 1, layerIdx: 1, userStyleId: 1, view: 1 })

const City = mongoose.models.City || mongoose.model('City', citySchema)
const CityConfig = mongoose.models['City Config'] || mongoose.model('City Config', cityConfigSchema)
const CityUser = mongoose.models['City Users'] || mongoose.model('City Users', cityUsersSchema)
const CityRoles = mongoose.models['City Roles'] || mongoose.model('City Roles', cityRolesSchema)
const CityPlants = mongoose.models['City Plants'] || mongoose.model('City Plants', cityPlantsSchema)
const CityAnimals = mongoose.models['City Animals'] || mongoose.model('City Animals', cityAnimalsSchema)
module.exports = { City, CityConfig, CityUser, CityRoles, CityPlants, CityAnimals }