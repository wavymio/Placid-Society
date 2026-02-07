const express = require('express')
const router = express.Router()
const myRoomController = require('../controllers/myRoomController')
const verifyToken = require('../middleware/verifyToken')
const upload = require('../middleware/multerParse')

router.post('/create', verifyToken, upload.single("roomCoverPhoto"), myRoomController.createMyRoom)
router.patch('/:roomId/editNamePhotoTheme', verifyToken, upload.single("coverPhoto"), myRoomController.editNameAndTheme)
router.patch('/:roomId/edit/profile-picture', verifyToken, upload.single("coverPhoto"), myRoomController.editCoverPhoto)
router.patch('/:roomId/kick-participant', verifyToken, myRoomController.kickParticipant)
router.patch('/:roomId/change-video', verifyToken, myRoomController.changeVideo)
router.post('/:roomId/invite-user', verifyToken, myRoomController.inviteUser)
router.patch('/:roomId/promote-to-admin', verifyToken, myRoomController.promoteToAdmin)
router.patch('/:roomId/demote-my-admin', verifyToken, myRoomController.demoteMyAdmin)
router.patch('/:roomId/reject-invite', verifyToken, myRoomController.rejectInvite)
router.patch('/:roomId/save', verifyToken, myRoomController.saveRoom)
router.patch('/:roomId/like', verifyToken, myRoomController.likeRoom)

// you moron.. you should've passed a middleware to run the admin validation process
module.exports = router