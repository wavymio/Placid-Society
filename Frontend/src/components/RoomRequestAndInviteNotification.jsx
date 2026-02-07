import { useQueryClient } from 'react-query'
import { useRejectInvite } from '../api/MyRoomApi'
import { useLoading } from '../contexts/LoadingContext'
import { useSocket } from '../contexts/SocketContext'
import React, { useState } from 'react'
import { Link } from 'react-router-dom'

const RoomRequestAndInviteNotification = ({ notifType, notification, formatDate, loggedInUser }) => {
    const queryClient = useQueryClient()
    const { socket } = useSocket()
    const { isRedirectLoading, setIsRedirectLoading } = useLoading()
    const { rejectInvite, isRejectInviteLoading } = useRejectInvite()
    const [selectedNotificationId, setSelectedNotificationId] = useState(null)
    
    const formattedDate = formatDate(notification.date)
    const isInviteActive = loggedInUser.receivedRoomInvites.some((invite) => {
        return invite.user === notification.from._id && invite.room === notification.link.split('room/')[1]
    })

    const handleRoomRequests = async ( ev, requestType, notificationId ) => {
        ev.preventDefault()

        if (requestType === "join") {
            if (isRedirectLoading) return
            sessionStorage.removeItem(`userIsRejoining-${notification.link.split('room/')[1]}`)
            socket.emit("joinRoom", {
                roomId: notification.link.split('room/')[1]
            })
            setSelectedNotificationId(notificationId)
            setIsRedirectLoading(true)
        }

        if (requestType === "reject") {
            if (isRejectInviteLoading) return
            setSelectedNotificationId(notificationId)
            const data = await rejectInvite(notification.link.split('room/')[1])
            if (data.success) {
                await queryClient.invalidateQueries('validateUser')
            }
        }
    }
 
    return (
        <Link to={notifType === 'room-invite' ? notification?.link : ''} className='flex flex-col gap-1 font-bold bg-neutral-900 text-xs rounded-lg w-full h-auto py-4 px-3'>
            <div className='break-words text-start tracking-wide'>{notification?.text.charAt(0).toUpperCase() + notification?.text.slice(1)}</div>
            {isInviteActive &&
                <div className='mt-2 mb-2 w-full flex items-center gap-2 justify-center'>
                    <button disabled={isRedirectLoading} onClick={(ev) => handleRoomRequests(ev, "join", notification?._id)} className={`min-w-20 xs:min-w-20 bg-neutral-950 hover:bg-black p-3 xs:p-3 rounded-lg transition-all duration-300 ease-in-out hover:scale-105 font-bold`}>
                        {(isRedirectLoading && (selectedNotificationId === notification?._id)) ? (
                            <span className='loader'></span>
                        ) : (
                            <span>Join</span>
                        )}
                    </button>
                    <button disabled={isRejectInviteLoading} onClick={(ev) => handleRoomRequests(ev, "reject", notification._id)} className={`min-w-20 xs:min-w-20 bg-red-950 hover:bg-red-900 p-3 xs:p-3 rounded-lg transition-all duration-300 ease-in-out hover:scale-105 font-bold`}>
                        {(isRejectInviteLoading && (selectedNotificationId === notification?._id)) ? (
                            <span className='loader'></span>
                        ) : (
                            <span>Reject</span>
                        )}
                    </button>
                </div>
            }
            <span className='flex items-center justify-end'>{formattedDate}</span>
        </Link>
    )
}

export default RoomRequestAndInviteNotification
