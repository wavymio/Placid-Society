const express = require('express')
const verifyToken = require('../middleware/verifyToken')
const upload = require('../middleware/multerParse')
const buildingController = require('../controllers/buildingController')
const router = express.Router()

router.patch('/deny-request', verifyToken, buildingController.denyBuildingRequest)
router.post('/approve-request', verifyToken, buildingController.approveBuildingRequest)

module.exports = router