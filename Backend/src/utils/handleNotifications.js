const Notification = require("../models/notifications")

const addNotifications = async (userReceiving, text, type, link, from) => {
    const newNotification = new Notification({
        text,
        type,
        link,
        from
    })

    await newNotification.save()
    return newNotification    
}

module.exports = addNotifications