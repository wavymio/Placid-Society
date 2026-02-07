import { useRoomEvents } from '../contexts/RoomEventsContext'
import { usePlayPause } from '../contexts/PlayPauseContext'
import { useToast } from '../contexts/ToastContext'
import React, { useEffect, useRef, useState } from 'react'
import { FaCompress, FaDownload, FaEdit, FaExpand, FaPause, FaPlay, FaUsers, FaVideo, FaVideoSlash, FaVolumeDown, FaVolumeMute, FaVolumeUp } from "react-icons/fa"

const VideoPlayer = ({ formatTime, room, isUseEffectLoading, isRedirectLoading, loggedInUser, socket }) => {
    const { roomEvent, changeRoomEvent } = useRoomEvents()
    const { playPause } = usePlayPause()
    const [isVideoNotPlaying, setIsVideoNotPlaying] = useState(true)
    const [toggleVolume, setToggleVolume] = useState(true)
    const [currentTime, setCurrentTime] = useState(0)
    const [duration, setDuration] = useState(0)
    const [bufferedRanges, setBufferedRanges] = useState([])
    const [isVideoHovered, setIsVideoHovered] = useState(false)
    const [isSeekbarHovered, setIsSeekbarHovered] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [isPlayLoading, setIsPlayLoading] = useState(false)
    const [isPauseLoading, setIsPauseLoading] = useState(false)
    const [isMobile, setIsMobile] = useState(false)
    const [isMenuVisible, setIsMenuVisible] = useState(false)
    const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 })
    const videoRef = useRef(null) 
    const seekbarRef = useRef(null)
    const { addToast } = useToast()
    const [videoExpanded, setVideoExpanded] = useState(false)
    const [cursorVisible, setCursorVisible] = useState(true)
    
    const handlePlay = (roomId) => {
        if (isPlayLoading) return
        socket.emit("playVideo", { roomId, currentTime: videoRef.current.currentTime })
        setIsPlayLoading(true)
    }

    const handlePause = (roomId) => {
        if (isPauseLoading) return
        socket.emit("pauseVideo", { roomId, currentTime: videoRef.current.currentTime })
        setIsPauseLoading(true)
    }

    const handleVolumeOn = () => {
        setToggleVolume(false)
        videoRef.current.muted = true
    }

    const handleVolumeMute = () => {
        setToggleVolume(true)
        videoRef.current.muted = false
    }

    const handleTimeUpdate = () => {
        const current = videoRef.current.currentTime
        const percent = (current / duration) * 100
        setCurrentTime(current)
        updateSeekbarGradient(percent, percent)
    }

    const handleMetaData = () => {
        setDuration(videoRef.current.duration)
    }

    const handleWaiting = () => {
        setIsLoading(true)
    }

    const handleCanPlay = () => {
        setIsLoading(false)
    }

    const handlePlaying = () => {
        setIsLoading(false)
    }

    const handleVideoClick = () => {
        if (room.owner.every((owner) => owner._id !== loggedInUser._id) && room.admins.every((owner) => owner._id !== loggedInUser._id)) return
        if (isPlayLoading || isPauseLoading) return
        if (isVideoNotPlaying) {
            console.log("play")
            handlePlay(room?._id)
            setTimeout(() => {
                setIsVideoHovered(false)
            }, 3000)
        } else {
            handlePause(room?._id)
            setIsVideoHovered(true)
        }
    }

    const handleVideoMouseLeave = () => {
        if (!isVideoNotPlaying) {
            setIsVideoHovered(false)
        } 
    }

    const handleVideoMouseEnter = () => {
        if (!videoExpanded) {
            setIsVideoHovered(true)
            return
        }
        if (!isVideoNotPlaying) {
            setIsVideoHovered(true)
            setCursorVisible(true)
            setTimeout(() => {
                setIsVideoHovered(false)
                setCursorVisible(false)
            }, 3000)
        } 
    }

    const handleVideoMouseMove = () => {
        if (!videoExpanded) {
            setIsVideoHovered(true)
            return
        }
        if (!isVideoNotPlaying) {
            setIsVideoHovered(true)
            setCursorVisible(true)
            setTimeout(() => {
                setIsVideoHovered(false)
            }, 10000)
        } 
    }

    const handleLargeVideoMouseOver = () => {
        if (!videoExpanded) return
        setIsVideoHovered(true)
        setCursorVisible(true)
    }

    const handleLargeVideoMouseEnter = () => {
        if (!videoExpanded) return
        setIsVideoHovered(true)
        setCursorVisible(true)
    }

    const handleLargeVideoMouseMove = () => {
        if (!videoExpanded) return
        setIsVideoHovered(true)
        setCursorVisible(true)
    }

    const handleSeek = (ev, roomId) => {
        if (room.owner.every((owner) => owner._id !== loggedInUser._id) && room.admins.every((owner) => owner._id !== loggedInUser._id)) return
        const seekTime = (ev.target.value / 100) * duration
        videoRef.current.currentTime = seekTime
        setCurrentTime(seekTime)
        updateSeekbarGradient(ev.target.value, ev.target.value)
        socket.emit('seekVideo', { roomId , seekTime })
    }

    const handleSeekbarHover = (ev) => {
        const seekbarWidth = seekbarRef.current.offsetWidth
        const hoverPosition = ev.nativeEvent.offsetX
        const hoverPercent = (hoverPosition / seekbarWidth) * 100
        updateSeekbarGradient((currentTime / duration) * 100, hoverPercent)
    }

    const handleSeekbarLeave = () => {
        updateSeekbarGradient((currentTime / duration) * 100, (currentTime / duration) * 100)
    }

    const handleProgress = () => {
        const buffered = videoRef.current.buffered
        const ranges = []
        for (let i = 0; i < buffered.length; i++) {
            ranges.push({
                start: buffered.start(i),
                end: buffered.end(i)
            })
        }
        setBufferedRanges(ranges)
    }

    const handleContextMenu = (event) => {
        event.preventDefault()

        // Set the custom menu position
        // setMenuPosition({ x: event.pageX, y: event.pageY })
        // setIsMenuVisible(true)
    }

    const updateSeekbarGradient = (currentPercent, hoverPercent) => {
        const playedColor = 'rgba(255, 255, 255, 1)';  // Played part (solid white)
        const bufferedColor = 'rgba(255, 255, 255, 0.5)'; // Buffered part (semi-transparent white)
        const unplayedColor = 'rgba(255, 255, 255, 0.1)'; // Unplayed part (transparent white)
        const hoverColor = 'rgba(255, 255, 255, 0.5)'; // Hover part (slightly opaque white)
    
        // Start with the played part
        let gradient = `${playedColor} 0%, ${playedColor} ${currentPercent}%, `;
    
        // Add buffered ranges to the gradient
        bufferedRanges.forEach((range) => {
            const startPercent = (range.start / duration) * 100;
            const endPercent = (range.end / duration) * 100;
            if (endPercent > currentPercent) {
                const bufferStart = Math.max(currentPercent, startPercent);
                gradient += `${bufferedColor} ${bufferStart}%, ${bufferedColor} ${endPercent}%, `;
            }
        });
    
        // Add the hover effect
        if (hoverPercent >= currentPercent) {
            gradient += `${hoverColor} ${currentPercent}%, ${hoverColor} ${hoverPercent}%, `;
        }
    
        // Add the unplayed part
        gradient += `${unplayedColor} ${Math.max(currentPercent, hoverPercent)}%, ${unplayedColor} 100%`;
    
        // Apply the gradient to the seek bar
        seekbarRef.current.style.background = `linear-gradient(90deg, ${gradient})`;
    }

    const handleDownload = async () => {
        if (!room?.video?.videoUrl) return
    
        try {
            // Fetch the video data as a blob
            const response = await fetch(room?.video?.videoUrl)
            const blob = await response.blob()
    
            // Create a local object URL for the blob
            const blobUrl = window.URL.createObjectURL(blob)
    
            // For mobile devices, open in a new tab
            const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
            if (isMobile) {
                window.open(blobUrl, '_blank') // Open in a new tab for mobile
            } else {
                // For desktop, create a download link
                const link = document.createElement('a')
                link.href = blobUrl
                link.setAttribute('download', room?.video?.name || 'video.mp4')
        
                // Trigger download
                document.body.appendChild(link)
                link.click()
        
                // Clean up
                document.body.removeChild(link)
            }
            
            window.URL.revokeObjectURL(blobUrl)
        } catch (err) {
            console.error("Error downloading the video:", err)
            addToast("error", "Download Failed")
        }
    }

    const handlePlayingTheVideo = (user, currentTime) => {
        videoRef.current.currentTime = currentTime
        setCurrentTime(currentTime)
        updateSeekbarGradient(((currentTime/duration) * 100), ((currentTime/duration) * 100))
        setIsVideoNotPlaying(false)
        videoRef.current.play()
        setIsPlayLoading(false)
        if (loggedInUser._id === user._id) {
            changeRoomEvent(`Video Playing`)
        } else {
            changeRoomEvent(`${user.username} played the video`)
        }
    }

    const handlePausingTheVideo = (user, currentTime) => {
        videoRef.current.currentTime = currentTime
        setCurrentTime(currentTime)
        updateSeekbarGradient(((currentTime/duration) * 100), ((currentTime/duration) * 100))
        setIsVideoNotPlaying(true)
        videoRef.current.pause()
        setIsPauseLoading(false)
        if (loggedInUser._id === user._id) {
            changeRoomEvent(`Video paused`)
        } else {
            changeRoomEvent(`${user.username} paused the video`)
        }
    }

    const requestFullScreen = (element) => {
        if (element.requestFullscreen) {
            element.requestFullscreen()
        } else if (element.mozRequestFullScreen) { // For Firefox
            element.mozRequestFullScreen()
        } else if (element.webkitRequestFullscreen) { // For Chrome, Safari, and Opera
            element.webkitRequestFullscreen()
        } else if (element.msRequestFullscreen) { // For IE/Edge
            element.msRequestFullscreen()
        }
    }
    
    // To exit full screen
    const exitFullScreen = () => {
        if (document.exitFullscreen) {
            document.exitFullscreen()
        } else if (document.mozCancelFullScreen) { // For Firefox
            document.mozCancelFullScreen()
        } else if (document.webkitExitFullscreen) { // For Chrome, Safari, and Opera
            document.webkitExitFullscreen()
        } else if (document.msExitFullscreen) { // For IE/Edge
            document.msExitFullscreen()
        }
    }

    const handleExpand = () => {
        setVideoExpanded(true)
        requestFullScreen(document.documentElement)  // Request fullscreen on expand

        //alternative method
        //instead of making the entire page to be fullscrren, make the video element only
        // if (videoRef.current) {
        //     requestFullScreen(videoRef.current)  // Request fullscreen for the video element
        // }
    }

    const handleCollapse = () => {
        setVideoExpanded(false)
        exitFullScreen()  // Exit fullscreen on collapse
    }    

    // useEffect(() => {
    //     if (videoRef?.current && room?.video.videoUrl) {
    //         console.log("heall yeah")
    //         setCurrentTime(0)
    //         updateSeekbarGradient(((currentTime/duration) * 100), ((currentTime/duration) * 100))
    //         setIsVideoNotPlaying(true)
    //         console.log("done")
    //     }
    // }, [room?.video?.videoUrl])

    useEffect(() => {
        if (!room?._id) return
        if (!videoRef.current) return
        if (videoRef.current.paused) return 
        if (isLoading) return

        const interval = setInterval(() => {
            if (videoRef.current) {
                socket.emit('syncVideo', {
                    roomId: room._id,
                })
            }
        }, 10000)
    
        return () => clearInterval(interval)
    }, [videoRef?.current?.paused, room?._id, isLoading])

    useEffect(() => {
        if (!room) return
        if (!room?.video?.videoUrl) return
        if (videoRef?.current) {
            if (room?.isPlaying) {
                const lastUpdatedTimestamp = new Date(room?.lastUpdated).getTime()
                const estimatedCurrentTime = room?.currentTime + ((Date.now() - lastUpdatedTimestamp)/1000)
                videoRef.current.currentTime = estimatedCurrentTime
                setCurrentTime(estimatedCurrentTime)
                updateSeekbarGradient(((room?.currentTime/duration) * 100), ((room?.currentTime/duration) * 100))
                setIsVideoNotPlaying(false)
                handleVolumeOn()
                videoRef.current.play()
            } else {
                videoRef.current.currentTime = room?.currentTime
                setCurrentTime(room?.currentTime)
                updateSeekbarGradient(((room?.currentTime/duration) * 100), ((room?.currentTime/duration) * 100))
                setIsVideoNotPlaying(true)
                videoRef.current.pause()
            }
        }
    }, [isUseEffectLoading, isRedirectLoading, videoRef, duration, room?.video?.videoUrl])

    useEffect(() => {
        if (!videoRef) return
        // if (playPause)
        if (playPause.user && (playPause.currentTime !== undefined && playPause.currentTime !== null)) {
            if (playPause.isPlaying) {
                handlePlayingTheVideo(playPause.user, playPause.currentTime)
            } else {
                console.log(playPause, "paused")
                handlePausingTheVideo(playPause.user, playPause.currentTime)
            }
        }
    }, [playPause])

    useEffect(() => {
        const handleSeekingTheVideo = ({ user, seekTime }) => {
            videoRef.current.currentTime = seekTime
            setCurrentTime(seekTime)
            updateSeekbarGradient(((seekTime/duration) * 100), ((seekTime/duration) * 100))
        }

        const handleSyncingTheVideo = ({ currentTime, lastUpdated }) => {
            const lastUpdatedTimestamp = new Date(lastUpdated).getTime()
            const estimatedCurrentTime = currentTime + ((Date.now() - lastUpdatedTimestamp)/1000)
            const timeDifference = Math.abs(videoRef.current.currentTime - estimatedCurrentTime)
            if (timeDifference > 5) {
                videoRef.current.currentTime = estimatedCurrentTime
                setCurrentTime(estimatedCurrentTime)
                updateSeekbarGradient(((estimatedCurrentTime/duration) * 100), ((estimatedCurrentTime/duration) * 100))
            }
        }

        // socket.on("playingTheVideo", handlePlayingTheVideo)
        // socket.on("pausingTheVideo", handlePausingTheVideo)
        socket.on("seekingTheVideo", handleSeekingTheVideo)
        socket.on("syncingTheVideo", handleSyncingTheVideo)

        return () => {
            // socket.off("playingTheVideo", handlePlayingTheVideo)
            // socket.off("pausingTheVideo", handlePausingTheVideo)
            socket.off("seekingTheVideo", handleSeekingTheVideo)
            socket.off("syncingTheVideo", handleSyncingTheVideo)
        }
    }, [socket])

    return (
        <div 
        onMouseEnter={handleVideoMouseEnter} 
        onMouseMove={handleVideoMouseMove} 
        onMouseLeave={handleVideoMouseLeave} 
        className={videoExpanded ? `fixed top-0 left-0 h-screen w-screen z-50` : `h-[26vh] w-full xs:h-[31vh] sm:w-full sm:h-[80vh] sm:rounded-xl lg:w-2/3 lg:h-full lg:rounded-xl relative bg-neutral-900`}>
            <div className={`${ room?.video?.videoUrl ? 'hidden' : 'flex' } gap-4 flex-col items-center justify-center h-full w-full sm:rounded-xl`}>
                <div className='h-[60px] w-[60px] sm:h-[80px] sm:w-[80px] bg-neutral-900 border border-white rounded-full flex items-center justify-center'>
                    <FaVideoSlash className='h-[20px] w-[20px] sm:h-[25px] sm:w-[25px]' />
                </div>
                <div className='font-medium text-[10px] sm:text-[12px]'>NO PLAYING VIDEO</div>
            </div>
            <video 
            ref={videoRef} 
            // onChange={() => handlePlay(room?._id)}
            onClick={handleVideoClick} 
            onLoadedMetadata={handleMetaData} 
            onTimeUpdate={handleTimeUpdate} 
            onProgress={handleProgress}
            onContextMenu={handleContextMenu}
            onWaiting={handleWaiting}
            onCanPlay={handleCanPlay}
            onPlaying={handlePlaying}
            className={`${ !room?.video?.videoUrl ? 'hidden' : 'flex' } ${videoExpanded ? null : 'sm:rounded-xl'} object-cover w-full h-full ${cursorVisible ? 'cursor-pointer' : 'cursor-none'}`} 
            src={room?.video?.videoUrl}
            controls={false}>
            </video>
            {isLoading || isPlayLoading || isPauseLoading ? (
                <div className={`absolute inset-0 flex items-center justify-center ${cursorVisible ? 'cursor-pointer' : 'cursor-none'} bg-black bg-opacity-50 ${videoExpanded ? null : 'sm:rounded-xl'}`}>
                    <div className='big-loader'></div>
                </div>
            ) : (room?.video?.videoUrl && videoRef && isVideoNotPlaying && !isLoading && !isPlayLoading && !isPauseLoading) ? (
                <div 
                onClick={handleVideoClick} 
                onMouseOver={handleLargeVideoMouseOver}
                onMouseMove={handleLargeVideoMouseMove}
                onMouseEnter={handleLargeVideoMouseEnter}
                className={`absolute inset-0 flex items-center justify-center ${cursorVisible ? 'cursor-pointer' : 'cursor-none'} bg-black bg-opacity-50 ${videoExpanded ? null : 'sm:rounded-xl'}`}>
                    <FaPlay className='h-[30px] w-[30px]' />
                </div>
            ) : null}
            <div className={`${ !room?.video?.videoUrl ? 'hidden' : 'flex' } absolute bottom-0 w-full px-2 pb-5 flex-col gap-4 ${isVideoHovered ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`}>
                <input ref={seekbarRef} type="range" className={`video-seekbar ${isSeekbarHovered ? 'thumb-visible' : 'thumb-hidden'}`}  
                    min={0} 
                    max={100} 
                    value={(currentTime/duration) * 100 || 0} 
                    onChange={(ev) => handleSeek(ev, room?._id)}
                    onMouseMove={(ev) => {
                        handleSeekbarHover(ev)
                        setIsSeekbarHovered(true) 
                    }}
                    onMouseLeave={() => {
                        handleSeekbarLeave()
                        setIsSeekbarHovered(false)
                    }}
                    step={0.1} />
                <div className={`${ !room?.video?.videoUrl ? 'hidden' : 'flex' } items-center justify-between px-5 opacity-100`}>
                    <div className='flex items-center gap-4'>
                    {(room.owner.some((owner) => owner._id === loggedInUser._id) || room.admins.some((owner) => owner._id === loggedInUser._id)) && (
                        <>
                            <div onClick={() => handlePlay(room?._id)} className={`${isVideoNotPlaying ? 'flex' : 'hidden'} items-center justify-center cursor-pointer hover:scale-110 transition-all duration-300 ease-in-out`}>
                                {isPlayLoading ? (
                                    <div className='loader'></div>
                                ) : (
                                    <FaPlay className='h-[16px] w-[16px] xs:h-[25px] xs:w-[25px]' />
                                )}
                            </div>   
                            <div onClick={() => handlePause(room?._id)} className={`${!isVideoNotPlaying ? 'flex' : 'hidden'} items-center justify-center cursor-pointer hover:scale-110 transition-all duration-300 ease-in-out`}>
                                {isPauseLoading ? (
                                    <div className='loader'></div>
                                ) : (
                                    <FaPause className='h-[16px] w-[16px] xs:h-[25px] xs:w-[25px]' />
                                )}
                            </div>
                        </>
                    )}
                        <div onClick={handleVolumeOn} className={`${toggleVolume ? 'flex' : 'hidden'} scale-110 items-center justify-center cursor-pointer hover:scale-125 transition-all duration-300 ease-in-out`}>
                            <FaVolumeDown className='h-[16px] w-[16px] xs:h-[25px] xs:w-[25px]' />
                        </div>
                        <div onClick={handleVolumeMute} className={`${!toggleVolume ? 'flex' : 'hidden'} scale-110 items-center justify-center cursor-pointer hover:scale-125 transition-all duration-300 ease-in-out`}>
                            <FaVolumeMute className='h-[16px] w-[16px] xs:h-[25px] xs:w-[25px]' />
                        </div>
                        <div  className={`flex items-center justify-center gap-1 font-semibold`}>
                            <div className='text-xs xs:text-base w-6 xs:w-8'>{formatTime(currentTime)}</div><div className='text-xs xs:text-base'>/</div><div className='text-xs xs:text-base w-6 xs:w-8'>{formatTime(duration)}</div>
                        </div>
                    </div>
                    <div className='flex items-center gap-4'>
                        <div onClick={handleDownload} className='flex items-center justify-center cursor-pointer hover:scale-110 transition-all duration-300 ease-in-out'>
                            <FaDownload className='h-[16px] w-[16px] xs:h-[25px] xs:w-[25px]' />
                        </div>
                        {videoExpanded ? (
                            <div onClick={handleCollapse} className='flex items-center justify-center cursor-pointer hover:scale-110 transition-all duration-300 ease-in-out'>
                                <FaCompress className='h-[16px] w-[16px] xs:h-[25px] xs:w-[25px]' />
                            </div>
                        ) : (
                            <div onClick={handleExpand} className='flex items-center justify-center cursor-pointer hover:scale-110 transition-all duration-300 ease-in-out'>
                                <FaExpand className='h-[16px] w-[16px] xs:h-[25px] xs:w-[25px]' />
                            </div>
                        )}
                        
                    </div>
                </div>
            </div>
        </div>
    )
}

export default VideoPlayer
