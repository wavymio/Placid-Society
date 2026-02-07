import { useMutation, useQuery } from "react-query"
import { useToast } from "../contexts/ToastContext"
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || ''

// { cityId, plotId, layers }


export const useGetPlots = () => {
    const { addToast } = useToast()

    const getPlotsRequest = async (payload) => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/plot/retrieve`, {
                method: 'POST',
                headers: {
                    "Content-Type": "application/json"
                },
                credentials: "include",
                body: JSON.stringify(payload)
            })

            if (!response.ok) {
                try {
                    const error = await response.json()
                    throw new Error(error?.error || "An unknown error occurred")
                } catch (jsonErr) {
                    // Fallback if response body isn't JSON
                    throw new Error(`Error ${response.status}: ${response.statusText}`)
                }
            }

            const data = await response.json()
            return data
        } catch (err) {
            console.error(err)
            addToast("error", err.message === "Failed to fetch" ? "Poor Internet Connection" : err.message)
        }
    }

    const { mutateAsync: getPlots, isLoading: isGetPlotsLoading } = useMutation(getPlotsRequest)

    return { getPlots, isGetPlotsLoading }
}

export const useCreatePlot = () => {
    const { addToast } = useToast()

    const createPlotRequest = async (payload) => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/plot/create`, {
                method: 'POST',
                headers: {
                    "Content-Type": "application/json"
                },
                credentials: "include",
                body: JSON.stringify(payload)
            })

            if (!response.ok) {
                try {
                    const error = await response.json()
                    throw new Error(error?.error || "An unknown error occurred")
                } catch (jsonErr) {
                    // Fallback if response body isn't JSON
                    throw new Error(`Error ${response.status}: ${response.statusText}`)
                }
            }

            const data = await response.json()
            return data
        } catch (err) {
            console.error(err)
            addToast("error", err.message === "Failed to fetch" ? "Poor Internet Connection" : err.message)
        }
    }

    const { mutateAsync: createPlot, isLoading: isCreatePlotLoading } = useMutation(createPlotRequest)

    return { createPlot, isCreatePlotLoading }
}

export const useHandleActions = () => {
    const { addToast } = useToast()

    const sendActionRequest = async (payload) => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/plot/actions`, {
                method: 'POST',
                headers: {
                    "Content-Type": "application/json"
                },
                credentials: "include",
                body: JSON.stringify(payload)
            })

            if (!response.ok) {
                try {
                    const error = await response.json()
                    throw new Error(error?.error || "An unknown error occurred")
                } catch (jsonErr) {
                    // Fallback if response body isn't JSON
                    throw new Error(`Error ${response.status}: ${response.statusText}`)
                }
            }

            const data = await response.json()
            return data
        } catch (err) {
            console.error(err)
            addToast("error", err.message === "Failed to fetch" ? "Poor Internet Connection" : err.message)
        }
    }

    const { mutateAsync: sendAction, isLoading: isSendActionLoading } = useMutation(sendActionRequest)

    return { sendAction, isSendActionLoading }
}