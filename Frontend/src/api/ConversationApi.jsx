import { useMutation, useQuery } from "react-query"
import { useToast } from "../contexts/ToastContext"
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || ''

export const useGetConversation = (conversationId) => {
    const { addToast } = useToast()

    const useGetConversationRequest = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/conversation/${conversationId}`, {
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

    const { data: conversation, isConversationLoading } = useQuery('getConversation', useGetConversationRequest, {
        enabled: !!conversationId
    })

    return { conversation, isConversationLoading }
}

export const useGetSeenStatuses = (conversationId) => {
    const { addToast } = useToast()
  
    const fetchSeenStatuses = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/conversation/${conversationId}/seen-statuses`, {
                credentials: 'include',
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
            addToast("error", err.message === "Failed to fetch" ? "Network Error" : err.message)
        }
    }
    
    const { data: seenStatuses, isLoading: isSeenStatusesLoading } = useQuery(
        ['getSeenStatuses', conversationId], 
        fetchSeenStatuses,
        { enabled: !!conversationId } // only fetch if conversationId is available
    )
  
    return { seenStatuses, isSeenStatusesLoading }
  }
  

export const useSendMessage = () => {
    const { addToast } = useToast()

    const sendMessageRequest = async (payload) => {
        try {
            if (!payload.conversationId) {
                throw new Error("Cannot get Room")
            }

            const response = await fetch(`${API_BASE_URL}/api/conversation/${payload.conversationId}/send-message`, {
                method: "POST",
                credentials: 'include',
                body: payload.formData
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

    const { mutateAsync: sendMessage, isLoading: isSendMessageLoading } = useMutation(sendMessageRequest)
    
    return {
        sendMessage,
        isSendMessageLoading
    }
}