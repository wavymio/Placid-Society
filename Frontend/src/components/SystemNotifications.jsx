import React from 'react'

const SystemNotifications = ({ notifType, notification, formatDate, loggedInUser }) => {
    const formattedDate = formatDate(notification.date)

    return (
        <>
            <div className='flex flex-col font-extrabold gap-2 bg-neutral-900 text-xs rounded-lg w-full h-auto py-4 px-3'>
                <div className='break-words text-start tracking-wide'>{notification.text}</div>
                <span className='flex items-center justify-end'>{formattedDate}</span>
            </div>
        </>
    )
}

export default SystemNotifications
