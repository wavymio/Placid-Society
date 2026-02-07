const express = require('express')
const verifyToken = require('../middleware/verifyToken')
const countryController = require('../controllers/countryController')
const router = express.Router()

router.get('/', verifyToken, countryController.getCountries)

module.exports = router