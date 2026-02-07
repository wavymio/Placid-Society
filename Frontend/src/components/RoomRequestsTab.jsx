import React from 'react'
import { FaUsersSlash } from 'react-icons/fa'

const RoomRequestsTab = ({ room, loggedInUser }) => {
    return (
        <div className='flex items-center justify-center mt-3'>
        {room.receivedRequests.length < 1 ? (
            <div className='flex flex-col items-center gap-3'>
                <div className='flex items-center justify-center h-16 w-16 xs:h-24 xs:w-24 rounded-full border border-white'>
                    <FaUsersSlash size={24} />
                </div>
                <div className='text-[13px]'>NO ROOM REQUESTS</div>
            </div>
        ) : (
            <div>req</div>
        )}
        </div>
    )
}

export default RoomRequestsTab
