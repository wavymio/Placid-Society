import { createContext, useContext, useState } from "react"

const LoadingContext = createContext()

export const LoadingProvider = ({ children }) => {
    const [isRedirectLoading, setIsRedirectLoading] = useState(false)

    return (
        <LoadingContext.Provider value={{ isRedirectLoading, setIsRedirectLoading }}>
            { children }
        </LoadingContext.Provider>
    )
}

export const useLoading = () => useContext(LoadingContext)