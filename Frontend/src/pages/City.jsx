import React, { act, startTransition, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { TransformComponent, TransformWrapper } from 'react-zoom-pan-pinch'
import { updateDimensions } from '../lib/mapUtils'
import { debounce } from 'lodash'
import { useTimeFilter } from '../hooks/timeFilter'
import { useAuth } from '../contexts/AuthContext'
import PlotWrapper from '../components/PlotWrapper'
import { omit, areMapsEqual, arraysEqualUnordered, assignPlotData, emitUserMovement, generateLayersForPlot, getCenteringFactor, handleMoveUser, isPlotVisible, isWithinBuffer, syncViewportToTransform, getSurroundingPlots, BUFFER_TYPES, goFullscreen, handleSelectAction, facingTranslator, seededRandom, betterHash } from '../lib/cityUtils'
import { useCity } from '../contexts/CityContext'
import { getCityUsers } from '../api/CityApi'
import { useSocket } from '../contexts/SocketContext'
import RouletteMenu from '../components/RouletteMenu'
import { makeActionsMap } from '../lib/actionUtils'
import InspectEntity from '../components/InspectEntity'
import { useCreatePlot, useGetPlots, useHandleActions } from '../api/PlotApi'
import { handleAlightEffect, handleCollectEffect, handleDropEarthlyEffect, handleDropEffect, handleDropUserEffect, handleEscapedUserEffect, handleHitDestroyEffect, handleHitEntityEffect, handleHitUserEffect, handleOtherUserJoinEffect, handleOtherUserMoveEffect, handlePickEarthlyEffect, handlePickEffect, handlePickUserEffect, handlePlotCreatedEffect, handleRideEffect, handleRideInsEffect } from '../lib/actionUtils2'
import RideMenu from '../components/RideMenu'
import Wavy from '../components/Wavy'
import MobileCtrl from '../components/MobileCtrl'
import { useIsMobile } from '../hooks/isMobile'
import { useGetMyUserCoords } from '../api/MyUserApi'

const gridWidth = 50 // Number of columns

const City = () => {
    const { socket, isSocketLoading } = useSocket()
    const { myUserCoords, isGetMyUserCoordsFetching, isGetMyUserCoordsLoading } = useGetMyUserCoords()
    const { currentCity, isGetCurrentCityLoading, cityConfig, groupEntityMap, isGroupEntityMapLoading, handleFetch, origin } = useCity()
    const { fetchCityUsers, isGetCityUsersLoading } = getCityUsers()
    const { createPlot, isCreatePlotLoading } = useCreatePlot()
    const { getPlots, isGetPlotsLoading } = useGetPlots()
    const { sendAction, isSendActionLoading } = useHandleActions()
    const { isMobile, isSmallScreen } = useIsMobile()
    const navigate = useNavigate()
    const containerRef = useRef(null)
    const transformRef = useRef(null)
    const [dimensions, setDimensions] = useState(null)
    const [myCity, setMyCity] = useState({})
    const [scale, setScale] = useState(1)
    // const { timeFilter, timeNow, timeHour, timeSecond } = useTimeFilter(10)
    const { timeFilter, timeNow, timeHour, timeSecond } = useTimeFilter(myCity?.tzOff ?? 0)
    const filteredPlotsRef = useRef([])
    const [myCoords, setMyCoords] = useState(null)
    const cameraTarget = useRef({ x: 0, y: 0 })
    const userRef = useRef(null)
    const myBoundRef = useRef(null)
    const usersInView = useRef(new Map())
    const [usersInViewSnapshot, setUsersInViewSnapshot] = useState([])
    const lastSnapshotRef = useRef(new Map())
    const moveCoolDown = useRef(false)
    const [selectedEntity, setSelectedEntity] = useState([])
    const [closeInspect, setCloseInspect] = useState(false)
    const [actionTab, setActionTab] = useState("other")
    const userActions = { alone: ["chat", "profile", "hit", "pick"], held: ["drop"]}
    const [currentIdx, setCurrentIdx] = useState(0)
    const [inspect, setInspect] = useState(null)
    const [inspectTabMode, setInspectTabMode] = useState("inspect")
    const [welcome, setWelcome] = useState(false)
    const myPrevPlotRef = useRef(null)
    const emissionView = useRef([])
    const [step, setStep] = useState(null)
    const plotMarginsRef = useRef(null)
    const rideActions = ["ride-rest", "ride-walk", "ride-run"]
    const [ridingAction, setRidingAction] = useState(null)
    const ridingEntityRef = useRef(null)
    const myCoordsRef = useRef(null)
    const [action, setAction] = useState(null)
    const clickActionRef = useRef(false)
    const socketCtxRef = useRef(null)
    const [layerIdx, setLayerIdx] = useState(0)
    const viewportRef = useRef({
        x: -2000,
        y: -2000,
        width: 0,
        height: 0,
    })
    const [isViewPortReady, setIsViewPortReady] = useState(false)
    const [canShowPlots, setCanShowPlots] = useState(false)
    const transformInstanceRef = useRef(null)
    const [filteredPlots, setFilteredPlots] = useState([])
    const layerCacheRef = useRef(new Map())
    const myCoordsPlotRef = useRef({ plotId: null })
    const viewFilteredPlotsRef = useRef([])
    const holdingWeight = useRef(0)
    const holdingDamage = useRef(0)
    const cityRngRef = useRef(null)
    const WAMPRef = useRef(null)
    const plotsRef = useRef(null)
    
    const handleFetchCityUsers = async (payload) => {
        // console.log("CASE 1: SEARCH TO DATABASE INITIATED")
        const data = await fetchCityUsers(payload)
        if (data?.success) {
            const map = new Map()
            for (const newUser of data.cityUsers) {
                const oldUser = usersInView.current.get(newUser._id)
                map.set(newUser._id, oldUser ?? newUser)
            }
            usersInView.current = map
        }
    }

    const fetchPlotData = async (fetching, cityId) => {      
        const data = await getPlots({ cityId, plots: fetching })
        if (data.success) {
            // console.log("Fetched plots: ", data.plots)
            const plotData =  data.plots
            for (let i = 0; i < plotData.length; i++) {
                const thisPlot = plotData[i]
                layerCacheRef.current.set(thisPlot.id, { layers: thisPlot.layers })
            }
            setFilteredPlots(prev => {
                return prev.map((plot) => {
                    return fetching.includes(plot.id) ? { ...plot, ...(layerCacheRef.current.get(plot.id)) } : plot
                })
            })
        }
    }

    // City Layout Setup
    useEffect(() => {
        if (currentCity) {
            setMyCity(currentCity)
        }
    }, [currentCity])

    const cityRng = useMemo(() => {
        if (canShowPlots) return cityRngRef.current
        if (!myCity?.name || !myCity?._id) return null
        const rng = seededRandom(betterHash(`{${myCity.name}-${myCity._id}`))
        for (let i = 0; i < 7; i++) rng()
        cityRngRef.current = rng
        return cityRngRef.current
    }, [myCity])

    const waterAndModifiedPlotIds = useMemo(() => {
        if (canShowPlots) return WAMPRef.current
        if (!cityConfig) return null
        WAMPRef.current = { waterPlotIds: new Set(cityConfig.waterPlotIds), modifiedPlotIds: new Set(cityConfig.modifiedPlots ?? []) }
        return WAMPRef.current
    }, [cityConfig])

    const plots = useMemo(() => {
        if (canShowPlots) return plotsRef.current
        if (!cityConfig || !waterAndModifiedPlotIds) return null
        plotsRef.current = Array.from({ length: cityConfig.totalPlots }, (_, index) => {
            const { waterPlotIds, modifiedPlotIds } = waterAndModifiedPlotIds
            const isWater = waterPlotIds.has(index + 1)
            const isModified = modifiedPlotIds.has(index + 1)
            const plotId = index + 1
            const width = isWater ? 1820 : 1680
            const height = isWater ? 1620 : 1500

            const hasLeftRoad = (plotId % 50 === 1 && !isWater)
            const hasRightRoad = isWater ? false : true
            const hasTopRoad = (plotId <= 50 && !isWater)
            const hasBottomRoad = isWater ? false : true
            const bottomRoadIsWide = plotId % 50 === 0 && plotId !== 1000

            // Base adjustments
            const leftOffset = hasLeftRoad ? 140 : 0
            const rightOffset = hasRightRoad ? 140 : 0
            const topOffset = hasTopRoad ? 120 : 0
            const bottomOffset = hasBottomRoad ? 120 : 0

            // Width logic: ensure it fits the longer bottom road if needed
            const baseContentWidth = width + leftOffset + rightOffset
            const baseContentHeight = height + topOffset + bottomOffset
            const adjustedWidth = bottomRoadIsWide
            ? Math.max(baseContentWidth, 2755)
            : baseContentWidth

            // Offset Calc
            const xOffset = bottomRoadIsWide ? 0 : adjustedWidth - (width + rightOffset)
            const yOffset = baseContentHeight - (height + bottomOffset)
            const skewOffset = hasTopRoad ? 1004.307 : 935.306

            return {
                id: index + 1,
                x: (index % gridWidth) * 1820,
                y: Math.floor(index / gridWidth) * 1620,
                width,
                height,
                waterPatch: !!isWater,
                ...(isWater ? { waterType: 'Lake' } : {}),
                modified: !!isModified,
                owner: isModified ? isModified.owner : null,
                skewOffset, 
                xOffset, yOffset, topOffset, leftOffset,
                modWidth: adjustedWidth, modHeight: height + topOffset + bottomOffset,
                bcw: baseContentWidth, bch: baseContentHeight,
                margins: {
                    'l': -leftOffset,
                    't': -yOffset,
                    'r': width,
                    'b': height
                }
            }
        })
        return plotsRef.current
    }, [waterAndModifiedPlotIds])

    const finalPlots = useMemo(() => assignPlotData(cityConfig, plots, myCity, cityRng), [cityRng, plots])

    const updatedFilteredPlots = useMemo(() => {
        if (!finalPlots || !myCoords?.plotId || !canShowPlots) return null

        const viewFilteredPlots = []
        const fetchFilteredPlots = []
        if (myCoords.plotId !== myCoordsPlotRef.current.plotId) {
            myCoordsPlotRef.current.plotId = myCoords.plotId
            const userView = getSurroundingPlots(myCoords.plotId, 50, 20)

            for (const plot of finalPlots) {
                const inViewBuffer = userView.includes(plot.id)
                const isVisible = isPlotVisible(plot, viewportRef.current)

                if (inViewBuffer) {
                    viewFilteredPlots.push(plot)
                }
                if (isVisible) fetchFilteredPlots.push(plot.id)
            }

        } else {
            const oldViewPlots = viewFilteredPlotsRef.current
            for (const plot of oldViewPlots) {
                const isVisible = isPlotVisible(plot, viewportRef.current)
                if (isVisible) fetchFilteredPlots.push(plot.id)
            }
            viewFilteredPlots.push(...oldViewPlots)
        }

        // console.log({viewFilteredPlots, fetchFilteredPlots})
        viewFilteredPlotsRef.current = viewFilteredPlots
        return { viewFilteredPlots, fetchFilteredPlots }
    }, [myCoords?.x, myCoords?.y, canShowPlots, finalPlots])
  
    useEffect(() => {
        if (!myCity?._id || !myCoords || !cityConfig || !cityRng || !updatedFilteredPlots) return
        const { viewFilteredPlots, fetchFilteredPlots } = updatedFilteredPlots
        if (arraysEqualUnordered(filteredPlotsRef.current, fetchFilteredPlots)) return
        const fetching = []
        const joining = fetchFilteredPlots.filter(plotId => !filteredPlotsRef.current.includes(plotId))

        const viewFilteredWithLayers = viewFilteredPlots.map(vfPlot => {
            if (fetchFilteredPlots.includes(vfPlot.id)) {
                const isVfPlotMod = vfPlot.modified
                const rest = omit(vfPlot, vfPlot.iswater)
                
                if (joining.includes(vfPlot.id)) {
                    if (isVfPlotMod) {
                        fetching.push(vfPlot.id)
                        return { ...rest, layers: [] }
                    }
                    let plotLayers = layerCacheRef.current.get(vfPlot.id)
                    if (plotLayers) {
                        // console.log("Getting Layer from cache for ", vfPlot.id)
                        return { ...rest, ...(plotLayers) }
                    }
                    // console.log("Generating Layer for ", vfPlot.id)
                    plotLayers = generateLayersForPlot(vfPlot, myCity, cityConfig, cityRng)
                    layerCacheRef.current.set(vfPlot.id, plotLayers)
                    return { ...rest, ...(plotLayers) }
                } else {
                    // console.log("Returning prev Layer for ", vfPlot.id)
                    return { ...rest, ...(layerCacheRef.current.get(vfPlot.id))  }
                }
            }

            return { ...vfPlot, layers: null }
        })

        // // console.log(viewFilteredWithLayers)
        // console.log("prev view... ", filteredPlotsRef.current)
        // console.log("current view... ", fetchFilteredPlots)
        // console.log("joining... ", joining)
        // console.log("fetching... ", fetching)
        // console.log("VIEW FILTERED WITH LAYERS: ", viewFilteredWithLayers)

        setFilteredPlots(viewFilteredWithLayers)
        if (fetching.length > 0) fetchPlotData(fetching, myCity._id)
        filteredPlotsRef.current = fetchFilteredPlots
    }, [updatedFilteredPlots])

    useEffect(() => {
        if (myCoords?.plotId && myPrevPlotRef.current !== myCoords.plotId) {
            if (emissionView.current?.length === 0) emissionView.current = getSurroundingPlots(myCoords.plotId)
            const leaving = myPrevPlotRef.current
            const joining = myCoords.plotId
            myPrevPlotRef.current = myCoords.plotId
            const socketPlotData = {
                joining,
                leaving,
                emitView: emissionView.current,
                myUserCoords: myCoords
            }

            const payload = { plotIds: emissionView.current, layerIdx, cityId: myCity._id }
            handleFetchCityUsers(payload)
            socket.emit("joinLeavePlot", socketPlotData)
        }
    }, [myCoords?.plotId])

    // City Users Setup
    useEffect(() => {
        // console.log("CORDS FROM SERVER: ", myUserCoords)
        if (myUserCoords && myCity._id) {
            setMyCoords(myUserCoords)
        }
    }, [myUserCoords, myCity?._id])

    useEffect(() => {
        if (!groupEntityMap) {
            holdingWeight.current = 0
            holdingDamage.current = 0
            return
        }

        const myHolding = myCoords?.holding
        // console.log({ myHolding })
        if (!myHolding) {
            holdingWeight.current = 0
            holdingDamage.current = 0
            return
        }

        if (myHolding.userStyleId) {
            holdingWeight.current = myHolding.userStyleId.width + myHolding.userStyleId.height
            holdingDamage.current = myHolding.userStyleId.width + myHolding.userStyleId.height
        } else {
            const ref = groupEntityMap?.[myHolding.grp]?.[myHolding.t]
            if (ref) {
                const width = ref.states[myHolding.s].size[1]
                const height = ref.states[myHolding.s].size[0]
                holdingWeight.current = width + height
                holdingDamage.current = ref.states[myHolding.s].damage
            } else {
                holdingWeight.current = 0
                holdingDamage.current = 0
            }
        }
    }, [myCoords?.holding, isGroupEntityMapLoading])

    // Position camera
    useEffect(() => {
        if (!finalPlots || !isViewPortReady || !myCoords) return

        const myPlot = finalPlots.find(p => p.id === myCoords.plotId)
        if (!myPlot) return

        const transform = transformInstanceRef.current
        if (!transform) return

        const tanSkew = Math.tan(-30 * Math.PI / 180)
        const skewedPlotX = myPlot.x + tanSkew * myCoords.y

        const userHeight = myCoords.userStyleId.height
        const userWidth = myCoords.userStyleId.width

        cameraTarget.current.x =
            -(skewedPlotX + myCoords.x) + (viewportRef.current.width / 4 - userWidth)

        cameraTarget.current.y =
            -(myPlot.y + myCoords.y) + (viewportRef.current.height / 4 - userHeight / 2)

        if (!canShowPlots) {
            transform.setTransform(cameraTarget.current.x, cameraTarget.current.y, scale, 0, "easeOut")
            syncViewportToTransform(100, 0, transform, viewportRef, setCanShowPlots, cameraTarget.current.x, cameraTarget.current.y)
        } 

        // console.log({ x: myCoords.x, y: myCoords.y })
    }, [myCoords?.x, myCoords?.y])

    useEffect(() => {
        // this useEffect sets up the pan to camera function - animate, once the plots are shown
        if (!canShowPlots) return
        const transform = transformInstanceRef?.current
        if (!transform) return

        let frame
        const speed = 0.15 // 0.1 → smooth, 0.2 → slightly faster

        const animate = () => {
            // console.log("animating")
            const { x: tx, y: ty } = cameraTarget.current
            const { positionX, positionY, scale } = transform.state

            // Linear interpolation
            const newX = positionX + ((tx - positionX) * speed)
            const newY = positionY + ((ty - positionY) * speed)
            
            const newViewport = {
                x: Math.round(-newX / scale),
                y: Math.round(-newY / scale),
            }
            const dx = (viewportRef.current.x -newViewport.x)
            const dy = (viewportRef.current.y -newViewport.y)
            if (dx || dy) {
                transform.setTransform(newX, newY, scale, 100, "linear")
                viewportRef.current.x = newViewport.x
                viewportRef.current.y = newViewport.y
            }

            frame = requestAnimationFrame(animate)
        }

        frame = requestAnimationFrame(animate)
        return () => cancelAnimationFrame(frame)
    }, [canShowPlots])

    // Actions
    useEffect(() => {
        if (!ridingAction) return
        let interval
        // console.log({ ridingEntityRef: ridingEntityRef.current })
        if (ridingAction === "ride-rest") {
            console.log({ ridingEntityRef: ridingEntityRef.current })
        } else {
            interval = setInterval(() => {
                const facing = myCoordsRef.current.facing
                const key = facingTranslator[facing]
                const event = { preventDefault: () => null, key }
                handleMoveUser(event, socket, myCoordsRef.current, setMyCoords, layerCacheRef, usersInView, emissionView, moveCoolDown, myBoundRef,
                myCoordsRef.current?.layerIdx, sendAction, myCity?._id, holdingWeight.current, ridingEntityRef.current)
            }, 1000)
        }
        return () => clearInterval(interval)
    }, [ridingAction])

    useEffect(() => {
        // console.log("STEP CHANGED...")
        if(!step) return
        handleMoveUser(step, socket, myCoords, setMyCoords, layerCacheRef, usersInView, emissionView, moveCoolDown, myBoundRef,
        layerIdx, sendAction, myCity?._id, holdingWeight.current, ridingEntityRef.current)
    }, [step])

    useEffect(() => {
        // console.log("ACTION CHANGED...", action)
        if(!action) return
        handleSelectAction(action, myCity, filteredPlots, isCreatePlotLoading, clickActionRef, myCoords, rideActions, myBoundRef, 
        layerCacheRef, createPlot, emissionView, setFilteredPlots, finalPlots, actionsMap, handleFetch, origin)
    }, [action])

    // Other users' snapshot
    useEffect(() => {
        let rafId

        const tick = () => {
            const current = usersInView.current
            const lastSnapshot = lastSnapshotRef.current

            if (!areMapsEqual(current, lastSnapshot)) {
                // console.log("rendering snapshot")
                const currentArr = Array.from(current?.values() || [])
                setUsersInViewSnapshot(currentArr)
                lastSnapshotRef.current = new Map(current)
            }
            rafId = requestAnimationFrame(tick)
        }

        rafId = requestAnimationFrame(tick)
        return () => cancelAnimationFrame(rafId)
    }, [])

    // useEffect(() => {
    //     if (usersInViewSnapshot) {
    //         console.log("------------- FINAL CASE: USERS IN VIEW --------------", usersInViewSnapshot)
    //     }
    // }, [usersInViewSnapshot])

    // Dimensions setup
    useEffect(() => {
        let cleanup = null
        const attemptInit = () => {
            if (!containerRef?.current) {
                requestAnimationFrame(attemptInit)
                return
            }
            updateDimensions(containerRef, setDimensions)
            const handleResize = () => updateDimensions(containerRef, setDimensions)
            window.addEventListener("resize", handleResize)

            cleanup = () => window.removeEventListener("resize", handleResize)
        }

        attemptInit()
        return () => {
            if (cleanup) cleanup()
        }
    }, [])

    useEffect(() => {
        if (!dimensions) return
        viewportRef.current.width = dimensions.width * 2
        viewportRef.current.height = dimensions.height * 2
        setIsViewPortReady(true)
        // console.log("dimensions: ", dimensions)
    }, [dimensions])

    // Sockets and others Functions
    useEffect(() => {
        myCoordsRef.current = myCoords
        socketCtxRef.current = { layerCacheRef, usersInView: usersInView.current, origin, handleFetch,
        setMyCoords, setCloseInspect, setInspect, setSelectedEntity, setRidingAction, setFilteredPlots,
        myCoords, updatedFilteredPlots, finalPlots, inspect, ridingEntityRef }
    }, [myCoords, inspect, usersInViewSnapshot, finalPlots, updatedFilteredPlots])

    useEffect(() => {
        if (socket && myUserCoords) {
            const handleEntityCollected = (data) => {
                handleCollectEffect(data, socketCtxRef.current)
            }

            const handleEntityPicked = (data) => {
                handlePickEffect(data, socketCtxRef.current)
            }
            
            const handleEntityDropped = (data) => {
                handleDropEffect(data, socketCtxRef.current)
            }
            const handleEarthlyPicked = (data) => {
                handlePickEarthlyEffect(data, socketCtxRef.current)
            }
            const handleEarthlyDropped = (data) => {
                handleDropEarthlyEffect(data, socketCtxRef.current)
            }
            const handleUserPicked = (data) => {
                handlePickUserEffect(data, socketCtxRef.current)
            }
            const handleUserDropped = (data) => {
                handleDropUserEffect(data, socketCtxRef.current)
            }
            const handleUserEscaped = (data) => {
                handleEscapedUserEffect(data, socketCtxRef.current)
            }
            const handleUserHit = (data) => {
                handleHitUserEffect(data, socketCtxRef.current)
            }
            const handleEntityHit = (data) => {
                handleHitEntityEffect(data, socketCtxRef.current)
            }
            const handleDestroyHit = (data) => {
                handleHitDestroyEffect(data, socketCtxRef.current)
            }
            const handleRide = (data) => {
                handleRideEffect(data, socketCtxRef.current)
            }
            const handleRideIns = (data) => {
                handleRideInsEffect(data, socketCtxRef.current)
            }
            const handleAlight = (data) => {
                handleAlightEffect(data, socketCtxRef.current)
            }

            const handleOtherUserJoin = (data) => {
                handleOtherUserJoinEffect(data, socketCtxRef.current)
            }
            const handleOtherUserMove = (data) => {
                handleOtherUserMoveEffect(data, socketCtxRef.current)
            }
            const handlePlotCreated = (data) => {
                handlePlotCreatedEffect(data, socketCtxRef.current)
            }

            socket.on("userJoinedZone", handleOtherUserJoin)
            socket.on("userMoved", handleOtherUserMove)
            socket.on("plotCreated", handlePlotCreated)
            socket.on("entityCollected", handleEntityCollected)
            socket.on("entityPicked", handleEntityPicked)
            socket.on("entityDropped", handleEntityDropped)
            socket.on("earthlyPicked", handleEarthlyPicked)
            socket.on("earthlyDropped", handleEarthlyDropped)
            socket.on("userPicked", handleUserPicked)
            socket.on("userDropped", handleUserDropped)
            socket.on("userEscaped", handleUserEscaped)
            socket.on("userHit", handleUserHit)
            socket.on("entityHit", handleEntityHit)
            socket.on("destroyHit", handleDestroyHit)
            socket.on("ride", handleRide)
            socket.on("ride-ins", handleRideIns)
            socket.on("alight", handleAlight)

            return () => {
                socket.off("userJoinedZone", handleOtherUserJoin)
                socket.off("userMoved", handleOtherUserMove)
                socket.off("plotCreated", handlePlotCreated)
                socket.off("entityCollected", handleEntityCollected)
                socket.off("entityPicked", handleEntityPicked)
                socket.off("entityDropped", handleEntityDropped)
                socket.off("earthlyPicked", handleEarthlyPicked)
                socket.off("earthlyDropped", handleEarthlyDropped)
                socket.off("userPicked", handleUserPicked)
                socket.off("userDropped", handleUserDropped)
                socket.off("userEscaped", handleUserEscaped)
                socket.off("userHit", handleUserHit)
                socket.off("entityHit", handleEntityHit)
                socket.off("destroyHit", handleDestroyHit)
                socket.off("ride", handleRide)
                socket.off("ride-ins", handleRideIns)
                socket.off("alight", handleAlight)
            }
        }
    }, [socket, myUserCoords])

    useEffect(() => {
        if (welcome) goFullscreen(containerRef, setMyCoords, myBoundRef)
    }, [welcome])

    const actionsMap = useMemo(() => 
        makeActionsMap({ myCoords, setMyCoords, layerCacheRef, layerIdx, usersInView, userActions, emitUserMovement, setActionTab, 
        inspect, setInspect, setSelectedEntity, setInspectTabMode, plots, sendAction, myCity, emissionView, ridingEntityRef: ridingEntityRef.current, 
        holdingDamage: holdingDamage.current, holdingWeight: holdingWeight.current, plotMargins: plotMarginsRef.current, groupEntityMap }), 
        [ myCoords, layerIdx, userActions, inspect, plots, myCity ]
    )

    const allNeeded = useMemo(() => {
        return (!!myCity && !!cityRng && !!socket && !!groupEntityMap && !!myUserCoords)
    }, [myCity, cityRng, socket, groupEntityMap, myUserCoords])

    // Earth Brown	#7B3F00	Rich loamy soil
    // Clay Brown	#B87333	Orange-brown clay
    // Dark Soil	#3E2C1C	Deep, moist earth
    // Sandy Dirt	#C2B280	Pale, dry soil
    // Ashen Grey	#6E6E6E	Volcanic or spent soil

    return (
        <div 
        className={`w-[100%] h-[88vh] relative flex justify-center`} ref={containerRef}>
            {(!welcome) && (
                <div className='absolute top-0 left-0 w-full h-full white-opacity z-[999999] flex items-center justify-center'>
                    {allNeeded ? (
                        <div onClick={() => setWelcome(true)} className='h-20 w-40 bg-neutral-950 rounded-lg border border-neutral-100
                        flex items-center justify-center text-sm, font-semibold cursor-pointer hover:bg-neutral-800
                        transition-colors ease-in-out duration-300'>Welcome</div>
                    ) : <div className='big-loader'></div>}
                </div>
            )}

            {(myCoords?.userStyleId.stats.energy <= 11) && ( <Wavy energy={myCoords?.userStyleId.stats.energy} /> )}

            {(myCoords?.riding && !myCoords?.held) && (
                <RideMenu rideAction={ridingAction} handleSelectAction={setAction} rideEntity={ridingEntityRef.current} />
            )}

            {(allNeeded && selectedEntity && selectedEntity.length > 0 && !isCreatePlotLoading && !myCoords?.held) && (
                <RouletteMenu energy={myCoords?.userStyleId.stats.energy} health={myCoords?.userStyleId.stats.health}
                selectedEntity={selectedEntity} currentIdx={currentIdx} setCurrentIdx={setCurrentIdx} onSelect={setAction} />
            )}

            {isCreatePlotLoading && (
                <div
                className='absolute flex items-center justify-center h-[80px] w-[80px] left-[5vh] bottom-[15vh] z-[9999999] rounded-full  white-opacity'>
                    <div className='big-loader'></div>
                </div>
            )}
            
            {(myCoords && isMobile && selectedEntity && selectedEntity.length > 0 && !myCoords?.held) && (
                <MobileCtrl setStep={setStep} />
            )}

            <InspectEntity inspect={inspect} setInspect={setInspect} myBoundRef={myBoundRef} myCoords={myCoords} emissionView={emissionView.current}
            setMyCoords={setMyCoords} mode={inspectTabMode} setMode={setInspectTabMode} setSelectedEntity={setSelectedEntity}
            sendAction={sendAction} isSendActionLoading={isSendActionLoading} cityId={myCity._id} layerCacheRef={layerCacheRef} 
            closeInspectFromOutside={closeInspect} setCloseInspectFromOutside={setCloseInspect} groupEntityMap={groupEntityMap}/>
            
            <div className='w-[100%] h-[100%]' 
            style={{background: layerIdx === 0 ? '#739860' : '#3E2C1C', 
                filter: `brightness(${1 - timeFilter})`,
                transition: 'filter 5s ease-in-out'
            }}
            >
            <TransformWrapper ref={transformRef} minScale={1} maxScale={1} initialScale={1} 
            onInit={(ref) => { transformInstanceRef.current = ref }}
            // onTransformed={(ref) => handleTransform(ref)}   
            // onPanningStop={(ref) => handlePanningStop(ref)} 
            // onZoomStop={(ref) => handleZoomStop(ref)} 
            centerOnInit limitToBounds={false} doubleClick={{ disabled: true }} 
            panning={{ disabled: true }}
            >
                <TransformComponent wrapperStyle={{
                    width: "100%",
                    height: "100%",
                    background: layerIdx === 0 ? `rgba(0, 0, 0, 0.1)` : `rgba(0, 0, 0, ${(layerIdx/10) + 0.4})`,
                }}
                contentStyle={{ width: "100%", height: "100%" }}>
                    <>
                    { allNeeded && filteredPlots.map((plot, pidx) => {
                        return (
                        <PlotWrapper 
                        key={plot.id} groupEntityMap={groupEntityMap}
                        plot={plot} scale={scale} timeFilter={timeFilter} viewport={viewportRef.current} usersInView={usersInView}
                        filteredPlots={new Set(updatedFilteredPlots.fetchFilteredPlots)} layer={plot.layers?.[layerIdx]}
                        layerIdx={layerIdx} setLayerIdx={setLayerIdx} userRef={userRef} myBoundRef={myBoundRef}
                        myCoords={myCoords?.plotId === plot.id ? myCoords: null} setMyCoords={setMyCoords} usersInViewSnapshot={usersInViewSnapshot}
                        moveUser={setStep} setSelectedEntity={setSelectedEntity} actionsMap={actionsMap} timeNow={timeNow} 
                        timeSecond={timeSecond} timeHour={timeHour} plotMarginsRef={plotMarginsRef} 
                        ridingEntityRef={ridingEntityRef} setRidingAction={setRidingAction}  />
                        )})}
                    </>
                </TransformComponent>
            </TransformWrapper>
            </div>
        </div>
    )
}

export default City
