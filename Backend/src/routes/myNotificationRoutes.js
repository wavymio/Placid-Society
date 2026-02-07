const express = require('express')
const notificationController = require('../controllers/myNotificationsController')
const verifyToken = require('../middleware/verifyToken')
const router = express.Router()

router.patch('/', verifyToken, notificationController.patchEditNotifications)

module.exports = router