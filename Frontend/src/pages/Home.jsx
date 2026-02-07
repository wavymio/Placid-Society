import { useGetRecentRooms, useGetTrendingRooms } from '../api/RoomApi'
import React, { useEffect, useState } from 'react'
import HomeRooms from '../components/HomeRooms'
import { useAuth } from '../contexts/AuthContext'
import { IoCloseSharp } from 'react-icons/io5'
import { useNavigate } from 'react-router-dom'
import { useQueryClient } from 'react-query'
import { useSocket } from '../contexts/SocketContext'
import { useLoading } from '../contexts/LoadingContext'
import { useGetMyUserActivity } from '../api/MyUserApi'

const Home = () => {
    const queryClient = useQueryClient()
    const { isLoggedIn, isLoading, loggedInUser } = useAuth()
    const { socket, isSocketLoading } = useSocket()
    const { isRedirectLoading, setIsRedirectLoading } = useLoading()
    const { trendingRooms, isGetTrendingRoomsLoading } = useGetTrendingRooms()
    const { recentRooms, isGetRecentRoomsLoading } = useGetRecentRooms()
    const { userActivity, isGetMyActivityLoading } = useGetMyUserActivity(loggedInUser?._id)
    const navigate = useNavigate()
    const [openLogin, setOpenLogin] = useState(false)
    const [roomId, setRoomId] = useState(null)

    const handleRedirectToLoginOrSignUp = (page) => {
        const roomLink = roomId
        sessionStorage.setItem('redirectToRoom', roomLink)
        if (page === "login") {
            navigate('/login')
        }
        if (page === "signup") {
            navigate('/signup')
        }
        
    }

    useEffect(() => {
        console.log("hit")
        console.log(socket?.connected)
        console.log(sessionStorage.getItem('redirectToRoom'))
        if (socket?.connected && sessionStorage.getItem('redirectToRoom')) {
            const roomId = sessionStorage.getItem('redirectToRoom')
            sessionStorage.removeItem('redirectToRoom')
            setIsRedirectLoading(true)
            sessionStorage.removeItem(`userIsRejoining-${roomId}`)
            socket.emit("joinRoom", {
                roomId
            })
            console.log("done")
        }
    }, [socket?.connected])
    
    if (isGetTrendingRoomsLoading || isGetRecentRoomsLoading || isGetMyActivityLoading || isLoading) {
        return (
            <div className='overflow-y-hidden w-full h-[43vh] pb-2 flex justify-center items-center pt-[145px] lg:pt-[200px]'>
                <div className='big-loader'></div>
            </div>
        )
    }

    if (isRedirectLoading) {
        return (
            <div className='overflow-y-hidden w-full h-screen flex flex-col gap-7 items-center pt-[145px] lg:pt-[200px]'>
                <div className='big-loader'></div>
                <div className='text-xs font-bold'>REDIRECTING TO ROOM...</div>
            </div>
        )
    }

    return (
        <div className={`flex flex-col gap-7 xs:gap-10 sm:gap-20 bg-black`}>
            {trendingRooms?.length > 0 && (
                <HomeRooms socket={socket} rooms={trendingRooms} isLoggedIn={isLoggedIn} setOpenLogin={setOpenLogin} setRoomId={setRoomId} category={"trending"} />
            )}

            {recentRooms?.length > 0 && (
                <HomeRooms socket={socket} rooms={recentRooms} isLoggedIn={isLoggedIn} setOpenLogin={setOpenLogin} setRoomId={setRoomId} category={"recent"} />
            )}

            {((userActivity?.length > 0) && isLoggedIn) && (
                <HomeRooms socket={socket} rooms={userActivity} isLoggedIn={isLoggedIn} setOpenLogin={setOpenLogin} setRoomId={setRoomId} category={"activity"} />
            )}

            {openLogin && (
                <div className='flex items-center justify-center z-20 fixed top-0 left-0 bg-transparent w-full h-full backdrop-filter backdrop-blur-lg shadow-lg rounded-lg'>
                    <div className='flex items-center justify-center relative w-[240px] xs:w-[350px] sm:w-[370px] md:w-[450px] lg:w-[400px] h-[400x] bg-black px-10 py-12 border border-neutral-800 rounded-lg'>
                        <div onClick={() => setOpenLogin(false)} className='absolute top-1 right-1 rounded-lg py-2 px-2 bg-neutral-900 hover:bg-red-900 text-xs cursor-pointer transition-all duration-300 ease-in-out font-bold'>
                            <IoCloseSharp />
                        </div>
                        <div className='w-full flex flex-col gap-3'>
                            <div className='w-full flex flex-col gap-4'>
                                <div onClick={() => handleRedirectToLoginOrSignUp("login")} className='w-full h-14 text-white border-1 bg-neutral-900 hover:bg-neutral-800 flex items-center justify-center font-extrabold cursor-pointer rounded-lg transition-all ease-in-out duration-500 hover:scale-105'>Login</div>
                                <div className='text-white text-xs w-full flex justify-center font-extrabold'>OR</div>
                                <div onClick={() => handleRedirectToLoginOrSignUp("signup")} className='w-full h-14 text-white bg-neutral-900 hover:bg-neutral-800 border-1 flex items-center justify-center font-extrabold cursor-pointer rounded-lg transition-all ease-in-out duration-500 hover:scale-105'>Sign Up</div>
                            </div>
                            <div className='text-center text-xs'>{'Login or Sign up to  join this space'}</div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default Home
