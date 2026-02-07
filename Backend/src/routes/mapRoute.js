const express = require('express')
const router = express.Router()
const mapController = require('../controllers/mapController')

router.get('/continents', mapController.getContinents)
router.get('/countries', mapController.getCountries)
router.post('/cities', mapController.getContinentCities)

module.exports = router