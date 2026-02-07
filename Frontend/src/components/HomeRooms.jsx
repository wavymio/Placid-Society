import { useLoading } from '../contexts/LoadingContext'
import React from 'react'
import { IoPerson } from 'react-icons/io5'
import { useNavigate } from 'react-router-dom'

const HomeRooms = ({ socket, rooms, isLoggedIn, setOpenLogin, setRoomId, category }) => {
    const navigate = useNavigate()
    const { isRedirectLoading, setIsRedirectLoading } = useLoading()

    const goToRoom = (roomId) => {
        // const roomLink = `/room/${roomId}`
        if (!isLoggedIn) {
            setRoomId(roomId)
            setOpenLogin(true)
            return
        } else {
            setIsRedirectLoading(true)
            sessionStorage.removeItem(`userIsRejoining-${roomId}`)
            socket?.emit("joinRoom", {
                roomId
            })
            // navigate(roomLink)
        }
    }

    return (
        <div className='flex flex-col'>
            <div className='text-xl xs:text-2xl sm:text-3xl font-bold'>{category === "trending" ? 'Trending Rooms' : category === "recent" ? 'Newest Spots' : category === "activity" ? 'Travel History' : null}</div>
            <div className='flex gap-7 sm:gap-10 overflow-x-scroll pt-8 pb-8'>
            {rooms.map((room, index) => (
                <div key={index} onClick={() => goToRoom(room._id)} className='w-20 xs:w-32 sm:w-44 cursor-pointer flex flex-col gap-2'>
                    <div className='h-20 w-20 xs:h-32 xs:w-32 sm:h-44 sm:w-44 relative rounded-xl bg-neutral-800 overflow-hidden'>
                        <div className='z-10 absolute bottom-1 right-1 h-8 w-12 rounded-xl font-semibold text-xs blacker-opacity flex items-center gap-1 justify-center'>
                            <span>{room.participants.length}</span>
                            <span><IoPerson /></span>
                        </div>
                        <img src={room.coverPhoto || 'https://via.placeholder.com/150'} className='transition-all ease-in-out duration-500 hover:scale-110 h-full w-full rounded-xl object-cover' />
                    </div>
                    <div className='text-xs xs:text-sm sm:text-base text-center font-semibold w-full overflow-hidden text-ellipsis whitespace-nowrap'>{room.name}</div>
                </div>
            ))}
            </div>
        </div>
    )
}

export default HomeRooms
