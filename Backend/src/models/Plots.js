const { default: mongoose } = require("mongoose")
const { userStyleSchema } = require("./UserStyles")

const entityResourceSchema = new mongoose.Schema({
    count: {
        type: Number,
        required: true
    },
    lastGenerated: {
        type: Number,
        default: null
    }
}, { _id: false })

const earthlyEntitySchema = new mongoose.Schema({
    t: String,
    grp: String,
    s: String,
    q: Number
}, { _id: true })

const layerEntitySchema = new mongoose.Schema({
    dna: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'City Users',
        default: null
    },
    deadAt: {
        type: Number,
        default: null,
    }, 
    createdAt: {
        type: Number,
        required: true
    }, 
    energy: {
        type: Number,
        default: 100,
    },
    grp: {
        type: String,
        enum: ["plant", "animal", "airAnimal", "object", "naturalResource", "food", "leaf", "resource", "element", "earthly"],
        required: true
    },
    lastHitAt: {
        type: Number,
        default: null
    }, 
    p: {
        type: [Number],
        required: true,
        validate: {
            validator: v => v?.length === 2,
            message: 'Position array must be [x, y]'
        }
    },
    primary: { type: entityResourceSchema, default: null },
    secondary: { type: entityResourceSchema, default: null },
    t: {
        type: String,
        required: true
    },
    s: {
        type: String,
        required: true
    },
    q: Number,
    // land animal extras
    base: {
        type: [Number],
        default: undefined
    },
    dl: Number,
    f: {
        type: String,
        enum: ["b", "r", "t", "l"]
    },
    ins: String,
    insTime: Number,
    stride: Number,
    // riders: {
    //     type: [{ 
    //         type: mongoose.Schema.Types.ObjectId,
    //         ref: 'City Users',
    //         required: true
    //     }],
    //     default: null
    // },
    // air animal extras
    rn: Number
    
})

const plotLayerSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    entities: {
        type: [layerEntitySchema],
        default: []
    },
    earthlies: {
        land: {
            type: [earthlyEntitySchema],
            default: undefined
        },
        road: {
            type: [earthlyEntitySchema],
            default: undefined
        },
        water: {
            type: [earthlyEntitySchema],
            default: undefined
        }
    },
    wallStrengthMatrix: {
        type: [Number],
        validate: {
            validator: function (v) {
                if (this.name === "0" && v?.length) {
                    return false
                }
                return true
            },
            message: "wallStrengthMatrix is only allowed on non-surface layers"
        },
        default: undefined
    },
    walls: {
        type: {
            t: Boolean,
            l: Boolean,
            r: Boolean,
            b: Boolean
        },
        validate: {
            validator: function (v) {
                if (this.name === "0") {
                    if (v?.t || v?.l || v?.r || v?.b) return false
                }
                return true
            },
            message: "walls are only allowed on non-surface layers"
        }, 
    }

}, { _id: false })

const plotSchema = new mongoose.Schema({
    city: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "City",
        required: true
    },
    id: {
        type: Number,
        required: true,
        index: true,
    },
    layers: {
        type: [ plotLayerSchema ],
        required: true,
    }
})

plotSchema.index({ city: 1, id: 1 }, { unique: true })
const Plot = mongoose.models.Plot || mongoose.model('Plot', plotSchema)
module.exports = { Plot, layerEntitySchema }