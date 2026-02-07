const express = require('express')
const verifyToken = require('../middleware/verifyToken')
const cityController = require('../controllers/cityController')
const router = express.Router()


router.get('/', verifyToken, cityController.getCities)
router.get('/roles', verifyToken, cityController.getCityRoles)
router.post('/users', verifyToken, cityController.getCityUsers)
router.get('/entities', cityController.getCityEntities)
router.get('/country/:countryId', verifyToken, cityController.getCountryCities)
router.get('/:cityId', verifyToken, cityController.getCurrentCity)

module.exports = router