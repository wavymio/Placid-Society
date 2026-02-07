import { useMutation, useQuery } from "react-query"
import { useToast } from "../contexts/ToastContext"
import { json } from "react-router-dom"
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || ''

export const getCurrentCityRoles = () => {
    const { addToast } = useToast()

    const getCurrentCityRolesRequest = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/city/roles`, {
                method: 'GET',
                credentials: "include",
                headers: {
                    "Content-Type": "application/json"
                }
            })

            if (!response.ok) {
                try {
                    const error = await response.json()
                    throw new Error(error?.error || "An unknown error occurred")
                } catch (jsonErr) {
                    // Fallback if response body isn't JSON
                    throw new Error(response.statusText)
                }
            }

            const data = await response.json()
            return data
        } catch (err) {
            console.error(err)
            if (err.message !== "Unauthorized") {
                addToast("error", err.message === "Failed to fetch" ? "Poor Internet Connection" : err.message)
            }
        }
    }

    const { data: currentCityRoles, isLoading: isGetCountryCitiesRolesLoading, isFetching: isGetCountryCitiesRolesFetching } = useQuery("getCurrentCityRoles", getCurrentCityRolesRequest, {
        retry: false
    })

    return {
        currentCityRoles, isGetCountryCitiesRolesFetching, isGetCountryCitiesRolesLoading
    }
}

export const getContinents = () => {
    const { addToast } = useToast()

    const getContinentsRequest = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/map/continents`, {
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

    const { data:continents, isFetching: isGetContinentsFetching, isLoading: isGetContinentsLoading, isError: didGetContinentsFail, isFetched } = useQuery('getContinents', getContinentsRequest)

    return { continents,isGetContinentsFetching, isGetContinentsLoading, didGetContinentsFail, isFetched }
}

export const getCountries = () => {
    const { addToast } = useToast()

    const getCountriesRequest = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/map/countries`, {
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

    const { data:countries, isFetching: isGetCountriesFetching, isLoading: isGetCountriesLoading, isError: didGetCountriesFail, isFetched } = useQuery('getCountries', getCountriesRequest)

    return { countries, isGetCountriesFetching, isGetCountriesLoading, didGetCountriesFail, isFetched }
}

export const getCities = () => {
    const { addToast } = useToast()

    const getCitiesRequest = async (continentIds) => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/map/cities`, {
                method: 'POST',
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(continentIds)
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

    const { mutateAsync: fetchCities, isLoading: isGetCitiesLoading } = useMutation(getCitiesRequest)

    return { fetchCities, isGetCitiesLoading }
}

export const useCurrentCity = () => {
    const { addToast } = useToast()

    const getCurrentCityRequest = async (cityId) => {
        if (!cityId) return
        try {
            const response = await fetch(`${API_BASE_URL}/api/city/${cityId}`, {
                method: 'GET',
                headers: {
                    "Content-Type": "application/json"
                },
                credentials: 'include'
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

    const { mutateAsync: fetchCity, isLoading: isGetCurrentCityLoading } = useMutation(getCurrentCityRequest)

    return { fetchCity, isGetCurrentCityLoading }
}