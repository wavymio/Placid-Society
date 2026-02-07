import { useAuth } from '../contexts/AuthContext'
import { useGetMyVideos, useUploadMyVideo } from '../api/MyVideoApi'
import React, { useRef, useState } from 'react'
import { FaVideo, FaVideoSlash } from "react-icons/fa"
import { IoClose } from 'react-icons/io5'
import { RiVideoUploadFill } from "react-icons/ri"
import { useQueryClient } from 'react-query'
import { Link } from 'react-router-dom'
import { useToast } from '../contexts/ToastContext'
import VideoList from '../components/VideoList'

const MyVideos = () => {
    const queryClient = useQueryClient()
    const { addToast } = useToast()
    const { loggedInUser, isLoading: isAuthLoading } = useAuth()
    const { areMyVideosLoading, myVideos } = useGetMyVideos()
    const { uploadVideo, isLoading, uploadProgress, cancelUpload } = useUploadMyVideo()
    const fileInputRef = useRef(null)
    const [videoName, setVideoName] = useState('')
    const [videoThumbnail, setVideoThumbnail] = useState(null)
    const [thumbnailPreview, setThumbnailPreview] = useState(null)
    const [videoDuration, setVideoDuration] = useState(null)
    const [selectedFile, setSelectedFile] = useState(null)
    const videoRef = useRef(null)
    const canvasRef = useRef(null) 

    const handleFileChange = (ev) => {
        const file = ev.target.files[0]
        if (file) {
            setSelectedFile(file)
            setVideoName(file.name)
            generateThumbnail(file)
        }
    }

    const handleVideoNameChange = (ev) => {
        let inputName = ev.target.value.trim()
        const extension = selectedFile.name.split('.').pop()

        if (!inputName.endsWith(`.${extension}`)) {
            inputName = `${inputName.split('.')[0]}.${extension}`
        }

        setVideoName(inputName)
    }

    const generateThumbnail = (file) => {
        const videoElement = videoRef.current
        const canvasElement = canvasRef.current

        videoElement.src = URL.createObjectURL(file)

        videoElement.onloadedmetadata = () => {
            if (file.type === 'video/webm' || isNaN(videoElement.duration)) {
                // console.warn('Handling .webm file or NaN duration. Defaulting to start of the video.')
                videoElement.currentTime = 0 // Fallback to the beginning of the video
            } else {
                videoElement.currentTime = Math.floor(videoElement.duration / 2)
            }
            setVideoDuration(videoElement.duration)
        }

        videoElement.onseeked = () => {
            const ctx = canvasElement.getContext('2d')
            canvasElement.width = videoElement.videoWidth
            canvasElement.height = videoElement.videoHeight

            ctx.drawImage(videoElement, 0, 0, canvasElement.width, canvasElement.height)
            canvasElement.toBlob((blob) => {
                const thumbnailFile = new File([blob], "thumbnail.png", { type: 'image/png' });
                setVideoThumbnail(thumbnailFile) 
                setThumbnailPreview(URL.createObjectURL(thumbnailFile)) // Preview URL
            }, 'image/png')
        }
    }

    const handleThumbnailChange = (ev) => {
        const file = ev.target.files[0]
        if (file) {
            setVideoThumbnail(file)
            setThumbnailPreview(URL.createObjectURL(file))
        }
    }

    const handleUpload = async () => {
        if (isLoading || !selectedFile || !videoName || !videoDuration) {
            console.log("gotcha")
            return
        }

        if (videoName.length > 50) {
            addToast("error", "Name is too long")
            return
        }

        const formData = new FormData()
        formData.append('video', selectedFile)
        formData.append('coverPhoto', videoThumbnail)
        formData.append('videoName', videoName)
        formData.append('videoDuration', videoDuration)
        formData.append('videoSize', selectedFile.size)
        formData.append('videoFormat', selectedFile.type)

        const res =  await uploadVideo(formData, (progress) => {
            console.log(`Upload progress: ${progress}%`)
        })

        if (res.success) {
            setVideoName('')
            setVideoThumbnail(null)
            setThumbnailPreview(null)
            setVideoDuration(null)
            setSelectedFile(null)

            if (fileInputRef.current) {
                fileInputRef.current.value = ''
            }

            await queryClient.invalidateQueries('getMyVideos')
        }
    }

    const handleCancelUpload = async () => {
        await cancelUpload()
    }

    const [tab, setTab] = useState("myVideos")

    const changeTabs = (tabName) => {
        setTab(tabName)
    }

    const formatTime = (time) => {
        const hours = Math.floor(time / 3600)
        const minutes = Math.floor((time % 3600) / 60)
        const seconds = Math.floor(time % 60)
        return `${hours > 0 ? `${hours}:` : ''}${minutes}:${seconds < 10 ? '0' : ''}${seconds}`
    }

    if (isAuthLoading) {
        return (
            <div className='w-full h-[450px] flex items-center justify-center'>
                <div className='big-loader'></div>
            </div>
        )
    }

    return (
        <div className='w-full flex flex-col justify-center gap-9 sm:gap-14'>
            <div className='w-full flex flex-col items-center justify-center gap-5 xs:px-0 sm:px-10'>
                <div className='flex flex-col items-center gap-2'>
                    <div
                    style={{
                        backgroundImage: isLoading ? `conic-gradient(
                            #f87171 ${uploadProgress * 3.6}deg,
                            transparent 0
                        )` : null,
                    }} 
                    className={`${isLoading ? null : 'border-1'} relative flex items-center justify-center h-14 w-14 sm:h-20 sm:w-20 rounded-full p-1 bg-neutral-900 hover:bg-neutral-800 transition-colors ease-in-out duration-300`}>
                    {videoThumbnail ? (
                        <>
                            <img 
                            src={thumbnailPreview} 
                            alt="Video Thumbnail" 
                            className="h-full w-full rounded-full object-cover"
                            />
                            {isLoading ? (
                                <div onClick={handleCancelUpload} className='flex items-center justify-center black-opacity absolute top-0 left-0 rounded-full h-full w-full cursor-pointer'>
                                    <IoClose style={{ color: 'white', fontSize: '30px' }} />
                                </div>
                            ) : (
                                <input type="file" accept="image/*" onChange={handleThumbnailChange} className='absolute top-0 left-0 rounded-full h-full w-full cursor-pointer opacity-0' />
                            )}
                        </>
                    ) : (
                        <FaVideo style={{ color: 'white', fontSize: '25px' }} />
                    )}
                    </div>
                    <span className='text-xs text-center text-white'>{videoName || "Video Name..."}</span>
                    {isLoading && (
                        <div className='w-full flex items-center justify-center mt-1'>
                            <div className='text-white text-xs font-semibold'>
                                Upload Progress: {uploadProgress}% / 100%
                            </div>
                        </div>
                    )}
                </div>
                
                <div className='w-full flex flex-col gap-6'>
                    <div className='xs:px-40 flex items-center justify-center gap-5 w-full'>
                        <div className='relative'>
                            <div className={`cursor-pointer bg-neutral-900 border border-white flex justify-center whitespace-nowrap px-2 py-4 items-center h-10 w-24 xs:w-32 xs:h-auto rounded-lg font-semibold text-xs sm:text-sm hover:bg-neutral-950 transition-colors ease-in-out duration-300`}>Choose Video</div>
                            <input type="file" ref={fileInputRef} accept='video/*, .mkv' onChange={handleFileChange} className='absolute z-10 top-0 left-0 cursor-pointer px-2 py-4 h-10 w-24 xs:h-auto xs:w-32 rounded-lg opacity-0' />
                        </div>
                        
                        <div className='w-full hidden lg:flex items-center'>
                            <input 
                            type="text" 
                            placeholder='Edit Video Name'
                            value={videoName}
                            onChange={handleVideoNameChange}
                            className='w-full p-3 rounded-lg border border-neutral-800 bg-inherit focus:outline-none focus:ring-1 focus:ring-neutral-800 placeholder-neutral-200 placeholder:text-sm' />
                        </div>

                        <div onClick={handleUpload} className={`cursor-pointer bg-neutral-900 border border-white flex items-center justify-center gap-2 whitespace-nowrap px-2 py-4 h-10 w-24 xs:w-32 xs:h-auto rounded-lg font-semibold text-xs sm:text-sm hover:bg-neutral-950 transition-colors ease-in-out duration-300`}>
                            <span>Upload</span>
                            <RiVideoUploadFill style={{ color: 'white', fontSize: '20px' }} />
                        </div>
                    </div>
                    <div className='lg:hidden flex'>
                        <input 
                            type="text" 
                            placeholder='Edit Video Name'
                            value={videoName}
                            onChange={handleVideoNameChange}
                            className='text-xs sm:text-base h-auto xs:h-12 sm:h-auto w-full p-3 rounded-lg border border-neutral-800 bg-inherit focus:outline-none focus:ring-1 focus:ring-neutral-800 placeholder-neutral-200 placeholder:text-sm sm:placeholder:text-sm'
                        />
                    </div>
                </div>
            </div>

            <div className='flex flex-col gap-9'>
                <div className='flex flex-col items-center justify-center w-full sm:px-0 md:px-16 lg:px-60 mt-0 sm:mt-2'>
                    <div className='px-10 flex items-center justify-center gap-1 xs:gap-5 sm:gap-10 border-b-1 border-neutral-800 w-3/4'>
                        <div className={`w-36 cursor-pointer hidden sm:flex whitespace-nowrap justify-center pb-3 text-xs font-semibold transition-colors ease-in-out duration-300 ${tab === "myVideos" ? "border-b-2 border-white" : "text-neutral-400"}`} onClick={() => changeTabs("myVideos")}>
                            MY VIDEOS
                        </div>
                        <div className={`w-36 px-2 cursor-pointer flex sm:hidden whitespace-nowrap justify-center pb-3 text-xs font-semibold transition-colors ease-in-out duration-300 ${tab === "myVideos" ? "border-b-2 border-white" : "text-neutral-400"}`} onClick={() => changeTabs("myVideos")}>
                            UPLOADED
                        </div>
                        <div className={`w-36 cursor-pointer hidden sm:flex whitespace-nowrap justify-center pb-3 text-xs font-semibold transition-colors ease-in-out duration-300 ${tab === "savedVideos" ? "border-b-2 border-white" : "text-neutral-400"}`} onClick={() => changeTabs("savedVideos")}>
                            SAVED VIDEOS
                        </div>
                        <div className={`w-36 px-2 cursor-pointer flex sm:hidden whitespace-nowrap justify-center pb-3 text-xs font-semibold transition-colors ease-in-out duration-300 ${tab === "savedVideos" ? "border-b-2 border-white" : "text-neutral-400"}`} onClick={() => changeTabs("savedVideos")}>
                            SAVED
                        </div>
                        <div className={`w-36 cursor-pointer hidden sm:flex whitespace-nowrap justify-center pb-3 text-xs font-semibold transition-colors ease-in-out duration-300 ${tab === "downloads" ? "border-b-2 border-white" : "text-neutral-400"}`} onClick={() => changeTabs("downloads")}>
                            DOWNLOADS
                        </div>
                        <div className={`w-36 px-2 cursor-pointer flex sm:hidden whitespace-nowrap justify-center pb-3 text-xs font-semibold transition-colors ease-in-out duration-300 ${tab === "downloads" ? "border-b-2 border-white" : "text-neutral-400"}`} onClick={() => changeTabs("downloads")}>
                            DOWNLOADS
                        </div>
                    </div>
                </div>
                
                {tab === "myVideos" ? (
                    <VideoList videos={myVideos} areVideosLoading={areMyVideosLoading} tab={"myVideos"} formatTime={formatTime} />
                ) : tab === "savedVideos" ? (
                    <VideoList videos={loggedInUser?.savedVideos} areVideosLoading={areMyVideosLoading} tab={"savedVideos"} formatTime={formatTime} />
                ) : (
                    <VideoList videos={loggedInUser?.downloads} areVideosLoading={areMyVideosLoading} tab={"downloads"} formatTime={formatTime} />
                )}
                
            </div>

            <video ref={videoRef} style={{ display: 'none' }} />
            <canvas ref={canvasRef} style={{ display: 'none' }} />
        </div>
    )
}

export default MyVideos
