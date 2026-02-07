const Notification = require("../models/notifications")

const patchEditNotifications = async (req, res) => {
    try {
        const { userId } = req
        await Notification.updateMany({to: userId, seen: false}, {seen: true})

        res.status(200).json({ success: "Notification marked as seen" })
    } catch (err) {
        console.log(err)
        return res.status(500).json({ error: "Internal server error" })
    }
}

module.exports = {
    patchEditNotifications
}