import React, { useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { MdAdd } from "react-icons/md"
import { FaUsersSlash } from "react-icons/fa"
import { GoBookmarkSlash } from "react-icons/go"
import { FaDropletSlash, FaGear } from "react-icons/fa6"
import { IoCloseSharp } from 'react-icons/io5'
import roomThemes from '../config/roomThemes'
import InviteFriends from './InviteFriends'
import RoomPrivacyButton from './RoomPrivacyButton'
import { useCreateMyRoom } from '../api/MyRoomApi'
import { useQueryClient } from 'react-query'
import { useSocket } from '../contexts/SocketContext'
import { useLoading } from '../contexts/LoadingContext'
import { CiLocationOff } from "react-icons/ci"
import { useAuth } from '../contexts/AuthContext'

const UserProfileRoomsDisplay = ({ user, rooms, tab, sameUser, location, setLocationId, setOpenLogin }) => {
    const { isLoggedIn } = useAuth()
    const queryClient = useQueryClient()
    const { socket } = useSocket()
    const { isRedirectLoading, setIsRedirectLoading } = useLoading()
    const navigate = useNavigate()
    const { createMyRoom, isMyRoomCreating } = useCreateMyRoom()
    const [ showCreateRoomTab, setShowCreateRoomTab ] = useState(false)
    
    const [ theme, setTheme ] = useState({})   
    const [ roomName, setRoomName ] = useState('')
    const [ roomCover, setRoomCover ] = useState(null)
    const [roomNameError, setRoomNameError] = useState('')
    const [ roomCoverPreview, setRoomCoverPreview ] = useState(null)
    const [ page, setPage ] = useState(1)
    const pageRef = useRef(page)

    const [invitedUsers, setInvitedUsers] = useState([])

    const [isPublic, setIsPublic] = useState(true)

    const toggleCreateRoomTab = () => {
        setShowCreateRoomTab(!showCreateRoomTab)
        setRoomName('')
        setTheme({})
        setRoomCover(null)
        setRoomCoverPreview(null)
        setInvitedUsers([])
        pageRef.current = 1
        setPage(1)
        setRoomNameError('')
        setIsPublic(true)
    }

    const handleRoomCoverChange = (ev) => {
        const image = ev.target.files[0]
        setRoomCover(image)
        setRoomCoverPreview(URL.createObjectURL(image))
    }

    const getRoomTheme = (theme) => {
        switch(theme?.name ? theme?.name : theme) {
            case "romance": 
                return "bg-gradient-to-r from-gradient-deep-red via-gradient-soft-pink to-gradient-rose-gold"
            
            case "sad":
                return "bg-gradient-to-r from-gradient-light-gray via-gradient-medium-gray to-gradient-dark-gray"
            
            case "comedy":
                return "bg-gradient-to-r from-gradient-pink via-gradient-purple to-gradient-yellow"
    
            case "horror":
                return "bg-gradient-to-r from-gradient-pumpkin-orange via-gradient-midnight-black to-gradient-dark-purple"

            default:
                return "border border-neutral-800"
        }
    }

    const handleNext = (ev) => {
        ev.preventDefault()
        if (!roomName) {
            setRoomNameError("Enter a Room Name")
            return
        }
        
        setRoomNameError('')
        pageRef.current += 1
        setPage(pageRef.current)
    }

    const handlePrevious = (ev) => {
        ev.preventDefault()
        pageRef.current -= 1
        setPage(pageRef.current)
    }

    const handleKeyDown = (event) => {
        if (event.key === 'Enter') {
          event.preventDefault()
        }
    }

    const handleSubmit = async (ev) => {
        if (page !== 3) return
        ev.preventDefault()
        if (isMyRoomCreating) return

        const invitedUsersIds = []
        invitedUsers.map(user => {
            return invitedUsersIds.push(user._id)
        })
        
        const formData = new FormData()

        formData.append('roomName', roomName)
        if (roomCover) {
            formData.append('roomCoverPhoto', roomCover)
        }
        formData.append('roomTheme', theme.name ? theme.name : 'none')
        if (invitedUsers.length > 0) {
            formData.append('invitedUsers', JSON.stringify(invitedUsersIds))
        }
        formData.append('privacy', isPublic ? 'public' : 'private')

        const response = await createMyRoom(formData)
        if (response.success) {
            toggleCreateRoomTab()
            await queryClient.invalidateQueries('validateUser')
        }
    }

    const joinRoom = (roomId) => {
        sessionStorage.removeItem(`userIsRejoining-${roomId}`)
        setIsRedirectLoading(true)
        socket.emit("joinRoom", {
            roomId
        })
    }

    const joinLocation = (locationId) => {
        if (isLoggedIn) {
            console.log(locationId)
            sessionStorage.removeItem(`userIsRejoining-${locationId}`)
            setIsRedirectLoading(true)
            socket.emit("joinRoom", {
                roomId: locationId
            })
            
        } else {
            setLocationId(locationId)
            setOpenLogin(true)
        }
    }

    return (
        <div className='mt-8 w-full flex items-center justify-center'>
            <div className={`w-full overflow-x-auto flex flex-nowrap ${rooms?.length > 0 ? 'justify-left' : 'justify-center'} gap-6 pb-8`}>
                {tab === "owned" && sameUser &&
                    <div onClick={toggleCreateRoomTab} className='flex flex-col items-center gap-2 cursor-pointer'>
                        <div className='flex items-center justify-center h-14 w-14 sm:h-20 sm:w-20 rounded-full p-1 bg-neutral-900 border-1 hover:bg-neutral-800 transition-colors ease-in-out duration-300 '>
                            <MdAdd style={{ color: 'white', fontSize: '25px' }} />
                        </div>
                        <span className='text-xs text-center text-white'>CREATE ROOM</span>
                    </div>
                }

                {tab === "owned" && !sameUser && rooms.length < 1 &&
                    <div className='flex flex-col items-center gap-2'>
                        <div className='flex items-center justify-center h-14 w-14 sm:h-20 sm:w-20 rounded-full p-1 bg-neutral-900 border-1 hover:bg-neutral-800 transition-colors ease-in-out duration-300 '>
                            <FaUsersSlash style={{ color: 'white', fontSize: '25px' }} />
                        </div>
                        <span className='text-xs text-center text-white'>NO {tab.toUpperCase()} ROOMS</span>
                    </div>
                }

                {rooms?.length > 0 && rooms.map((room, index) => (
                    <div key={index} onClick={() => joinRoom(`${room._id}`)} className='max-w-16 sm:max-w-20 flex flex-col items-center gap-2 cursor-pointer'>
                        <div className={`h-14 w-14 sm:h-20 sm:w-20 rounded-full p-1 ${getRoomTheme(room?.theme)}`}>
                            <img src={room?.coverPhoto ? room?.coverPhoto : `https://via.placeholder.com/150`} alt="img" className='h-full w-full rounded-full object-cover' />
                        </div>
                        <span className='overflow-hidden flex items-center justify-center w-full text-xs text-center font-bold'>{room.name}</span>
                    </div>
                ))}

                {((tab === "saved" || tab === "favorite") && rooms?.length === 0) && 
                    <div className='flex flex-col items-center justify-center gap-2'>
                        <div className='flex items-center justify-center h-14 w-14 sm:h-20 sm:w-20 rounded-full p-1 bg-neutral-900 border-1 hover:bg-neutral-800 transition-colors ease-in-out duration-300 '>
                            {tab === "saved" ? (
                                <GoBookmarkSlash style={{ color: 'white', fontSize: '25px' }} />
                            ) : (
                                <FaDropletSlash style={{ color: 'white', fontSize: '25px' }} />
                            )}
                        </div>
                        <span className='text-xs text-center'>NO {tab.toUpperCase()} ROOMS</span>
                    </div>
                }
                
                {(tab === "location" && !location) && (
                    <div className='flex flex-col items-center gap-2'>
                        <div className='flex items-center justify-center h-14 w-14 sm:h-20 sm:w-20 rounded-full p-1 bg-neutral-900 border-1 hover:bg-neutral-800 transition-colors ease-in-out duration-300 '>
                            <CiLocationOff style={{ color: 'white', fontSize: '25px' }} />
                        </div>
                        <span className='text-xs text-center text-white'>UNAVAILABLE</span>
                    </div>
                )}

                {(tab === "location" && location && !sameUser) && (
                    <div onClick={() => joinLocation(`${location._id}`)} className='max-w-28 sm:max-w-[148px] flex flex-col items-center gap-2'>
                        <div className={`h-28 w-28 sm:h-[148px] sm:w-[148px] rounded-xl p-1 ${getRoomTheme(location?.theme)}`}>
                            <img src={location?.coverPhoto ? location?.coverPhoto : `https://via.placeholder.com/150`} alt="img" className='h-full w-full rounded-xl object-cover' />
                        </div>
                        <span className='overflow-hidden flex items-center justify-center w-full text-xs text-center whitespace-nowrap text-ellipsis font-bold'>{location.name}</span>
                    </div>
                )}
            </div>
            {showCreateRoomTab && (
                <div className='flex items-center justify-center shadow-lg rounded-lg w-full h-full fixed top-0 left-0 z-20 bg-transparent backdrop-filter backdrop-blur-lg'>
                    <form onKeyDown={handleKeyDown} onSubmit={handleSubmit} className='relative w-[250px] xs:w-[350px] sm:w-[470px] md:w-[550px] lg:w-[600px] h-[400x] bg-black pt-10 px-10 pb-20 border border-neutral-800 rounded-lg'>
                        <div onClick={() => setShowCreateRoomTab(false)} className='absolute top-1 right-1 rounded-lg py-2 px-2 bg-neutral-900 hover:bg-red-900 text-xs cursor-pointer transition-all duration-300 ease-in-out font-bold'>
                            <IoCloseSharp />
                        </div>

                        {isMyRoomCreating ? (
                            <div className='w-full h-full flex flex-col gap-8 p-10 items-center justify-center'>
                                <div className='big-loader'></div>
                                <div className='text-xs text-center w-full font-bold'>CREATING ROOM...</div>
                            </div>
                        ) : (
                            <>
                            {page === 1 && (
                                <div className='w-full h-full flex flex-col gap-5 items-center'>
                                    <div className='flex flex-col items-center gap-4 xs:gap-0 xs:flex-row xs:items-center xs:justify-center w-full'>
                                        <div className='xs:w-2/6 xs:flex xs:flex-row xs:justify-left'>
                                            <div className={`relative ${getRoomTheme(theme)} p-1 w-20 h-20 sm:w-28 sm:h-28 md:w-32 md:h-32 rounded-full cursor-pointer`}>
                                                <img src={roomCoverPreview || `https://via.placeholder.com/150`} className='object-cover w-full h-full rounded-full hover:scale-105 transition-all duration-300 ease-in-out' alt="room cover" />
                                                <input onChange={handleRoomCoverChange} type='file' accept='image/*' className='absolute top-0 left-0 rounded-full cursor-pointer opacity-0 border h-full w-full border-red-600' />
                                            </div>
                                        </div>
                                        <div className='relative w-full h-20 xs:w-4/6 xs:h-20 sm:h-28 md:h-32 rounded-lg'>
                                            <div className='px-3 py-2 sm:py-3 rounded-2xl absolute z-10 top-0 left-0 flex flex-col gap-3 h-full w-full bg-transparent backdrop-filter backdrop-blur-3xl'>
                                                <div className='w-full flex items-center justify-center font-bold text-[10px] xs:text-[12px] sm:text-xs'>CHOOSE THEME</div>
                                                <div className='w-full flex items-center justify-center gap-2 sm:gap-4'>
                                                    {roomThemes.map((theme, index) => (
                                                        <div onClick={() => setTheme(theme)} key={index} className='flex flex-col items-center justify-center cursor-pointer'>
                                                            <div title={theme.name} className={`${theme.color} animate-spin w-[34px] h-[34px] sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-full`}></div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                            <div  className='bg-yellow-300 absolute top-0 left-0 h-12 w-12 rounded-full'></div>
                                            <div  className='bg-red-300 absolute bottom-0 right-0 h-12 w-12 rounded-full'></div>
                                        </div>
                                    </div>
                                    <div className='w-full flex flex-col'>
                                        <input type="text" value={roomName} onChange={(ev) => setRoomName(ev.target.value)} className='text-xs xs:text-sm sm:text-base w-full p-3 border-b-1 border-neutral-800 bg-inherit focus:outline-none placeholder-neutral-200 placeholder:text-xs sm:placeholder:text-sm' placeholder='Room Name' />
                                        {roomNameError && (<span className='text-xs ml-3 mt-1 text-red-500'>{roomNameError}</span>)}
                                    </div>
                                </div>
                            )}

                            {page === 2 && (
                                <div className='w-full h-full flex flex-col items-center'>
                                    <div className='w-full sm:w-4/5 h-full '>
                                        <InviteFriends invitedUsers={invitedUsers} setInvitedUsers={setInvitedUsers} />
                                    </div>
                                </div>
                            )}

                            {page === 3 && (
                                <div className='w-full h-full flex flex-col gap-4 justify-center items-center font-bold'>
                                    <div className='absolute top-2 left-2 flex items-center justify-center gap-2'><FaGear className='animate-spin h-[22px] w-[22px] xs:h-[24px] xs:w-[24px] sm:h-[35px] sm:w-[35px]' /></div>
                                    <div className='w-full h-full flex items-center justify-center gap-3'>
                                        <RoomPrivacyButton isPublic={isPublic} setIsPublic={setIsPublic} />
                                    </div>
                                    <div className='text-[11px] xs:text-xs'>ROOM PRIVACY SETTINGS</div>
                                </div>
                            )}
                            </>
                        )} 
                        
                        {page < 3 && (
                            <div onClick={handleNext} className='flex items-center justify-center absolute bottom-1 right-1 rounded-xl xs:rounded-lg w-20 h-10 xs:w-24 xs:h-12 py-2 px-2 text-[10px] xs:text-xs border border-white bg-neutral-900 hover:border-red-900 hover:bg-red-900 cursor-pointer transition-all duration-300 ease-in-out font-bold'>
                                NEXT
                            </div>
                        )}
                        
                        {page > 1 && (
                            <div onClick={handlePrevious} className='flex items-center justify-center absolute bottom-1 left-1 rounded-xl xs:rounded-lg w-20 h-10 xs:w-24 xs:h-12 py-2 px-2 text-[10px] xs:text-xs border border-white bg-neutral-900 hover:border-red-900 hover:bg-red-900 cursor-pointer transition-all duration-300 ease-in-out font-bold'>
                                PREVIOUS 
                            </div>
                        )}

                        {page === 3 && (
                            <button disabled={isMyRoomCreating} type='submit' className='flex items-center justify-center absolute bottom-1 right-1 rounded-xl xs:rounded-lg w-20 h-10 xs:w-24 xs:h-12 py-2 px-2 text-[10px] xs:text-xs border border-white bg-neutral-900 hover:border-red-900 hover:bg-red-900 cursor-pointer transition-all duration-300 ease-in-out font-bold'>
                                FINISH 
                            </button>
                        )}
                    </form>
                </div>
            )}
        </div>
    )
}

export default UserProfileRoomsDisplay
