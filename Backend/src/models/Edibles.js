const mongoose = require('mongoose')

const animalSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true
    },
    pictureUrl: String,
    friendliness: Number,
    meat: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Food'
    },
    milk: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Food'
    },
    head: String,
    isActive: Boolean,
    animalType: {
        type: String,
        enum: ['Mammal', 'Bird', 'Reptile', 'Sealife']
    }
})

const plantSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true
    },
    babyPictureUrl: String,
    smallPictureUrl: String,
    grownPictureUrl: String,
    deadPictureUrl: String,
    withFruitsPictureUrl: String,
    fruit: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Fruit'
    },
    leaf: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Leaf'
    },
    seed: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Seed'
    },
    naturalResources: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Natural Resource'
    }]
}, { timestamps: true })

const foodSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true
    },
    pictureUrl: String,
    health: Number,
    taste: Number,
}, { timestamps: true })

const fruitSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true
    },
    pictureUrl: String,
    health: Number,
    taste: Number,
}, { timestamps: true })

const leafSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true
    },
    pictureUrl: String,
    health: Number,
}, { timestamps: true })

const seedSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true
    },
    pictureUrl: String,
    plant: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Plant',
        required: true
    },
    preferredTemp: Number,
    seedToPlantRatio: Number // will get the temperature of the city when the user is about to plant, if abs(preferredTemp-citytem) > a specified number, kill the seed 
}, { timestamps: true })

const Seed = mongoose.model("Seed", seedSchema)
const Leaf = mongoose.model("Leaf", leafSchema)
const Fruit = mongoose.model("Fruit", fruitSchema)
const Food = mongoose.model("Food", foodSchema)
const Plant = mongoose.model("Plant", plantSchema)
const Animal = mongoose.model("Animal", animalSchema)

// module.exports = { Food, Fruit, Leaf, Seed, Animal, Plant } 