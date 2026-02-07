const express = require('express')
const router = express.Router()
const conversationController = require('../controllers/conversationController')
const verifyToken = require('../middleware/verifyToken')
const upload = require('../middleware/multerParse')
const validateConversation = require('../middleware/conversationCheck')

router.get('/:conversationId', verifyToken, conversationController.getConversation)
router.get('/:conversationId/seen-statuses', verifyToken, conversationController.getSeenStatuses)
router.post('/:conversationId/send-message', verifyToken, upload.single('imageMessage'), validateConversation, conversationController.sendMessage)

module.exports = router