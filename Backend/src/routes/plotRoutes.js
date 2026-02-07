const express = require('express')
const verifyToken = require('../middleware/verifyToken')
const { getPlots, createPlots, handleActions } = require('../controllers/plotController')
const router = express.Router()

router.post('/retrieve', verifyToken, getPlots)
router.post('/create', verifyToken, createPlots)
router.post('/actions', verifyToken, handleActions)

module.exports = router