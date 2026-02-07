const express = require('express')
const verifyToken = require('../middleware/verifyToken')
const continentController = require('../controllers/continentController')
const router = express.Router()

router.get('/', verifyToken, continentController.getContinents)
router.get('/alldata', continentController.getContinentsWithCountries)

module.exports = router