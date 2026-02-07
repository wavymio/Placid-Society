import { useMutation, useQuery, useQueryClient } from "react-query"
import { useToast } from "../contexts/ToastContext"
import { useRef, useState } from "react"
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || ''

export const useGetMyVideos = () => {
    const { addToast } = useToast()

    const getMyVideosRequest = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/my/videos`, {
                credentials: 'include'
            })

            if (!response.ok) {
                if (response.status === 500) {
                    const error = await response.json()
                    addToast("error", error.error)
                }
                throw new Error()
            }

            const data = await response.json()
            return data

        } catch (err) {
            console.log(err)
            if (err.message === "Failed to fetch") {
                addToast("error", "Network Error")
            }
        }
    }

    const { data: myVideos, isLoading: areMyVideosLoading } = useQuery('getMyVideos', getMyVideosRequest)

    return {
        myVideos,
        areMyVideosLoading
    }
}

export const useUploadMyVideo = () => {
    const { addToast } = useToast()
    const [uploadProgress, setUploadProgress] = useState(0) // Track progress
    const [isLoading, setIsLoading] = useState(false)
    const xhrRef = useRef(null)

    const uploadMyVideoRequest = async (videoDetails, onProgress) => {
        return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest()
            xhrRef.current = xhr 
            xhr.open("POST", `${API_BASE_URL}/api/my/videos/upload`)
            xhr.withCredentials = true

            // Track upload progress
            xhr.upload.onprogress = (event) => {
                if (event.lengthComputable) {
                    const percentage = Math.round((event.loaded * 100) / event.total)
                    setUploadProgress(percentage) // Update state with progress
                    if (onProgress) onProgress(percentage)
                }
            }

            xhr.onload = () => {
                setIsLoading(false)
                setUploadProgress(0)
                if (xhr.status >= 200 && xhr.status < 300) {
                    const response = JSON.parse(xhr.responseText)
                    if (response.success) {
                        addToast("success", response.success)
                        resolve(response)
                    } else {
                        addToast("error", "Upload failed")
                        reject(new Error("Upload failed"))
                    }
                } else {
                    addToast("error", xhr.statusText)
                    reject(new Error(xhr.statusText))
                }
            }

            xhr.onerror = () => {
                setUploadProgress(0)
                setIsLoading(false)
                addToast("error", "Network Error")
                reject(new Error("Network Error"))
            }

            setIsLoading(true)
            xhr.send(videoDetails)
        })
    }

    const cancelUpload = async () => {
        if (xhrRef.current) {
            await xhrRef.current.abort()
            xhrRef.current = null
            setIsLoading(false)
            setUploadProgress(0)
            addToast("success", "Upload canceled")
        }
    }

    const { mutateAsync: uploadVideo } = useMutation(uploadMyVideoRequest)

    return { uploadVideo, isLoading, uploadProgress, cancelUpload }
}