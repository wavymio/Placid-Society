import { createContext, useContext, useState } from "react"

const PlayPauseContext = createContext()

export const PlayPauseProvider = ({ children }) => {
    const [playPause, setPlayPause] = useState({})

    return (
        <PlayPauseContext.Provider value={{ playPause, setPlayPause }}>
            { children }
        </PlayPauseContext.Provider>
    )
}

export const usePlayPause = () => useContext(PlayPauseContext)