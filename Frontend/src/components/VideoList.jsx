import React from 'react'
import { FaVideoSlash } from 'react-icons/fa'
import { Link } from 'react-router-dom'

const VideoList = ({ videos, areVideosLoading, tab, formatTime }) => {
    return (
        <div className='w-full flex items-center justify-center'>
            <div className={`w-[650px] h-[320px] xs:h-[430px] pr-2 xs:pr-0 sm:px-5 overflow-y-auto flex flex-col ${videos?.length < 1 || areVideosLoading ? 'items-center' : 'items-start'} justify-start gap-10 xs:gap-4`}>
                {areVideosLoading ? (
                    <div className='pt-8 sm:pt-10'>
                        <div className='big-loader'></div>
                    </div>
                ) : (
                    <>
                        {videos?.length < 1 ? (
                            <div className='flex flex-col items-center gap-2'>
                                <div className='flex items-center justify-center h-14 w-14 sm:h-20 sm:w-20 rounded-full p-1 bg-neutral-900 border-1 hover:bg-neutral-800 transition-colors ease-in-out duration-300 '>
                                    <FaVideoSlash style={{ color: 'white', fontSize: '25px' }} />
                                </div>
                                {tab === "myVideos" ? (
                                    <span className='text-xs text-center text-white'>NO VIDEOS</span>
                                ) : tab === "savedVideos" ? (
                                    <span className='text-xs text-center text-white'>NO SAVED VIDEOS</span>
                                ) : (
                                    <span className='text-xs text-center text-white'>NO DOWNLOADS</span>
                                )}                
                            </div>
                        ) : (
                        <>
                            {videos?.map((video, index) => (
                                <Link to={``} key={index} className='w-full flex flex-col xs:flex-row items-start gap-3 sm:gap-4 md:gap-6 hover:scale-105 transition-all duration-300 ease-in-out '>
                                    <div className='relative w-full h-28 xs:w-16 xs:h-16 sm:h-32 sm:w-40'>
                                        <img 
                                        src={video.coverPhoto} 
                                        alt="cover photo"
                                        className='h-full w-full object-cover rounded-xl'
                                        />
                                        <div className='absolute py-2 px-3 top-0 right-0 text-xs font-bold black-opacity rounded-xl'>{formatTime(video.duration)}</div>
                                    </div>
                                    <div className=' flex flex-col w-full'>
                                        <div className='w-150 xs:w-[200px] sm:w-[350px] md:w-[400px] font-bold text-xs sm:text-sm md:text-base break-words'>{video.name}</div>
                                        <div className='text-xs'>{(video.size/1048576).toFixed(2)}Mb</div>
                                        <div className='text-xs'>{video.downloads} {video.downloads === 1 ? "download" : "downloads"}</div>
                                    </div>
                                </Link>
                            ))}
                        </>
                        )}
                    </>
                )}
            </div>
        </div>
    )
}

export default VideoList
