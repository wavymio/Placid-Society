import { IoCloseSharp, IoPlayOutline } from 'react-icons/io5'
import { useSearchForVideos } from '../api/SearchApi'
import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Separator } from './ui/separator'
import { FaPlay, FaStar, FaVideoSlash } from 'react-icons/fa'
import { HiOutlineDownload } from "react-icons/hi"
import { LuPlay } from "react-icons/lu"
import { useChangeRoomVideo } from '../api/MyRoomApi'
import AudioVisualiser from './AudioVisualiser'

const VideoSettingsTab = ({ room, loggedInUser, formatTime }) => {
    const { searchForVideos, isSearchForVideosLoading } = useSearchForVideos()
    const { changeRoomVideo, isChangeRoomVideoLoading  } = useChangeRoomVideo()
    const [searchInput, setSearchInput] = useState('')
    const [videos, setVideos] = useState(undefined)
    const [selectedVideo, setSelectedVideo] = useState(null)

    const handleSearchChange = async () => {
        if (searchInput) {
            const data = await searchForVideos(searchInput)
            setVideos(data)
        }
    }

    const clearSearch = (ev) => {
        ev.preventDefault()
        setSearchInput('')
        setVideos(undefined)
        setSelectedVideo(null)
    }

    const handleChangeVideo = async (video, room) => {
        if (!video?._id) return
        if (!room?._id) return
        if ((room.owner.every(owner => owner._id !== loggedInUser._id)) && (room.admins.every(admin => admin._id !== loggedInUser._id))) return
        if (isChangeRoomVideoLoading) return
        if (video?._id === room.video?._id) return

        setSelectedVideo(video?._id)

        const payload = {
            roomId: room._id,
            videoId: {
                video: video._id
            }
        }

        const data = await changeRoomVideo(payload)
        if (data.success) {
            setSearchInput('')
            setVideos(undefined)
            setSelectedVideo(null)
        }
    }

    useEffect(() => {
        handleSearchChange()
    }, [searchInput])

    return (
        <div className='rounded-l-2xl sm:rounded-2xl overflow-y-scroll sm:overflow-auto w-[260px] xs:w-[350px] h-[300px] sm:h-auto sm:w-[450px] md:w-[550px] -mt-10 sm:mt-16 lg:mt-0 lg:w-[600px] px-0 xs:px-2 sm:px-8 py-8 relative bg-black border border-neutral-900 text-sm'>
            {Array.from({ length: 3 }, (_, i) => i + 1).map((number, index) => (
                <div key={index} className='z-10 bg-transparent backdrop-filter backdrop-blur-2xl shadow-lg absolute w-full h-screen sm:h-full top-0 left-0 rounded-xl'></div>
            ))}
            <div className='relative z-10 flex flex-col gap-5 items-center'>
                <div className='bg-black rounded-lg w-full h-12 top-16 xs:top-20 left-0 px-7 sm:p-0 sm:top-0 sm:left-0 sm:relative z-4 flex items-center sm:h-10 sm:w-full sm:bg-black'>
                    <input
                    value={searchInput}
                    onChange={(ev) => setSearchInput(ev.target.value)}
                    placeholder='Search for videos'
                    className='py-3 px-3 w-full h-12 sm:h-full sm:p-3 rounded-l-lg border border-neutral-800 sm:text-xs bg-inherit focus:outline-none placeholder-neutral-200 placeholder:text-xs' />
                    <button onClick={clearSearch} className='w-16 h-full flex items-center justify-center border-none rounded-r-lg bg-neutral-800 sm:p-3 sm:h-full sm:w-auto hover:bg-neutral-900 transition-colors ease-in-out duration-300'>
                        <IoCloseSharp />
                    </button>
                </div>

                <div className='font-bold text-xs xs:text-sm'>OR</div>

                <Link to={'/my-videos'} className='text-xs xs:text-sm flex items-center justify-center w-[100px] xs:w-[120px] bg-neutral-900 border border-white py-4 font-bold rounded-xl transition-all duration-300 ease-in-out hover:bg-neutral-800 hover:scale-105'>Upload</Link>
                
                <Separator className={'bg-neutral-800 mt-5'} />
                
                {(!room.video || room.video?.length < 1) ? (
                    <div className='py-5 flex flex-col items-center justify-center gap-4'>
                        <div className='h-[80px] w-[80px] bg-neutral-900 border border-white rounded-full flex items-center justify-center'>
                            <FaVideoSlash style={{ fontSize: '25px' }} />
                        </div>
                        <div className='font-medium text-[12px]'>NO PLAYING VIDEO</div>
                    </div>
                ) : (
                    <div className='py-5 flex flex-col items-center gap-8 sm:gap-2'>
                        <div className='relative h-32 w-32'>
                            <img className='h-full w-full rounded-xl object-cover' src={room.video?.coverPhoto} alt="image" />
                            {isChangeRoomVideoLoading && (
                                <div className='absolute z-10 top-0 left-0 flex items-center justify-center black-opacity h-full w-full rounded-xl'>
                                    <div className='loader'></div>
                                </div>
                            )}
                            <div className='absolute bottom-2 left-2'>
                                <AudioVisualiser />
                            </div>
                        </div>
                        <div className='w-full text-xs xs:text-sm flex items-center justify-center xs:pl-5 sm:pl-0'>{room.video?.name}</div>
                    </div>
                )}

                {searchInput && (
                    <>
                        {isSearchForVideosLoading ? (
                            <div className={`mt-6 left-0 top-10 w-full z-10 shadow-lg px-7 sm:p-0 sm:z-5 sm:w-full rounded-lg bg-black text-white absolute sm:right-0 sm:mt-2 transition-opacity duration-500 ease-in-out ${isSearchForVideosLoading} ? 'opacity-100 visible' : 'opacity-0 invisible'}`}>
                                <div className='p-4 sm:p-3 border border-neutral-800 flex justify-center rounded-lg'>
                                    <div className='loader'></div>
                                </div>
                            </div>
                        ) : (
                            <div className={`bg-transparent max-h-[200px] sm:max-h-[270px] rounded-lg left-0 top-10 w-full shadow-lg z-10 px-7 sm:p-0 sm:z-5 sm:w-full bg-black text-white absolute sm:right-0 mt-4 sm:mt-2 transition-opacity duration-500 ease-in-out ${videos ? 'opacity-100 visible' : 'opacity-0 invisible'}`}>
                                <div className={`${videos?.length > 1 ? 'overflow-y-scroll' : 'null'} sm:${videos?.length > 3 ? 'overflow-y-scroll' : 'null'} max-h-[200px] sm:max-h-[270px] bg-black rounded-lg border w-full border-neutral-800 flex flex-col`} >
                                    {videos?.length > 0 ? (
                                        videos?.map((video, index) => (
                                            <div onClick={() => handleChangeVideo(video, room)} key={index} className={`relative transition-colors duration-300 ease-in-out ${isChangeRoomVideoLoading ? 'bg-neutral-900' : null} hover:bg-neutral-900  ${index === 0 && (videos?.length < 3) ? 'rounded-t-lg' : null} ${(index === videos?.length-1) && (videos?.length < 3) ? 'rounded-b-lg' : null}`}>
                                                {video._id === room.video?._id && (
                                                    <div className={`absolute black-opacity top-0 left-0 w-full h-full ${index === 0 && (videos?.length < 3) ? 'rounded-t-lg' : null} ${(index === videos?.length-1) && (videos?.length < 3) ? 'rounded-b-lg' : null}`}></div> 
                                                )}
                                                <div className={`px-4 pt-4 pb-4 ${(room.owner.every(owner => owner._id !== loggedInUser._id)) && (room.admins.every(admin => admin._id !== loggedInUser._id)) ? null :'cursor-pointer'} flex flex-col gap-2 text-sm ${index !== 0 ? null : 'rounded-t-lg'} ${index === videos.length-1 ? 'rounded-b-lg' : null}`}>
                                                    <div className='font-bold flex items-center gap-3'>
                                                        {(isChangeRoomVideoLoading && (selectedVideo === video._id)) && (
                                                            <div className='loader'></div>
                                                        )}
                                                        <div className='overflow-x-hidden'>{video?.name}</div>
                                                    </div>
                                                    <div className='flex items-center justify-between'>
                                                        <div className='flex items-center gap-3'>
                                                            <div className='flex items-center gap-[1px]'>
                                                                <span>{video?.downloads}</span> 
                                                                <HiOutlineDownload style={{fontSize: '18px' }} />
                                                            </div>
                                                            <div className='flex items-center gap-1'>
                                                                <span>{formatTime(video?.duration)}</span>
                                                                <LuPlay style={{fontSize: '15px' }}/>
                                                            </div>
                                                        </div>
                                                        <div className='flex items-center'>
                                                            {Array.from({ length: 5 }, (_, i) => i + 1).map((num, index) => {
                                                                if (video.rating >= num) {
                                                                    return <FaStar style={{ color: 'rgb(251 191 36)' }} />
                                                                } else {
                                                                    return <FaStar style={{ color: 'rgb(38 38 38)' }} />
                                                                }
                                                            })}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className='sm:p-3 p-4 text-sm rounded-lg'>No results found</div>
                                    )}
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>

            <div className='absolute bottom-5 left-5 rounded-full h-12 w-12 bg-red-300'></div>
            <div className='absolute bottom-5 right-5 rounded-full h-12 w-12 bg-yellow-300'></div>
        </div>
    )
}

export default VideoSettingsTab
