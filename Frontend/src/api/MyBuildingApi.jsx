import { useMutation, useQuery } from "react-query"
import { useToast } from "../contexts/ToastContext"
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || ''

export const useGetMyBuildingRequests = () => {
    const { addToast } = useToast()

    const getMyBuildingRequestsRequest = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/my/buildings/requests`, {
                method: 'GET',
                headers: {
                    "Content-Type": "application/json"
                },
                credentials: "include"
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
            addToast("error", err.message === "Failed to fetch" ? "Poor Internet Connection" : err.message)
        }
    }

    const { data:buildingRequestsData, isError: didBuildingRequestsFail, isLoading: isBuildingRequestsLoading, isFetching: isBuildingRequestsFetching } = useQuery("getMyBuildingRequests", getMyBuildingRequestsRequest, {
        retry: false
    })

    return { buildingRequestsData, didBuildingRequestsFail, isBuildingRequestsLoading, isBuildingRequestsFetching }
}

export const useCreateMyBuildingDesign = () => {
    const { addToast } = useToast()

    const createMyBuildingDesign = async (designDetails) => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/my/buildings/request`, {
                body: designDetails,
                credentials: "include",
                method: 'POST'
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
            if (data.success) {
                addToast("success", data.success)
                return data
            } 
        } catch (err) {
            console.error(err)
            addToast("error", err.message === "Failed to fetch" ? "Poor Internet Connection" : err.message)
        }
    }

    const { mutateAsync: createBuildingDesign, isLoading: isBuildingDesignCreating } = useMutation(createMyBuildingDesign)
    
    return {
        createBuildingDesign,
        isBuildingDesignCreating
    }
}

export const useDenyBuildingDesign = () => {
    const { addToast } = useToast()

    const denyBuildingDesignRequest = async (designDetails) => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/buildings/deny-request`, {
                body: JSON.stringify(designDetails),
                headers: {
                    "Content-Type": "application/json"
                },
                credentials: "include",
                method: 'PATCH'
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
            if (data.success) {
                addToast("success", data.success)
                return data
            }
        } catch (err) {
            console.error(err)
            addToast("error", err.message === "Failed to fetch" ? "Poor Internet Connection" : err.message)
        }
    }

    const { mutateAsync: denyBuildingDesign, isLoading: isDenyBuildingDesignLoading } = useMutation(denyBuildingDesignRequest)

    return { denyBuildingDesign, isDenyBuildingDesignLoading }
}

export const useApproveBuildingDesign = () => {
    const { addToast } = useToast()

    const approveBuildingDesignRequest = async (designDetails) => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/buildings/approve-request`, {
                body: JSON.stringify(designDetails),
                headers: {
                    "Content-Type": "application/json"
                },
                credentials: "include",
                method: 'POST'
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
            if (data.success) {
                addToast("success", data.success)
                return data
            }
        } catch (err) {
            console.error(err)
            addToast("error", err.message === "Failed to fetch" ? "Poor Internet Connection" : err.message)
        }
    }

    const { mutateAsync: approveBuildingDesign, isLoading: isApproveBuildingDesignLoading } = useMutation(approveBuildingDesignRequest)

    return { approveBuildingDesign, isApproveBuildingDesignLoading }
}