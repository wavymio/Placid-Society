import React, { useEffect, useState } from 'react'
import { useEditMyRoomNamePhotoTheme, useLikeRoom, usePatchEditMyRoomCoverPic, useSaveRoom } from '../api/MyRoomApi'
import roomThemes from '../config/roomThemes'
import { IoBookmarksSharp } from 'react-icons/io5'
import { FaBookmark, FaHeart } from 'react-icons/fa'
import { useQueryClient } from 'react-query'

const EditRoomTab = ({ room, loggedInUser }) => {
    const queryClient = useQueryClient()
    const { editNameAndCo, isEditNameAndCoLoading } = useEditMyRoomNamePhotoTheme()
    const { patchEditRoomCoverPic, isLoading: isCoverPicLoading } = usePatchEditMyRoomCoverPic()
    const { saveRoom, isSaveRoomLoading } = useSaveRoom()
    const { likeRoom, isLikeRoomLoading } = useLikeRoom()

    const [ theme, setTheme ] = useState(room.theme)
    const [ roomName, setRoomName ] = useState(room.name)
    const [ roomCover, setRoomCover ] = useState(null)
    const [roomNameError, setRoomNameError] = useState('')
    const [ roomCoverPreview, setRoomCoverPreview ] = useState(room.coverPhoto)
    const [ isSaved, setIsSaved ] = useState(loggedInUser?.savedRooms?.some(theRoom => theRoom?._id === room?._id))
    const [ isLiked, setIsLiked ] = useState(loggedInUser?.favoriteRooms?.some(theRoom => theRoom?._id === room?._id))
    const [error, setError] = useState(false)

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

    const handleRoomCoverChange = async (ev) => {
        const image = ev.target.files[0]
            
        if (image) {
            const formData = new FormData()
            formData.append('coverPhoto', image)
            const payload = {
                roomId: room._id,
                formData
            }
            const res = await patchEditRoomCoverPic(payload)
        }
    }

    const saveChanges = async (ev) => {
        ev.preventDefault()
        if((room.name === roomName) && (room.theme === theme.name)) {
            return
        }

        if (roomName.trim().length < 1) {
            setRoomNameError("Enter a Room Name")
            return
        }

        setRoomNameError('')
        const formData = new FormData()

        formData.append('name', roomName.trim())
        formData.append('theme', theme.name ? theme.name : theme)

        const payload = {
            roomId: room._id,
            formData
        }

        const data = await editNameAndCo(payload)
    }

    const handleSaveRoom = async (roomId) => {
        if (!roomId) return
        if (isSaveRoomLoading) return
        setIsSaved(!isSaved)

        const data = await saveRoom(roomId)
        if (data.success) {
            await queryClient.invalidateQueries("validateUser")
        } 
        
    }

    const handleLikeRoom = async (roomId) => {
        if (!roomId) return
        if (isLikeRoomLoading) return
        setIsLiked(!isLiked)

        const data = await likeRoom(roomId)
        if (data.success) {
            await queryClient.invalidateQueries("validateUser")
        }
    }

    useEffect(() => {
        setTheme(room.theme)
        setRoomName(room.name)
        setRoomCover(null)
        setRoomCoverPreview(room.coverPhoto)
    }, [room])
    return (
        <form className='-mt-10 xs:mt-0 w-[250px] xs:w-[350px] sm:w-[470px] md:w-[550px] lg:w-[600px] h-[350px] xs:h-[250px] sm:h-[300px] relative bg-black border border-neutral-900 rounded-t-md rounded-b-2xl px-8 py-8 flex flex-col gap-5 items-center'>
            <div className='absolute z-20 top-1 px-1 w-full flex items-center justify-between'>
                <div><FaBookmark onClick={() => handleSaveRoom(room?._id)} className={`z-20 h-5 w-5 ${isSaved ? 'text-white' : 'text-neutral-900'} transition-all duration-300 ease-out hover:scale-110 cursor-pointer`}/></div>
                <div><FaHeart onClick={() => handleLikeRoom(room?._id)} className={`z-20 h-5 w-5 ${isLiked ? 'text-white' : 'text-neutral-900'} transition-all duration-300 ease-out hover:scale-110 cursor-pointer`}/></div>
            </div>

            <div className='flex flex-col items-center gap-4 xs:gap-0 xs:flex-row xs:items-center xs:justify-center w-full'>
                <div className='xs:w-2/6 xs:flex xs:flex-row xs:justify-left'>
                    <div className={`relative ${getRoomTheme(theme)} p-1 w-20 h-20 sm:w-28 sm:h-28 md:w-32 md:h-32 rounded-full cursor-pointer`}>
                        <img src={roomCoverPreview || `https://via.placeholder.com/150`} className='object-cover w-full h-full rounded-full hover:scale-105 transition-all duration-300 ease-in-out' alt="room cover" />
                        {(room.owner.some((owner) => owner._id === loggedInUser._id) || room.admins.some((owner) => owner._id === loggedInUser._id)) ? (
                            <>
                            {isCoverPicLoading ? (
                                <div className='absolute top-0 left-0 w-20 h-20 sm:w-28 sm:h-28 md:w-32 md:h-32 rounded-full black-opacity flex items-center justify-center'>
                                    <span className='loader'></span>
                                </div>
                            ) : (
                                <input onChange={handleRoomCoverChange} type='file' accept='image/*' className='absolute top-0 left-0 rounded-full cursor-pointer opacity-0 border h-full w-full border-red-600' />
                            )}
                            </>
                        ) : (
                            <div className='absolute top-0 left-0 w-20 h-20 sm:w-28 sm:h-28 md:w-32 md:h-32 rounded-full'></div>
                        )}
                        
                    </div>
                </div>
                <div className='relative w-full h-20 xs:w-4/6 xs:h-20 sm:h-28 md:h-32 rounded-lg'>
                    <div className='px-3 py-2 sm:py-3 rounded-2xl absolute z-10 top-0 left-0 flex flex-col gap-3 h-full w-full bg-transparent backdrop-filter backdrop-blur-3xl'>
                        <div className='w-full flex items-center justify-center font-bold text-[10px] xs:text-[12px] sm:text-xs'>
                            {room.admins.includes(loggedInUser._id) || room.owner.includes(loggedInUser._id) ? 'CHOOSE THEME' : 'AVAILABLE THEMES'}
                        </div>
                        <div className='w-full flex items-center justify-center gap-2 sm:gap-4'>
                            {roomThemes.map((theme, index) => (
                                <div onClick={() => setTheme(theme)} key={index} className='flex flex-col items-center justify-center cursor-pointer'>
                                    <div title={theme.name} className={`${theme.color} animate-spin w-9 h-9 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-full`}></div>
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
           
            {((room.admins.some(admin => admin._id === loggedInUser._id)) || (room.owner.some(owner => owner._id === loggedInUser._id))) && (
                <button 
                disabled={isEditNameAndCoLoading} 
                onClick={saveChanges} 
                className={`${(room.name === roomName) && (room.theme === theme.name) ? 'border border-white cursor-not-allowed' : 'border border-white bg-neutral-900 hover:border-red-900 hover:bg-red-900 cursor-pointer transition-all duration-300 ease-in-out'} flex items-center justify-center absolute bottom-1 right-1 rounded-xl xs:rounded-lg w-20 h-10 xs:w-24 xs:h-12 py-2 px-2 text-[10px] xs:text-xs font-bold`}>
                    {isEditNameAndCoLoading ? (
                        <span className='loader'></span>
                    ) : (
                        'SAVE'
                    )}
                </button>
            )}
            
        </form>
)
}

export default EditRoomTab
