const mongoose = require('mongoose')

const numberNull = { 
    type: Number,
    default: null
}

const stringNull = { 
    type: String,
    default: null
}

const stringArray = {
    type: [String],
    required: true,
    default: []
}

const heldPosSchema = new mongoose.Schema({
    t: numberNull,
    l: numberNull,
    r: numberNull,
    b: numberNull, 
    transform: stringNull
}, {_id: false})

const innerResourceSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    }, 
    max: {
        type: Number,
        required: true
    },
    grp: {
        type: String,
        enum: ["food", "fruit", "leaf", "plant", "animal", "object", "earthly", "resource"],
        required: true
    }
}, {_id: false})

const statsSchema = new mongoose.Schema({
  energy: Number,
  health: Number,
  lgn: Number,
  speed: Number,
  strength: Number,
  endurance: Number,
  immunity: Number,
  smarts: Number,
  damage: Number
}, { _id: false })

const styleSchema = new mongoose.Schema({
  width: Number,
  musc: Number,
  curve: Number
}, { _id: false })

const animalPurlSchema = new mongoose.Schema({
    t: { s: [Number], p: String},
    b: { s: [Number], p: String},
    x: { s: [Number], p: String}
}, {_id: false})

const ridingSchema = new mongoose.Schema({
    t: { top: Number, left: Number},
    b: { top: Number, left: Number},
    l: { top: Number, left: Number},
    r: { top: Number, left: Number},
}, {_id: false})

// STATE SCHEMAS
const plantStateSchema = new mongoose.Schema({
    purl: {
        type: String,
        required: true
    },
    endurance: Number,
    damage: Number,
    size: [Number],
    primary: {
        type: innerResourceSchema,
        default: null
    },
    secondary: {
        type: innerResourceSchema,
        default: null
    },
    resource: {
        type: innerResourceSchema,
        default: null
    },
}, {_id: false})

const foodStateSchema = new mongoose.Schema({
    purl: {
        type: String,
        required: true
    },
    endurance: Number,
    damage: Number,
    size: [Number],
    nutrient: {
        stats: statsSchema,
        style: styleSchema
    }, 
    
}, {_id: false})

const animalStateSchema = new mongoose.Schema({
    purl: {
        type: animalPurlSchema, 
        required: true
    },
    riding: {
        type: ridingSchema,
        default: null
    },
    endurance: Number,
    damage: Number,
    size: [Number],
    primary: {
        type: innerResourceSchema,
        default: null
    },
    secondary: {
        type: innerResourceSchema,
        default: null
    },
    resource: {
        type: innerResourceSchema,
        default: null
    }
}, {_id: false})

const airAnimalStateSchema = new mongoose.Schema({
    purl: { 
        type: String,
        required: true
    },
    size: {
        type: [Number],
        required: true
    },
    primary: {
        type: innerResourceSchema,
        default: null
    },
    secondary: {
        type: innerResourceSchema,
        default: null
    },
    resource: {
        type: innerResourceSchema,
        default: null
    }
}, {_id: false})

// FULL DOC SCHEMAS
const plantSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true
    },
    heldPos: {
        type: heldPosSchema,
        required: true
    },
    actions: {
        held: stringArray,
        alone: stringArray
    },
    group: {
        type: String,
        required: true
    },
    states: {
        grown: {
            type: plantStateSchema,
            required: true
        },
        mid: {
            type: plantStateSchema,
            required: true
        },
        young: {
            type: plantStateSchema,
            required: true
        }
    },
    transform: {
        type: Number,
        required: true
    },
    resourceGrowth: Number
})

const foodSchema = new mongoose.Schema({
    name: {
        type: String,
        unique: true,
        required: true
    },
    heldPos: {
        type: heldPosSchema,
        required: true
    },
    actions: {
        held: stringArray,
        alone: stringArray
    },
    group: {
        type: String,
        enum: ["leaf", "food", "fruit"],
        required: true
    },
    states: {
        good: {
            type: foodStateSchema,
            required: true
        },
        bad: {
            type: foodStateSchema,
            required: true
        }
    },
    tree: String,
    bite: {
        type: Number,
        default: null
    }
})

const animalSchema = new mongoose.Schema({
    name: {
        type: String,
        unique: true,
        required: true
    },
    heldPos: {
        type: heldPosSchema,
        required: true
    },
    actions: {
        held: stringArray,
        alone: stringArray
    },
    group: {
        type: String,
        enum: ["animal"],
        required: true
    },
    timetable: {
        type: [[mongoose.Schema.Types.Mixed]],
        required: true,
        validate: {
            validator: function (v) {
                if (!Array.isArray(v)) return false

                return v.every(entry =>
                    Array.isArray(entry) &&
                    entry.length === 2 &&
                    Number.isInteger(entry[0]) &&
                    entry[0] >= 0 &&
                    entry[0] <= 23 &&
                    typeof entry[1] === 'string'
                );
            },
            message: 'Each timetable entry must be [hour (0–23), state (string)]'
        }
    },
    states: {
        grown: {
            type: animalStateSchema,
            required: true
        },
        mid: {
            type: animalStateSchema,
            required: true
        },
        young: {
            type: animalStateSchema,
            required: true
        }
    },
    family: {
        type: String,
        required: true
    },
    animation: {
        type: String,
        required: true
    },
    night: {
        type: Boolean,
        required: true
    },
    wild: {
        type: Boolean,
        required: true
    },
    transform: {
        type: Number,
        required: true
    },
    resourceGrowth: Number 
})

const airAnimalSchema = new mongoose.Schema({
    name: {
        type: String,
        unique: true,
        required: true
    },
    heldPos: {
        type: heldPosSchema,
        required: true
    },
    actions: {
        held: stringArray,
        alone: stringArray
    },
    group: {
        type: String,
        enum: ["airAnimal"],
        required: true
    },
    timetable: {
        type: [[mongoose.Schema.Types.Mixed]],
        required: true,
        validate: {
            validator: function (v) {
                if (!Array.isArray(v)) return false

                return v.every(entry =>
                    Array.isArray(entry) &&
                    entry.length === 2 &&
                    Number.isInteger(entry[0]) &&
                    entry[0] >= 0 &&
                    entry[0] <= 23 &&
                    typeof entry[1] === 'string'
                );
            },
            message: 'Each timetable entry must be [hour (0–23), state (string)]'
        }
    },
    family: {
        type: String,
        required: true
    },
    states: {
        grown: {
            type: airAnimalStateSchema,
            required: true
        },
        mid: {
            type: airAnimalStateSchema,
            required: true
        },
        young: {
            type: airAnimalStateSchema,
            required: true
        }
    },
    speed: Number,
    night: Boolean,
    wild: Boolean,
    hunter: Boolean
})

const objectSchema = new mongoose.Schema({
    name: {
        type: String,
        unique: true,
        required: true
    },
    heldPos: {
        type: heldPosSchema,
        required: true
    },
    actions: {
        held: stringArray,
        alone: stringArray
    },
    group: {
        type: String,
        enum: ["object", "element"],
        required: true
    },
    states: {
        old: { type: plantStateSchema, required: true },
        new: { type: plantStateSchema, required: true }
    },
    transform: {
        type: Number,
        required: true
    }
})

const naturalResourceSchema = new mongoose.Schema({
    name: {
        type: String,
        unique: true,
        required: true
    },
    heldPos: {
        type: heldPosSchema,
        required: true
    },
    actions: {
        held: stringArray,
        alone: stringArray
    },
    group: {
        type: String,
        enum: ["naturalResource"],
        required: true
    },
    states: {
        large: { type: plantStateSchema, required: true },
        mid: { type: plantStateSchema, required: true },
        small: { type: plantStateSchema, required: true }
    },
    hit: {
        type: Number,
        required: true
    }
})

const earthlySchema = new mongoose.Schema({
    name: {
        type: String,
        unique: true,
        required: true
    },
    heldPos: {
        type: heldPosSchema,
        required: true
    },
    actions: {
        held: stringArray,
        alone: stringArray
    },
    group: {
        type: String,
        enum: ["earthly"],
        required: true
    },
    states: {
        mid: { type: plantStateSchema, required: true },
    }
})

const Plant = mongoose.model("Plant", plantSchema)
const Food = mongoose.model("Food", foodSchema)
const Animal = mongoose.model("Animal", animalSchema)
const AirAnimal = mongoose.model("Air Animal", airAnimalSchema)
const ObjectEntity = mongoose.model("Object Entity", objectSchema)
const NaturalResource = mongoose.model("Natural Resource", naturalResourceSchema)
const Earthly = mongoose.model("Earthly", earthlySchema)

module.exports = { Plant, Food, Animal, AirAnimal, ObjectEntity, NaturalResource, Earthly }