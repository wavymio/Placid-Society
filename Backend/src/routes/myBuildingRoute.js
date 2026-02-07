const express = require('express')
const verifyToken = require('../middleware/verifyToken')
const upload = require('../middleware/multerParse')
const myBuildingController = require('../controllers/myBuildingController')
const router = express.Router()

router.get('/requests', verifyToken, myBuildingController.getMyBuildingRequests)
router.post('/request', verifyToken, upload.single("pictureUrl"), myBuildingController.createBuildingRequest)

module.exports = router