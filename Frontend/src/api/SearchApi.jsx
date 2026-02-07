import { useMutation } from "react-query"
import { useToast } from "../contexts/ToastContext"
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || ''

export const useSearchUsernamesAndRooms = () => {
    const { addToast } = useToast()

    const searchUsernamesAndRoomsRequest = async (searchInput) => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/search`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({searchInput})
            })
    
            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.error)
            }
    
            const data = await response.json()
            return data
        } catch (err) {
            addToast("error", (err.message === "Failed to fetch" ? "Network Error" : err.message))
        }
    }

    const { mutateAsync: searchUsersandRooms, isLoading } = useMutation(searchUsernamesAndRoomsRequest)

    return {
        searchUsersandRooms,
        isLoading
    }
}

export const useSearchUsernameForInvite = () => {
    const { addToast } = useToast()

    const searchUsernameForInviteRequest = async (payload) => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/search/username-for-invite`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                credentials: "include",
                body: JSON.stringify(payload)
            })
    
            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.error)
            }
    
            const data = await response.json()
            return data
        } catch (err) {
            addToast("error", (err.message === "Failed to fetch" ? "Network Error" : err.message))
        }
    }

    const { mutateAsync: searchUsersForInvite, isLoading } = useMutation(searchUsernameForInviteRequest)

    return {
        searchUsersForInvite,
        isLoading
    }
}

export const useSearchForVideos = () => {
    const { addToast } = useToast()

    const searchForVideosRequest = async (searchInput) => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/search/videos`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                credentials: 'include',
                body: JSON.stringify({searchInput})
            })
    
            if (!response.ok) {
                const error = await response.json()
                console.log(error)
                throw new Error(error.error)
            }
    
            const data = await response.json()
            return data
        } catch (err) {
            addToast("error", (err.message === "Failed to fetch" ? "Network Error" : err.message))
        }
    }

    const { mutateAsync: searchForVideos, isLoading: isSearchForVideosLoading } = useMutation(searchForVideosRequest)

    return {
        searchForVideos,
        isSearchForVideosLoading
    }
}