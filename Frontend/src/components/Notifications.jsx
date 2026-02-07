import React, { useState } from 'react'
import SystemNotifications from './SystemNotifications'
import { useAuth } from '../contexts/AuthContext'
import { format, isToday, isYesterday, parseISO } from 'date-fns'
import FriendRequestNotification from './FriendRequestNotification'
import RoomRequestAndInviteNotification from './RoomRequestAndInviteNotification'

const Notifications = ({ notifDrop }) => {
    const { loggedInUser } = useAuth()
    const [tab, setTab] = useState("regular")

    const changeTabs = (tabName) => {
        setTab(tabName)
    }

    const formatNotificationDate = (dateString) => {
        const date = parseISO(dateString);

        if (isToday(date)) {
            return format(date, "HH:mm")
        } else if (isYesterday(date)) {
            return format(date, "'Yesterday', HH:mm")
        } else {
            return format(date, "MMMM do, HH:mm")
        }
    }

    const systemNotifications = loggedInUser?.notifications.filter((notification) => notification.type === "regular")
    const friendRequestNotifications = loggedInUser?.notifications.filter((notification) => notification.type === "friend-request")
    const roomNotifications = loggedInUser?.notifications.filter((notification) => notification.type === "room-request" || notification.type === "room-invite")

    return (
        <div className={`py-5 shadow-lg z-10 w-full xs:w-[310px] sm:w-[400px] h-96 border border-neutral-800 font-semibold bg-black text-white absolute right-0 mt-2 flex flex-col items-center rounded-lg transition-opacity duration-500 ease-in-out ${notifDrop ? 'opacity-100 visible' : 'opacity-0 invisible'}`}>
            <div className='flex items-center justify-center gap-0 border-b border-neutral-800 w-3/4'>
                <div className={`w-40 cursor-pointer flex whitespace-nowrap justify-center pb-3 text-xs font-semibold transition-colors ease-in-out duration-300 ${tab === "regular" ? "border-b-2 border-white" : "text-neutral-400"}`} onClick={() => changeTabs("regular")}>
                    SYSTEM
                </div>
                <div className={`w-40 cursor-pointer flex whitespace-nowrap justify-center pb-3 text-xs font-semibold transition-colors ease-in-out duration-300 ${tab === "friend" ? "border-b-2 border-white" : "text-neutral-400"}`} onClick={() => changeTabs("friend")}>
                    FRIENDS
                </div>
                <div className={`w-40 cursor-pointer flex whitespace-nowrap justify-center pb-3 text-xs font-semibold transition-colors ease-in-out duration-300 ${tab === "room" ? "border-b-2 border-white" : "text-neutral-400"}`} onClick={() => changeTabs("room")}>
                    ROOMS
                </div>
            </div>
            <div className='flex flex-col overflow-y-auto w-3/4 mt-5 pb-3 gap-3 px-2'>
            {tab === "regular" &&
                <>
                {systemNotifications?.map((notification, index) => (
                    <SystemNotifications key={index} notifType={"system"} notification={notification} formatDate={formatNotificationDate} loggedInUser={loggedInUser} />
                ))}
                </>
            }
            {tab === "friend" &&
                <>
                {friendRequestNotifications?.map((notification, index) => (
                    <FriendRequestNotification key={index} notifType={"friend"} notification={notification} formatDate={formatNotificationDate} loggedInUser={loggedInUser} />
                ))}
                </>
            }
            {tab === "room" &&
                <>
                {roomNotifications?.map((notification, index) => (
                    <RoomRequestAndInviteNotification key={index} notifType={notification.type} notification={notification} formatDate={formatNotificationDate} loggedInUser={loggedInUser} />
                ))}
                </>
            }
            </div>
        </div>
    )
    }

export default Notifications
