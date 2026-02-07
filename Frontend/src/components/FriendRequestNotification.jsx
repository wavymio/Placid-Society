import { useAcceptFriend, useRejectFriend } from '../api/UserApi'
import React from 'react'
import { useQueryClient } from 'react-query'
import { Link } from 'react-router-dom'

const FriendRequestNotification = ({ notifType, notification, formatDate, loggedInUser }) => {
    const queryClient = useQueryClient()
    
    const { acceptFriendRequest, isLoading: isAcceptLoading } = useAcceptFriend()
    const { rejectFriendRequest, isLoading: isRejectLoading  } = useRejectFriend()

    const formattedDate = formatDate(notification.date)
    const isRequestActive = loggedInUser.receivedFriendRequests.includes(notification.from._id)
    
    const handleFriendRequests = async (ev, requestType) => {
        ev.preventDefault()
        const details = {
            to: notification.from._id
        }
        const response = requestType === "accept" ? await acceptFriendRequest(details)
        : requestType === "reject" ? await rejectFriendRequest(details)
        : null

        if (response?.success) {
            await queryClient.invalidateQueries("getUser")
            await queryClient.invalidateQueries("validateUser")
        }
    }

    return (
        <Link to={''} className='flex flex-col gap-1 font-bold bg-neutral-900 text-xs rounded-lg w-full h-auto py-4 px-3'>
            <div className='break-words text-start tracking-wide'>You have received a {notifType} request from {notification.from.username}</div>
            {isRequestActive &&
                <div className='mt-2 mb-2 w-full flex items-center gap-2 justify-center'>
                    <button disabled={isAcceptLoading} onClick={(ev) => handleFriendRequests(ev, "accept")} className={`min-w-20 xs:min-w-20 bg-neutral-950 hover:bg-black p-3 xs:p-3 rounded-lg transition-all duration-300 ease-in-out hover:scale-105 font-bold`}>
                        {isAcceptLoading ? (
                            <span className='loader'></span>
                        ) : (
                            <span>Accept</span>
                        )}
                    </button>
                    <button disabled={isRejectLoading} onClick={(ev) => handleFriendRequests(ev, "reject")} className={`min-w-20 xs:min-w-20 bg-red-950 hover:bg-red-900 p-3 xs:p-3 rounded-lg transition-all duration-300 ease-in-out hover:scale-105 font-bold`}>
                        {isRejectLoading ? (
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

export default FriendRequestNotification
