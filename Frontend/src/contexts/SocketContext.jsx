import { createContext, useContext, useEffect, useRef, useState } from "react"
import { useAuth } from "./AuthContext"
import { io } from "socket.io-client"
import { useToast } from "./ToastContext"
const SOCKET_BASE_URL = import.meta.env.VITE_SOCKET_BASE_URL

const SocketContext = createContext()

export const SocketProvider = ({ children }) => {
    const socket = useRef(null)
    const { isLoggedIn, isLoading, loggedInUser } = useAuth()
    const [userId, setUserId] = useState(null)
    const [isSocketLoading, setIsSocketLoading] = useState(false)

    useEffect(() => {
        if (loggedInUser?._id !== userId) {
            if (socket.current) {
                socket.current.disconnect()
            }

            setIsSocketLoading(true)

            socket.current = io(SOCKET_BASE_URL, {
                withCredentials: true,
                transports: ['websocket', 'polling']
                // query: { userId: loggedInUser._id } // not safe
            })

            socket.current.on("connect", () => {
                console.log("Connected to socket server")
                setIsSocketLoading(false)
            })
            setUserId(loggedInUser?._id)

            // return is also known as component unmount
            // return also runs after the dependency array changes before rerunning the use effect
            return () => {
                if (socket.current) {
                    socket.current.disconnect()
                }
                setIsSocketLoading(false)
            }
        }
    }, [loggedInUser?._id]) //dependency array

    return (
        <SocketContext.Provider value={{ socket: socket.current, isSocketLoading }}>
            { children }
        </SocketContext.Provider>
    )
}

export const useSocket = () => useContext(SocketContext)