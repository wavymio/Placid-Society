import { createContext, useContext, useRef, useState } from "react"

const RoomEventsContext = createContext()

export const RoomEventsProvider = ({ children }) => {
    const [roomEvent, setRoomEvent] = useState('')
    const timeoutRef = useRef(null)

    const changeRoomEvent = (event) => {
        setRoomEvent(event)

        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current)
        }

        timeoutRef.current = setTimeout(() => {
            setRoomEvent('')
            timeoutRef.current = null
        }, 5000)
    }

    return (
        <RoomEventsContext.Provider value={{ roomEvent, changeRoomEvent }}>
            { children }
        </RoomEventsContext.Provider>
    )
}

export const useRoomEvents = () => useContext(RoomEventsContext)