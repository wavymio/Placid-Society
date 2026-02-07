import { useMutation, useQueryClient } from "react-query"
import { useToast } from "../contexts/ToastContext"
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || ''

export const useMarkMyNotifications = () => {
    const { addToast } = useToast()
    const queryClient = useQueryClient()

    const markMyNotificationsRequest = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/my/notifications`, {
                method: "PATCH",
                credentials: 'include',
            })
    
            if (!response.ok) {  
                throw new Error()
            }
            
            const data = await response.json()
            if (data.success) {
                await queryClient.invalidateQueries('validateUser')
            }
        } catch (err) {
            addToast("error", (err.message === "Failed to fetch" ? "Network Error" : err.message))
        }
    }

    const { mutateAsync: markNotifications } = useMutation(markMyNotificationsRequest)

    return { markNotifications }
}