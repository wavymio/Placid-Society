import { useMutation, useQuery } from "react-query"
import { useToast } from "../contexts/ToastContext"
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || ''

export const getCityUsers = () => {
    const { addToast } = useToast()

    const getCityUsersRequest = async (payload) => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/city/users`, {
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

    const { mutateAsync: fetchCityUsers, isLoading: isGetCityUsersLoading } = useMutation(getCityUsersRequest)

    return { fetchCityUsers, isGetCityUsersLoading }
}

export const getCityEntities = () => {
    const { addToast } = useToast()

    const getCityEntitiesRequest = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/city/entities`, {
                method: 'GET',
                headers: {
                    "Content-Type": "application/json"
                },
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

    const { mutateAsync: fetchCityEntities, isLoading: isGetCityEntitiesLoading } = useMutation(getCityEntitiesRequest)

    return { fetchCityEntities, isGetCityEntitiesLoading }
}