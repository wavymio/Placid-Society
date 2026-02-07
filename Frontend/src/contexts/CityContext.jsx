import { useCurrentCity } from "../api/MapApi"
import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react"
import { useAuth } from "./AuthContext"
import { betterHash, seededRandom } from '../lib/cityUtils'
import { getCityEntities } from "../api/CityApi"

const CityContext = createContext()

export const CityProvider = ({ children }) => {
    const { isLoggedIn, isLoading, loggedInUser } = useAuth()
    const { fetchCity, isGetCurrentCityLoading } = useCurrentCity()
    const { fetchCityEntities, isGetCityEntitiesLoading: isGroupEntityMapLoading } = getCityEntities()
    const [currentCity, setCurrentCity] = useState(null) 
    const [cityConfig, setCityConfig] = useState(null) 
    const groupEntityMapRef = useRef(null)

    const handleFetch = async (id) => {
        const data = await fetchCity(id)
        if (data?.success) {
            setCityConfig(data.cityConfig)
            setCurrentCity(data.city)
        }
    }

    const handleCreateGEM = async () => {
        const data = await fetchCityEntities()
        if (data?.success) groupEntityMapRef.current = data.success
    }

    useEffect(() => {
        if (!loggedInUser) return 
        const locationToUse = loggedInUser.location || loggedInUser.origin

        if (locationToUse) handleFetch(locationToUse)
    }, [loggedInUser])

    useEffect(() => {handleCreateGEM()}, [])

    return (
        <CityContext.Provider value={{ currentCity, handleFetch, origin: loggedInUser?.origin, isGetCurrentCityLoading, cityConfig, groupEntityMap: groupEntityMapRef.current, isGroupEntityMapLoading }}>
            {children}
        </CityContext.Provider>
    )
}

export const useCity = () => useContext(CityContext)