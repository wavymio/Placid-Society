const mongoose = require("mongoose")
const User = require("../models/users")
const  { io, userSocketMap } = require ('../socket/socket')
const Notification = require("../models/notifications")

const getUser = async (req, res) => {
    try {
        const { id } = req.params
        const user = await User.findById(id)
        .select("-password -notifications -downloads -savedVideos")
        .populate({
            path: 'friends.userId',
            select: 'username profilePicture',
        })
        .populate("currentRoom")

        if (!user) {
            return res.status(400).json({ error: "User not found" })
        }
        
        return res.status(200).json(user)
    } catch (err) {
        console.log(err)
        return res.status(500).json({ error: "Internal Server Error" })
    }
}

const sendFriendRequest = async (req, res) => {
    const session = await mongoose.startSession()
    session.startTransaction()

    try {
        const userSendingId = req.userId
        const userReceivingId = req.body.to

        const userSending = await User.findById(userSendingId).select("-password").session(session)
        const userReceiving = await User.findById(userReceivingId).select("-password").session(session)

        if (!userReceiving || !userSending) {
            await session.abortTransaction()
            session.endSession()
            return res.status(404).json({ error: "User not found" })
        }

        if (userSending.sentFriendRequests.includes(userReceivingId) || userSending.receivedFriendRequests.includes(userReceivingId) || userReceiving.receivedFriendRequests.includes(userSendingId) || userReceiving.sentFriendRequests.includes(userSendingId)) {
            await session.abortTransaction()
            session.endSession()
            return res.status(400).json({ error: "Request already sent" })
        }

        userReceiving.receivedFriendRequests.push(userSendingId)
        userSending.sentFriendRequests.push(userReceivingId)

        const newNotification = new Notification({
            text: `${userSending.username} sent you a friend request`,
            type: "friend-request",
            link: `user/${userSendingId}`,
            from: `${userSendingId}`,
            to: userReceivingId
        })
        userReceiving.notifications.push(newNotification._id)

        await newNotification.save({session})
        await userReceiving.save({ session })
        await userSending.save({ session })
        
        await session.commitTransaction()
        session.endSession()

        const recevingUserSocketId = userSocketMap.get(userReceivingId)
        if (recevingUserSocketId) {
            io.to(recevingUserSocketId).emit("friendRequestReceived", { from: userSending.username, id: userSendingId })
            io.to(recevingUserSocketId).emit("newNotificationReceived", {from: userSending})
        }

        return res.status(200).json({success: "Friend request sent!"})
    } catch (err) {
        console.log(err)
        await session.abortTransaction()
        session.endSession()
        return res.status(500).json({ error: "Internal Server Error" })
    }
}

const cancelFriendRequest = async (req, res) => {
    const session = await mongoose.startSession()
    session.startTransaction()

    try {
        const userSendingId = req.userId
        const userReceivingId = req.body.to

        const userSending = await User.findById(userSendingId).select("-password").session(session)
        const userReceiving = await User.findById(userReceivingId).select("-password").session(session)
        const notificationSent = await Notification.findOne({from: userSendingId, to: userReceivingId, type:"friend-request"}).session(session)

        if (!userReceiving || !userSending) {
            await session.abortTransaction()
            session.endSession()
            return res.status(404).json({ error: "User not found" })
        }
        
        if (!userSending.sentFriendRequests.includes(userReceivingId) || !userReceiving.receivedFriendRequests.includes(userSendingId)) {
            await session.abortTransaction()
            session.endSession()
            return res.status(400).json({ error: "No friend request found" })
        }

        userSending.sentFriendRequests = userSending.sentFriendRequests.filter((id) => id.toString() !== userReceivingId.toString())
        userReceiving.receivedFriendRequests = userReceiving.receivedFriendRequests.filter((id) => id.toString() !== userSendingId.toString())
        if (notificationSent) {
            userReceiving.notifications = userReceiving.notifications.filter((notification) => notification._id.toString() !== notificationSent._id.toString())
            await Notification.findByIdAndDelete(notificationSent._id).session(session)
        }

        await userReceiving.save({ session })
        await userSending.save({ session })
        
        await session.commitTransaction()
        session.endSession()

        const recevingUserSocketId = userSocketMap.get(userReceivingId)
        if (recevingUserSocketId) {
            io.to(recevingUserSocketId).emit("friendRequestCancelled", { from: userSending.username, id: userSendingId })
        }

        return res.status(200).json({success: "Friend Request Cancelled!"})
    } catch (err) {
        console.log(err)
        await session.abortTransaction()
        session.endSession()
        return res.status(500).json({ error: "Internal Server Error" })
    }
}

const acceptFriendRequest = async (req, res) => {
    const session = await mongoose.startSession()
    session.startTransaction()

    try {
        const userSendingId = req.userId
        const userReceivingId = req.body.to
    
        const userSending = await User.findById(userSendingId).select("-password").session(session)
        const userReceiving = await User.findById(userReceivingId).select("-password").session(session)
    
        if (!userReceiving || !userSending) {
            await session.abortTransaction()
            session.endSession()
            return res.status(404).json({ error: "User not found" })
        }
    
        if (userSending.friends.some(friend => friend.userId.toString() === userReceivingId.toString()) ||
            userReceiving.friends.some(friend => friend.userId.toString() === userSendingId.toString())) {
            await session.abortTransaction()
            session.endSession()
            return res.status(400).json({ error: "User already added" })
        }
    
        if (!userSending.receivedFriendRequests.includes(userReceivingId) || !userReceiving.sentFriendRequests.includes(userSendingId)) {
            await session.abortTransaction()
            session.endSession()
            return res.status(400).json({ error: "No friend request" })
        }

        const notificationReceived = await Notification.findOne({from: userReceivingId, to: userSendingId, type:"friend-request"}).session(session)
        
        if (notificationReceived) {
            userSending.notifications = userSending.notifications.filter((notification) => notification._id.toString() !== notificationReceived._id.toString())
            await Notification.findByIdAndDelete(notificationReceived._id).session(session)
        }

        userSending.receivedFriendRequests = userSending.receivedFriendRequests.filter(id => id.toString() !== userReceivingId.toString())
        userReceiving.sentFriendRequests = userReceiving.sentFriendRequests.filter(id => id.toString() !== userSendingId.toString())
    
        userSending.friends.push({ userId: userReceivingId })
        userReceiving.friends.push({ userId: userSendingId })

        const newReceiverNotification = new Notification({
            text: `${userSending.username} accepted your friend request`,
            type: "regular",
            link: `user/${userSendingId}`,
            from: `${userSendingId}`,
            to: userReceivingId
        })
        userReceiving.notifications.push(newReceiverNotification._id)

        const newSenderNotification = new Notification({
            text: `You are now friends with ${userReceiving.username}`,
            type: "regular",
            link: `user/${userReceivingId}`,
            from: `${userReceivingId}`,
            to: userSendingId
        })
        userSending.notifications.push(newSenderNotification._id)
  
        await newReceiverNotification.save({session})
        await newSenderNotification.save({session})
        await userSending.save({ session })
        await userReceiving.save({ session })
    
        await session.commitTransaction()
        session.endSession()
  
      const receivingUserSocketId = userSocketMap.get(userReceivingId)
      if (receivingUserSocketId) {
        io.to(receivingUserSocketId).emit("friendRequestAccepted", {
          from: userSending.username,
          id: userSendingId
        })
      }
  
      return res.status(200).json({ success: "Friend Request Accepted!" });
    } catch (err) {
      await session.abortTransaction()
      session.endSession()
      console.log(err)
      return res.status(500).json({ error: "Internal Server Error" })
    }
}
  

const rejectFriendRequest = async (req, res) => {
    const session = await mongoose.startSession()
    session.startTransaction()

    try {
        const userSendingId = req.userId
        const userReceivingId = req.body.to

        const userSending = await User.findById(userSendingId).select("-password").session(session)
        const userReceiving = await User.findById(userReceivingId).select("-password").session(session)

        if (!userReceiving || !userSending) {
            await session.abortTransaction()
            session.endSession()
            return res.status(404).json({ error: "User not found" })
        }

        if (!userSending.receivedFriendRequests.includes(userReceivingId) || !userReceiving.sentFriendRequests.includes(userSendingId)) {
            await session.abortTransaction()
            session.endSession()
            return res.status(400).json({error: "No existing request"})
        }

        userSending.receivedFriendRequests = userSending.receivedFriendRequests.filter((id) => id.toString() !== userReceivingId.toString())
        userReceiving.sentFriendRequests = userReceiving.sentFriendRequests.filter((id) => id.toString() !== userSendingId.toString())

        const notificationReceived = await Notification.findOne({from: userReceivingId, to: userSendingId, type:"friend-request"}).session(session)
        
        if (notificationReceived) {
            userSending.notifications = userSending.notifications.filter((notification) => notification._id.toString() !== notificationReceived._id.toString())
            await Notification.findByIdAndDelete(notificationReceived._id).session(session)
        }

        await userReceiving.save({ session })
        await userSending.save({ session })
        
        await session.commitTransaction()
        session.endSession()

        const recevingUserSocketId = userSocketMap.get(userReceivingId)
        if (recevingUserSocketId) {
            io.to(recevingUserSocketId).emit('friendRequestRejected', {
                from: userSending.username, id: userSendingId
            })
        }

        return res.status(200).json({success: "Heartbreaker!"})
    } catch (err) {
        console.log(err)
        await session.abortTransaction()
        session.endSession()
        return res.status(500).json({ error: "Internal Server Error" })
    }
}

const unfriendRequest = async (req, res) => {
    const session = await mongoose.startSession()
    session.startTransaction()

    try {
        const userSendingId = req.userId
        const userReceivingId = req.body.to

        const userSending = await User.findById(userSendingId).select("-password").session(session)
        const userReceiving = await User.findById(userReceivingId).select("-password").session(session)

        if (!userReceiving || !userSending) {
            await session.abortTransaction()
            session.endSession()
            return res.status(404).json({ error: "User not found" })
        }

        const isMyFriend = userSending.friends.some((friend) => friend.userId.toString() === userReceivingId.toString())
        const amTheirFriend = userReceiving.friends.some((friend) => friend.userId.toString() === userSendingId.toString())
        
        if (!isMyFriend || !amTheirFriend) {
            await session.abortTransaction()
            session.endSession()
            return res.status(400).json({ error: "What are you scheming bro?" })
        }

        userSending.friends = userSending.friends.filter((friend) => friend.userId.toString() !== userReceivingId.toString())
        userReceiving.friends = userReceiving.friends.filter((friend) => friend.userId.toString() !== userSendingId.toString())

        await userReceiving.save({ session })
        await userSending.save({ session })
        
        await session.commitTransaction()
        session.endSession()

        const recevingUserSocketId = userSocketMap.get(userReceivingId)
        if (recevingUserSocketId) {
            io.to(recevingUserSocketId).emit('unfriendRequest', {
                from: userSending.username, id: userSendingId
            })
        }

        return res.status(200).json({success: "So long sucker!"})
    } catch (err) {
        await session.abortTransaction()
        session.endSession()
        console.log(err)
        return res.status(500).json({ error: "Internal Server Error" })
    }
}



module.exports = {
    getUser,
    sendFriendRequest,
    cancelFriendRequest,
    acceptFriendRequest,
    rejectFriendRequest,
    unfriendRequest
}