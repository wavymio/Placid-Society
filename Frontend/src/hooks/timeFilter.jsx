import { DateTime } from "luxon"
import { useState, useEffect } from "react"

const filterMap = {
    0: 0.84,
    1: 0.85,
    2: 0.85,
    3: 0.85,
    4: 0.82,
    5: 0.7,
    6: 0.6,
    7: 0.5,
    8: 0.4,
    9: 0.3,
    10: 0.2,
    11: 0.15,
    12: 0.1,
    13: 0.1,
    14: 0.15,
    15: 0.25,
    16: 0.35,
    17: 0.45,
    18: 0.55,
    19: 0.65,
    20: 0.7,
    21: 0.75,
    22: 0.8,
    23: 0.82,
}

const getTimeOpacity = (utcOffset = 0) => {
    const now = DateTime.utc().plus({ hours: utcOffset })
    const hour = now.hour

    return {
        hour,
        opacity: filterMap[hour] ?? 0.2 // Default fallback (Thinner)
    }
}

export const useTimeFilter = (utcOffset = 0) => {
    if (utcOffset === undefined || utcOffset === null) return 0.3 // Ensure hook always returns something
    const initial = getTimeOpacity(utcOffset || 0)

    const [timeFilter, setTimeFilter] = useState(() => getTimeOpacity(utcOffset || 0).opacity)
    const [timeNow, setTimeNow] = useState(Date.now())
    const [timeHour, setTimeHour] = useState(initial.hour)
    const [timeSecond, setTimeSecond] = useState(DateTime.utc().second)

    // useEffect(() => {
    //     console.log({ timeFilter, timeHour, utcOffset })
    // }, [timeFilter, timeHour])

    useEffect(() => {
        if (utcOffset === undefined || utcOffset === null) return

        const { hour, opacity } = getTimeOpacity(utcOffset || 0)
        setTimeFilter(opacity)
        setTimeHour(hour)
        const interval = setInterval(() => {
            const { hour, opacity } = getTimeOpacity(utcOffset || 0)
            setTimeHour(hour)
            setTimeFilter(opacity)
            setTimeNow(Date.now())
            // console.log("setting...")
        }, 60000) // Updates every 1 minute

        const secondInterval = setInterval(() => {
            setTimeSecond(DateTime.utc().second)
        }, 1000) // Updates every second

        return () => {
            clearInterval(interval)
            clearInterval(secondInterval)
        }
    }, [utcOffset])

    return { timeFilter, timeNow, timeHour, timeSecond }
}

export const useMultipleTimeFilters = (offsets = []) => {
    const [filters, setFilters] = useState(() =>
        offsets.map(offset => getTimeOpacity(offset || 0))
    )

    useEffect(() => {
        setFilters(offsets.map(offset => getTimeOpacity(offset || 0)))
        
        const interval = setInterval(() => {
            setFilters(offsets.map(offset => getTimeOpacity(offset || 0)))
        }, 60000)

        return () => clearInterval(interval)
    }, [offsets])

    return filters
}
