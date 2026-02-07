const express = require('express')
const router = express.Router()
const myVideoController = require('../controllers/myVideoController')
const verifyToken = require('../middleware/verifyToken')
const upload = require('../middleware/multerParse')

const uploadTimeout = (req, res, next) => {
    res.setTimeout(600000, () => {
        console.log('Request has timed out.')
        res.status(408).json({error: 'Request Timeout'})
    })
    next()
}

router.get('/', verifyToken, myVideoController.getMyVideos)

router.post('/upload', verifyToken, upload.fields([
    {
        name: 'video',
        maxCount: 1
    },
    {
        name: 'coverPhoto',
        maxCount: 1
    }
]), uploadTimeout, myVideoController.uploadMyVideo)

module.exports = router