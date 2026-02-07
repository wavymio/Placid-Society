const express = require('express')
const userController = require('../controllers/userController')
const verifyToken = require('../middleware/verifyToken')
const router = express.Router()

router.get('/:id', userController.getUser)
router.post('/add-friend', verifyToken, userController.sendFriendRequest)
router.post('/cancel-friend', verifyToken, userController.cancelFriendRequest)
router.post('/accept-friend', verifyToken, userController.acceptFriendRequest)
router.post('/reject-friend', verifyToken, userController.rejectFriendRequest)
router.post('/unfriend', verifyToken, userController.unfriendRequest)

module.exports = router