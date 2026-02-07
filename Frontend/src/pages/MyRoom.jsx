import { useSocket } from '../contexts/SocketContext'
import React, { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { FaGear, FaMessage } from 'react-icons/fa6'
import RoomSettingsPanel from '../components/RoomSettingsPanel'
import { useGetRoom } from '../api/RoomApi'
import { useQueryClient } from 'react-query'
import { useAuth } from '../contexts/AuthContext'
import { useLoading } from '../contexts/LoadingContext'
import ChatBox from '../components/ChatBox'
import VideoPlayer from '../components/VideoPlayer'


const MyRoom = ({ scrollToTop }) => {
    const queryClient = useQueryClient()
    const { loggedInUser, isLoading: isAuthLoading } = useAuth()
    const { isRedirectLoading, setIsRedirectLoading } = useLoading()
    const { roomId } = useParams()
    const { room, isGetRoomLoading } = useGetRoom(roomId)
    const { socket, isSocketLoading } = useSocket()
    const [openRoomSettingsBar, setOpenRoomSettingsBar] = useState(false)
    const navigate = useNavigate()
    const [isUseEffectLoading, setIsUseEffectLoading] = useState(true)
    const roomPageEndRef = useRef(null)
    const roomPageStartRef = useRef(null) 

    const formatTime = (time) => {
        const hours = Math.floor(time / 3600)
        const minutes = Math.floor((time % 3600) / 60)
        const seconds = Math.floor(time % 60)
        return `${hours > 0 ? `${hours}:` : ''}${minutes}:${seconds < 10 ? '0' : ''}${seconds}`
    }

    const userIsRejoining = sessionStorage.getItem(`userIsRejoining-${roomId}`)

    const handleRejoinRoom = () => {
        console.log("user rejoining")
        console.log(socket, " 2")
        sessionStorage.removeItem(`userIsRejoining-${roomId}`)
        socket.emit('joinRoom', { roomId })
        setIsRedirectLoading(true)
    }

    const toggleRoomSettingsBar = () => {
        setOpenRoomSettingsBar(!openRoomSettingsBar)
    }

    const scrollToBottom = () => {
        roomPageEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }
    
    useEffect(() => {  
        console.log("emitting...")

        console.log(socket, " 1")
        setTimeout(() => {            
            if (sessionStorage.getItem(`userIsRejoining-${roomId}`)) {
                console.log("user rejoining?: ", userIsRejoining)
                if (socket && socket.connected && !isSocketLoading) {
                    handleRejoinRoom()
                    setIsUseEffectLoading(false)
                    sessionStorage.setItem(`userIsRejoining-${roomId}`, 'true')
                } else {
                    const intervalId = setInterval(() => {
                        if (socket && socket.connected && !isSocketLoading) {
                            handleRejoinRoom()
                            clearInterval(intervalId)
                            setIsUseEffectLoading(false)
                            sessionStorage.setItem(`userIsRejoining-${roomId}`, 'true')
                        }
                    }, 1000)
                }
            } else {
                setIsUseEffectLoading(false)
                sessionStorage.setItem(`userIsRejoining-${roomId}`, 'true')
            }
        }, 1000)
        // sessionStorage.setItem(`userIsRejoining-${roomId}`, 'true')
        return () => {    
            if (socket && sessionStorage.getItem(`userIsRejoining-${roomId}`)) {
                console.log("removing...")
                // sessionStorage.removeItem(`userIsRejoining-${roomId}`)
                socket.emit('leaveRoom')
            }
        }
    }, [socket, socket?.connected, roomId, isSocketLoading])

    if (isUseEffectLoading || isGetRoomLoading || !room || isSocketLoading || isAuthLoading || !socket) {
        return (
            <div className='overflow-y-hidden w-full h-[80vh] flex flex-col gap-7 items-center pt-[145px] lg:pt-[200px]'>
                <div className='big-loader'></div>
                <div className='text-xs font-bold'>LOADING ROOM...</div>
            </div>
        )
    }

    if (isRedirectLoading) {
        return (
            <div className='overflow-y-hidden w-full h-[80vh] flex flex-col gap-7 items-center pt-[145px] lg:pt-[200px]'>
                <div className='big-loader'></div>
                <div className='text-xs font-bold'>REDIRECTING TO ROOM...</div>
            </div>
        )
    }

    return (
        <>
            <div className='sm:block hidden' ref={roomPageStartRef}></div>
            <RoomSettingsPanel room={room} toggleRoomSettingsBar={toggleRoomSettingsBar} openRoomSettingsBar={openRoomSettingsBar} loggedInUser={loggedInUser} formatTime={formatTime} />
            <div onClick={toggleRoomSettingsBar} className='h-12 w-12 left-1 top-1/2 sm:left-0 sm:h-16 sm:w-16 animate-spin cursor-pointer flex items-center justify-center rounded-full  absolute z-10 transition-transform duration-300 ease-in-out hover:scale-105 bg-transparent backdrop-filter backdrop-blur-lg shadow-lg'>
                <FaGear
                    className='h-[16px] w-[16px] sm:h-[20px] sm:w-[20px]'
                />
            </div>
            <div onClick={scrollToBottom} className='hidden lg:hidden cursor-pointer sm:flex items-center justify-center rounded-full h-16 w-16 absolute z-10 top-20 right-5 transition-transform duration-300 ease-in-out hover:scale-105 bg-transparent backdrop-filter backdrop-blur-lg shadow-lg'>
                <FaMessage
                    style={{ fontSize: '20px' }}
                />
            </div>

            <div className='-mt-6 xs:gap-0 sm:mt-0 flex flex-col sm:gap-5 w-full lg:flex lg:flex-row lg:items-center lg:gap-10 lg:h-[490px]'>
                <VideoPlayer socket={socket} formatTime={formatTime} loggedInUser={loggedInUser} room={room} isUseEffectLoading={isUseEffectLoading} isRedirectLoading={isRedirectLoading} />
                <ChatBox room={room} loggedInUser={loggedInUser} socket={socket} scrollToTop={scrollToTop} />
            </div>
            <div ref={roomPageEndRef}></div>
        </>
    )
}

export default MyRoom
