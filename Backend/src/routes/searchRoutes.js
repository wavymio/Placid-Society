const express = require('express')
const searchController = require('../controllers/searchController')
const router = express.Router()
const verifyToken = require('../middleware/verifyToken')

router.post('/', searchController.searchUsernameAndRooms)
router.post('/username-for-invite', verifyToken, searchController.searchUsernameForInvite)
router.post('/videos', verifyToken, searchController.searchForVideos)

module.exports = router