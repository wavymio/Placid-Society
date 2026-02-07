import { useMutation, useQuery } from "react-query"
import { useToast } from "../contexts/ToastContext"
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || ''

export const useGetUser = (userId) => {
    const { addToast } = useToast()

    const useGetUserRequest = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/user/${userId}`, {
                credentials: 'include'
            })
    
            if (!response.ok) {
                const error = await response.json()
                console.log(error)
                throw new Error(error.error)
            }

            const data = await response.json()
            return data
        } catch (err) {
            console.log(err)
            addToast("error", (err.message === "Failed to fetch" ? "Network Error" : err.message))
        }
    }

    const { data: user, isLoading } = useQuery(['getUser', userId], useGetUserRequest, {
        enabled: !!userId
    })

    return { user, isLoading }
}

export const useAddFriend = () => {
    const { addToast } = useToast()

    const addFriendRequest = async (requestDetails) => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/user/add-friend`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                credentials: "include",
                body: JSON.stringify(requestDetails)
            })

            if (!response.ok) {
                const error = await response.json()
                console.log(error)
                throw new Error(error.error)
            }

            const data = await response.json()
            if (data.success) {
                // addToast("success", data.success)
                return data
            }
        } catch (err) {
            console.log(err)
            addToast("error", (err.message === "Failed to fetch" ? "Network Error" : err.message))
        }
    }

    const { mutateAsync: sendFriendRequest, isLoading } = useMutation(addFriendRequest)

    return { sendFriendRequest, isLoading }
}

export const useCancelFriend = () => {
    const { addToast } = useToast()

    const cancelFriendApiRequest = async (requestDetails) => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/user/cancel-friend`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                credentials: "include",
                body: JSON.stringify(requestDetails)
            })

            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.error)
            }

            const data = await response.json()
            if (data.success) {    
                // addToast("success", data.success)
                return data
            }

        } catch (err) {
            console.log(err)
            addToast("error", (err.message === "Failed to fetch" ? "Network Error" : err.message))
        }
    }

    const { mutateAsync: cancelFriendRequest, isLoading } = useMutation(cancelFriendApiRequest)

    return { cancelFriendRequest, isLoading }
}

export const useAcceptFriend = () => {
    const { addToast } = useToast()

    const acceptFriendApiRequest = async (requestDetails) => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/user/accept-friend`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                credentials: "include",
                body: JSON.stringify(requestDetails)
            })

            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.error)
            }

            const data = await response.json()
            if (data.success) {    
                // addToast("success", data.success)
                return data
            }

        } catch (err) {
            console.log(err)
            addToast("error", (err.message === "Failed to fetch" ? "Network Error" : err.message))
        }
    }

    const { mutateAsync: acceptFriendRequest, isLoading } = useMutation(acceptFriendApiRequest)

    return { acceptFriendRequest, isLoading }
}

export const useRejectFriend = () => {
    const { addToast } = useToast()

    const rejectFriendApiRequest = async (requestDetails) => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/user/reject-friend`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                credentials: "include",
                body: JSON.stringify(requestDetails)
            })

            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.error)
            }

            const data = await response.json()
            if (data.success) {    
                addToast("success", data.success)
                return data
            }

        } catch (err) {
            console.log(err)
            addToast("error", (err.message === "Failed to fetch" ? "Network Error" : err.message))
        }
    }

    const { mutateAsync: rejectFriendRequest, isLoading } = useMutation(rejectFriendApiRequest)

    return { rejectFriendRequest, isLoading }
}

export const useUnfriend = () => {
    const { addToast } = useToast()

    const unfriendApiRequest = async (requestDetails) => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/user/unfriend`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                credentials: "include",
                body: JSON.stringify(requestDetails)
            })

            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.error)
            }

            const data = await response.json()
            if (data.success) {    
                // addToast("success", data.success)
                return data
            }

        } catch (err) {
            console.log(err)
            addToast("error", (err.message === "Failed to fetch" ? "Network Error" : err.message))
        }
    }

    const { mutateAsync: unfriendRequest, isLoading } = useMutation(unfriendApiRequest)

    return { unfriendRequest, isLoading }
}