import { useGetMyUser, useGetMyUserCoords } from "../api/MyUserApi"
import { createContext, useContext, useRef, useState } from "react"

const AuthContext = createContext()

export const AuthProvider = ({ children }) => {
    // const [user, setUserInfo] = useState({})
    const { userInfo, isLoading, isError } = useGetMyUser()
    const isNewUser = useRef(false)

    const isLoggedIn = !isError && userInfo
    const loggedInUser = userInfo

    return (
        <AuthContext.Provider value={{ isLoggedIn, isLoading, loggedInUser, isNewUser }}>
            { children }
        </AuthContext.Provider>
    )
}

export const useAuth = () => useContext(AuthContext)