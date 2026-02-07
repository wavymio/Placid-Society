import { useMultipleTimeFilters, useTimeFilter } from '../hooks/timeFilter'
import ContinentsGradients from '../components/ContinentsGradients'
import React, { useEffect, useRef, useState } from 'react'
import { TransformComponent, TransformWrapper } from 'react-zoom-pan-pinch'
import { countryColour, countryColour2 } from '../lib/mapUtils'
import { getCities, getContinents, getCountries } from '../api/MapApi'
import { useCity } from '../contexts/CityContext'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

// export const timezoneOffsets = [-12, -9, -6, -3, 0, 3, 6, 9] 
export const timezoneOffsets = [-12, -11, -10, -9, -8, -7, -6, -5, -4, -3, -2, -1, 0, 
    1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11] 

export function createTimeGradient(filters) {
    const stops = filters.map((opacity, idx, arr) => {
        const percent = (idx / (arr.length - 1)) * 100
        return `rgba(0, 0, 0, ${opacity}) ${percent.toFixed(2)}%`
    })
    return `linear-gradient(to right, ${stops.join(', ')})`
}

export const darkGradient = "rgba(0, 0, 0, 0.35)"
export const lightGradient = "rgba(255, 255, 255, 0.35)"

const Map = () => {
    const { isNewUser } = useAuth()
    const { continents, didGetContinentsFail, isGetContinentsFetching, isGetContinentsLoading } = getContinents()
    const { countries, didGetCountriesFail, isGetCountriesFetching, isGetCountriesLoading } = getCountries()
    const { fetchCities, isGetCitiesLoading } = getCities()
    const { currentCity, isGetCurrentCityLoading } = useCity()
    const [searchParams, setSearchParams] = useSearchParams()
    const navigate = useNavigate()
    
    const isLoading = (isGetContinentsLoading || isGetCountriesLoading || isGetCurrentCityLoading)
    const timeFilters = useMultipleTimeFilters(timezoneOffsets)
    const transformRef = useRef(null)
    const containerRef = useRef(null)
    const [selectedEntity, setSelectedEntity] = useState(null)
    const [openEntityDetails, setOpenEntityDetails] = useState(null)
    const [hoveredEntity, setHoveredEntity] = useState(null)
    const [scale, setScale] = useState(1)
    const [movement, setMovement] = useState(0)
    const idsStore = useRef(new Set())
    const [idsToSend, setIdsToSend] = useState([])
    const [fetchedCities, setFetchedCities] = useState([])
    const [myLoc, setMyLoc] = useState(null)
    const [canSelectCity, setCanSelectCity] = useState(false)
    const isNew = searchParams.has('new') && isNewUser.current // I added isNewuser here as a guard incase someone manuall types ?new and they aren't new
    const [text, setText] = useState("Continent")

    const handleEntityClick = (entity, event) => {
        if (!transformRef.current || !containerRef.current) return
        event.stopPropagation()

        const { state: transformState } = transformRef.current
        const { scale: currentScale, positionX, positionY} = transformState

        const targetElement = event.currentTarget
        const container = containerRef.current
        const entityType = targetElement.dataset.entityType
        const targetRect = targetElement.getBoundingClientRect()
        const containerRect = container.getBoundingClientRect()

        const scales = {
            "city": 10,
            "country": 5.1,
        }        

        if (selectedEntity?.name === entity.name) {
            transformRef.current?.resetTransform(1000, "easeOut")
            setOpenEntityDetails(false)
            setSelectedEntity(null)
            setScale(1)
            return
        } 

        const targetScale = scales[entityType] ?? 3
        const offsetXInContainer = (targetRect.x - containerRect.x)/currentScale
        const offsetYInContainer = (targetRect.y - containerRect.y)/currentScale
        let newPositionX = -(offsetXInContainer * targetScale)
        let newPositionY = -(offsetYInContainer * targetScale)

        const halfScreenWidth = window.innerWidth / 2
        const halfTargetWidth = ((targetRect.width/currentScale) * targetScale)/2
        const marginWidth = halfScreenWidth - halfTargetWidth
        newPositionX += marginWidth

        const halfScreenHeight = window.innerHeight / 2
        const halfTargetHeight = ((targetRect.height/currentScale) * targetScale)/2
        const marginHeight = halfScreenHeight - halfTargetHeight
        newPositionY += marginHeight - (0.35 * marginHeight) 
              
        transformRef.current.setTransform(newPositionX, newPositionY, targetScale, 1000, "easeOut")
        setOpenEntityDetails(true)
        setSelectedEntity(entity)
        setScale(scales[entityType])
    }

    const handleMouseEnter = (e, entity) => {
        e.stopPropagation()
        setHoveredEntity(entity)
    }

    const handleMouseLeave = (e) => {
        e.stopPropagation()
        setHoveredEntity(null)
    }

    const handleZoomPanStop = (transformRef) => {
        const {state: transformState} = transformRef
        const { scale: currentScale, positionX, positionY } = transformState
        setScale(currentScale)
        setMovement(prev => prev === 0 ? prev + 1 : 0)
    }

    const handleFetch = async (payload) => {
        const data = await fetchCities(payload)
        if (data?.success) {
            setFetchedCities(prev => [...prev, ...data.cities])
        }
    }

    useEffect(() => {
        if (scale > 5) {
            const continents = document.querySelectorAll('.continent')
            const visibleContinents = []

            continents.forEach((continent) => {
                const rect = continent.getBoundingClientRect()
                const isVisible =
                rect.right > 0 &&
                rect.left < window.innerWidth &&
                rect.bottom > 0 &&
                rect.top < window.innerHeight

                if (isVisible) {
                    visibleContinents.push(continent.dataset.id)
                }
            })
            // console.log("VISIBLE CONTINENTS: ", visibleContinents)
            const requiredIds = visibleContinents.filter(contId => !idsStore.current.has(contId))
            // console.log("REQUIRED IDS: ", requiredIds)
            requiredIds.forEach(id => idsStore.current.add(id))
            setIdsToSend(requiredIds)
        }
    }, [scale, movement]) 

    useEffect (() => {
        if (idsToSend && idsToSend.length > 0) {
            handleFetch({ continentIds: idsToSend })
        }
    }, [idsToSend])

    useEffect(() => {
        if (currentCity?._id) setMyLoc(currentCity)
    }, [currentCity?._id])

    useEffect(() => {
        if (!isNew || !myLoc || !countries) return
        const myCountry = countries.find(c => c._id === myLoc.country)
        if (!myCountry) return

        setText("Country")
        let rafId
        let timeoutId

        const findElAndZoom = () => {
            const el = document.querySelector(`[data-country-id="${myCountry._id}"]`)

            if (!el) {
                rafId = requestAnimationFrame(findElAndZoom)
                return
            }

            const fakeEvent = {
                currentTarget: el,
                stopPropagation: () => null
            }

            handleEntityClick(myCountry, fakeEvent)

            timeoutId = setTimeout(() => {
                setCanSelectCity(true)
            }, 1000)
        }

        rafId = requestAnimationFrame(findElAndZoom)

        return () => {
            cancelAnimationFrame(rafId)
            if (timeoutId) clearTimeout(timeoutId)
        }
    }, [isNew, myLoc, countries])

    useEffect(() => {
        if (!isNew || !fetchedCities || !canSelectCity) return
        const myCity = fetchedCities.find(c => c._id === myLoc._id)
        if (!myCity) return

        setText("City")
        let rafId
        let timeoutId

        const findElAndZoom = () => {
            const el = document.querySelector(`[data-city-id="${myCity._id}"]`)
            if (!el) {
                rafId = requestAnimationFrame(findElAndZoom)
                return
            }

            const fakeEvent = {
                currentTarget: el,
                stopPropagation: () => null
            }

            handleEntityClick(myCity, fakeEvent)
            timeoutId = setTimeout(() => {
                isNewUser.current = false
                searchParams.delete('new')
                navigate({ pathname: '/city', search: searchParams.toString() }, { replace: true })
            }, 1000)
        }

        rafId = requestAnimationFrame(findElAndZoom)

        return () => {
            cancelAnimationFrame(rafId)
            if (timeoutId) clearTimeout(timeoutId)
        }
    }, [canSelectCity, fetchedCities, isNew])

    return (
        <div className='w-[1536px] h-[642px] overflow-auto hide-scrollbar relative flex justify-center'>
            {isNew && (
                <div className='absolute top-0 left-0 w-[100vw] h-[80vh] z-[99] flex items-center justify-center animate-pulse font-extralight font-special text-xs'
                style={{ pointerEvents: 'none' }}>Finding a <span className='text-red-300 font-extrabold px-1'> {text} </span> for <span className='text-yellow-300 font-extrabold px-1'>You</span> ....</div>
            )}
            <TransformWrapper onInit={(ref) => transformRef.current = ref} minScale={1} maxScale={15} initialScale={1} 
            centerOnInit limitToBounds={false} onZoomStop={(ref) => handleZoomPanStop(ref)} onPanningStop={(ref) => handleZoomPanStop(ref)}>
                <TransformComponent 
                wrapperStyle={{ width: "100%", height: "100%", background: "black" }}
                contentStyle={{ width: "100%", height: "100%" }}>
                    <svg ref={containerRef}
                    width="100%"
                    height="100%"
                    viewBox="0 0 10000 10000"
                    preserveAspectRatio="none"
                    style={{ 
                        backgroundImage: scale < 2 ? `
                        repeating-radial-gradient(circle, rgba(0, 0, 0, 0.15) 0px, rgba(0, 0, 0, 0.15) 1px, transparent 3px),
                        linear-gradient(to bottom, #0077BE, #0A2E36)
                        ` : `linear-gradient(to bottom, #0077BE, #0A2E36)`,
                        backgroundBlendMode: "normal"
                    }}
                    >

                        <>
                        <ContinentsGradients />

                        {/* Continent Layer */}
                        {continents && continents.length > 0 && continents.map((continent, idx) => (
                            <g key={idx} className='continent' data-id={continent._id}>
                                <path
                                    d={continent.d}
                                    fill={continent.fill}
                                    stroke={"rgba(252, 252, 252, 0.7)"}
                                    strokeWidth={3}
                                />
                            </g>
                        ))}

                        {/* Country Layer */}
                        {countries && countries.length > 0 && countries.map((country, idx) => (
                            <g key={idx}
                            data-entity-type="country"
                            data-country-id={country._id}
                            onMouseEnter={(e) => handleMouseEnter(e, country)}
                            onMouseLeave={(e) => handleMouseLeave(e, country)}
                            onClick={(e) => handleEntityClick(country, e)} className='cursor-pointer group'>
                                <path
                                    d={country.d}
                                    fill={selectedEntity?.name === country.name ? darkGradient : hoveredEntity?.name === country.name ? lightGradient : 'transparent'}
                                    stroke={"rgba(252, 252, 252, 0.7)"}
                                    strokeWidth={3}
                                />
                            </g>
                        ))}        
                        </>                  
                        

                        {/* Cities' Layer */}
                        {scale > 5 && fetchedCities && fetchedCities.length > 0 && fetchedCities.map((city, idx) => (
                            <g key={idx}
                            data-entity-type="city"
                            data-city-id={city._id}
                            onMouseEnter={(e) => handleMouseEnter(e, city)}
                            onMouseLeave={(e) => handleMouseLeave(e, city)}
                            onClick={(e) => handleEntityClick(city, e)} 
                            className='cursor-pointer group'>
                                <title>{city.name}</title>
                                <path
                                    d={city.d}
                                    fill={selectedEntity?.name === city.name ? darkGradient : hoveredEntity?.name === city.name ? lightGradient : 'transparent'}
                                    stroke={"rgba(252, 252, 252, 0.1)"}
                                    strokeWidth={3}
                                />
                            </g>
                        ))}
                        
                    </svg>

                    {/* <div className='flex items-start justify-start absolute w-full h-full top-0 left-0 '
                    style={{ pointerEvents: "none" }}>
                        {timeFilters.map((filter, fIdx) => (
                            <div key={fIdx} className={`h-full flex-1`}
                            style={{ backgroundColor: `rgba(0, 0, 0, ${filter})` }}></div>
                        ))}
                    </div> */}
                    <div
                        className="absolute w-full h-full top-0 left-0 pointer-events-none"
                        style={{
                            backgroundImage: `
                            linear-gradient(to right, ${timeFilters
                                .map((filter, idx) => {
                                const percentage = (idx / (timeFilters.length - 1)) * 100;
                                return `rgba(0, 0, 0, ${filter.opacity}) ${percentage.toFixed(2)}%`;
                                })
                                .join(", ")})
                            `,
                            backgroundBlendMode: "normal",
                        }}
                    />
                </TransformComponent>
            </TransformWrapper>
                <div style={{ 
                    backdropFilter: isLoading ? `blur(10px)` : '',
                    pointerEvents: isLoading ? 'all' : 'none',
                    backgroundColor: 'transparent',
                    transition: 'backdrop-filter 0.3s ease-out',
                }} 
                className={`flex h-screen w-full shadow-lg z-20 fixed left-0 top-0 bg-transparent transition-all duration-700 ease-in-out`}>
                </div>
        </div>
    )
}

export default Map

// const continents = [
//         {
//             name: "Genesisar",
//             d: `M1200,1200
//                 L1150,1300 L1000,2300 L1000,2500 L850,3000 L1000,3200 
//                 L1050,3600 L1200,3300 L1270,3370 L1290,3800 L1600,3800 
//                 L1800,3750 L1780,4000 L1900,4050 L1970,3950 L2150,4000 
//                 L2300,4300 L2400,4320 L2410,4450 L2500,4350 L2550,4690 
//                 L2580,4300 L2650,4280 L2610,3900 L2650,3650 L2600,3600 
//                 L2580,3580 L2580,2950 L2600,2800 L2540,2750 L2520,2600
//                 L2550,2550 L2500,2250 L2450,2100 L2150,2050 L2120,2090 
//                 L2090,2000 L2060,1990 L2000,1600 L1900,1500 L1800,1550 
//                 L1700,1300 L1650,1230 L1650,1000 L1550,1050 L1450,1250 Z`
//                  .replace(/\s+/g, ' ')
//                 .trim(),
//             fill:"url(#oceaniaGradient)",
//         }
//     ]


// {openContinentDetails && (
//                 <div className={`white-opacity flex flex-col gap-4 room-event-animation w-[200px] lg:min-h-[300px] lg:h-fit lg:w-[300px] absolute
//                 ${getCardPosition(selectedContinent.name)} lg:top-10 lg:left-10 rounded-3xl p-5 text-white`}>
//                     <div className='text-md lg:text-xl font-normal h-[15%] text-end'>{selectedContinent.name}</div>
//                     <div className='h-85% flex flex-col gap-6'>

//                         <div className='flex flex-col gap-3 text-[10px] lg:text-xs items-start'>
//                             <div className='flex w-full items-center gap-4 justify-between'>
//                                 <div>Countries:</div>
//                                 <div className=''>{selectedContinent?.countries?.length}</div>
//                             </div>
//                             <div className='flex w-full items-center gap-4 justify-between'>
//                                 <div>Population:</div>
//                                 <div>{selectedContinent?.population}</div>
//                             </div>
//                             <div className='flex w-full items-center gap-4 justify-between'>
//                                 <div>Minerals:</div>
//                                 <div>
//                                     {selectedContinent?.naturalResources?.length > 1 ? 
//                                     `${selectedContinent?.naturalResources[0]}, ${selectedContinent?.naturalResources[1]}`:
//                                     selectedContinent?.naturalResources?.length === 1 ? 
//                                     `${selectedContinent?.naturalResources[0]}`:
//                                     'Unknown'}
//                                 </div>
//                             </div>
//                             <div className='flex w-full items-center gap-4 justify-between'>
//                                 <div>Average Temp:</div>
//                                 <div>{selectedContinent?.averageTemp}°C</div>
//                             </div>
//                         </div>

//                         {/* Next Button */}
//                         <div className='flex w-full items-center justify-end'>
//                             <div onClick={() => navigate(`/map/continent/${selectedContinent._id}`)}
//                             className='py-3 lg:py-4 border-2 border-white rounded-lg w-[50%] lg:w-[35%] text-center cursor-pointer text-[10px] lg:text-xs font-bold tracking-wide hover:bg-white hover:text-black transition-all ease-out duration-500'>Explore</div>
//                         </div>
                        
//                     </div>
//                 </div>
//             )}
