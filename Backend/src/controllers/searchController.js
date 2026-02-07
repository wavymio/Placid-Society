const User = require("../models/users")
const Video = require("../models/videos")
const Room = require("../models/rooms")

const searchUsernameAndRooms = async (req, res) => {
    try {
        const { searchInput } = req.body

        const pattern = new RegExp(searchInput.split('').join('.*'), 'i')
        const users = await User.find({ username: { $regex: pattern } }).select("-password").limit(6)
        
        if (users.length === 0) {
            return res.status(200).json([])
        }

        return res.status(200).json(users)

    } catch (err) {
        console.log(err)
        res.status(500).json({ error: "Internal Server Error" })
    }
}

const searchUsernameForInvite = async (req, res) => {
    try {
        const { userId } = req
        const { searchInput, roomId } = req.body

        const pattern = new RegExp(searchInput.split('').join('.*'), 'i')

        const users = await User.find({ username: { $regex: pattern } }).select("-password").limit(10)

        const me = await User.findById(userId).populate('friends.userId')

        const usersExceptMe = users.filter((user) => user._id.toString() !== userId.toString())

        let room
        let usersExceptParticipants = usersExceptMe

        // Check if roomId is provided and fetch the room
        if (roomId) {
            room = await Room.findById(roomId)

            if (room && room.participants) {
                // Exclude users who are already participants in the room
                usersExceptParticipants = usersExceptMe.filter(
                    (user) => !room.participants.some((participant) => participant.userId.toString() === user._id.toString())
                )
            }
        }

        // Separate users into friends and non-friends
        const myFriends = []
        const nonFriends = []

        usersExceptParticipants.forEach((user) => {
            const isFriend = me.friends.some((friend) => friend.userId._id.toString() === user._id.toString())
            if (isFriend) {
                myFriends.push(user)
            } else {
                nonFriends.push(user)
            }
        })

        const groupedUsers = [...myFriends, ...nonFriends]

        if (groupedUsers.length === 0) {
            return res.status(200).json([])
        }

        return res.status(200).json(groupedUsers)

    } catch (err) {
        console.log(err)
        res.status(500).json({ error: "Internal Server Error" })
    }
}

const searchForVideos = async (req, res) => {
    try {
        const { searchInput } = req.body

        const pattern = new RegExp(searchInput.split('').join('.*'), 'i')
        const videos = await Video.find({ name: { $regex: pattern } }).limit(10)
        
        if (videos.length === 0) {
            return res.status(200).json([])
        }

        return res.status(200).json(videos)
    } catch (err) {
        console.log(err)
        res.status(500).json({ error: "Internal server error" })
    }
}

module.exports = {
    searchUsernameAndRooms,
    searchUsernameForInvite,
    searchForVideos
}