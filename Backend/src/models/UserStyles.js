const mongoose = require('mongoose')

const hairstyleSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true
    },
    pUrl: {
        type: String,
        required: true,
    },
    pref: {
        type: [ String ],
        enum: ["male", "female"],
        required: true,
        validate: {
            validator: function (v) {
                return Array.isArray(v) && v.length > 0 && v.length <= 2 && new Set(v).size === v.length;
            },
            message: "Pref must contain one or both of 'male' or 'female' with no duplicates",
        },
    },
    regions: {
        type: [ String ],
        enum: ["fire", "earth", "water", "air"],
        required: true
    }, 
    zones: {
        type: [ String ],
        enum: ["blue", "white", "green", "yellow", "grey"],
        required: true
    },
    colour: String,
    male: {
        type: {
            t: {type: String, required: true},
            l: {type: String, required: true},
            h: {type: String, required: true},
            w: {type: String, required: true}
        },
        default: null
    },
    female: {
        type: {
            t: {type: String, required: true},
            l: {type: String, required: true},
            h: {type: String, required: true},
            w: {type: String, required: true}
        },
        default: null
    }
})

const clothPartSchema = new mongoose.Schema({
    p: {type: String, required: true},
    s: {type: String, required: true}
}, { _id: false })

const clothSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true
    },
    regions: {
        type: [ String ],
        enum: ["fire", "earth", "water", "air"],
        required: true
    }, 
    zones: {
        type: [ String ],
        enum: ["blue", "white", "green", "yellow", "grey"],
        required: true
    },
    clothType: {
        type: String,
        enum: ["top", "bottom"]
    },
    colours: [ String ],
    lh: {
        type: clothPartSchema,
        default: null
    },
    rh: {
        type: clothPartSchema,
        default: null
    },
    torso: {
        type: clothPartSchema,
        default: null
    },
    ll: {
        type: clothPartSchema,
        default: null
    },
    rl: {
        type: clothPartSchema,
        default: null
    },
})

const clothingMaterialSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true
    },
    bodyPart: {
        type: String,
        enum: ["limb", "torso"],
        required: true
    },
    pUrl: {
        type: String,
        required: true
    },
    colour: String
})

const userStyleSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    gender: {
        type: String,
        enum: ["male", "female"]
    },
    width: {
        type: Number,
        required: true
    },
    height: {
        type: Number,
        required: true
    },
    musc: {
        type: Number,
        required: true
    },
    curve: {
        type: Number,
        default: null
    },
    skin: {
        type: String,
        required: true
    },
    clothes: {
        top: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Clothes',
            default: null
        },
        bottom: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Clothes',
            default: null
        },
    },
    hair: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Hairstyle',
        default: null
    },
    stats: {
        health: {
            type: Number,
            default: 100
        },
        immunity: {
            type: Number,
            default: 50
        },
        energy: {
            type: Number,
            default: 100
        },
        endurance: {
            type: Number,
            default: 50
        },
        strength: {
            type: Number,
            default: 50
        },
        smarts: {
            type: Number,
            default: 50
        },
        speed: {
            type: Number,
            default: 190
        },
        damage: {
            type: Number,
            default: 5
        },
        lgn: {
            type: Number,
            default: null
        },
    }
})

// hairstyleSchema.index({ name: 1 }) // because name is unique creating an index here would be redundant
hairstyleSchema.index({ colour: 1 })
hairstyleSchema.index({ pref: 1 })
hairstyleSchema.index({ regions: 1 })
hairstyleSchema.index({ zones: 1 })

clothSchema.index({ colours: 1 })
clothSchema.index({ regions: 1 })
clothSchema.index({ zones: 1 })

clothingMaterialSchema.index({ bodyPart: 1 })
clothingMaterialSchema.index({ colour: 1 })

const Hairstyle = mongoose.model("Hairstyle", hairstyleSchema)
const Clothing  = mongoose.model("Clothes", clothSchema)
const ClothingMaterial  = mongoose.model("Clothing Material", clothingMaterialSchema)
const UserStyle = mongoose.model("User Style", userStyleSchema)

module.exports = { Hairstyle, Clothing, ClothingMaterial, UserStyle, userStyleSchema }