import React, { useEffect, useState } from 'react'
import { MdOutlineKeyboardArrowLeft, MdOutlineKeyboardArrowRight } from 'react-icons/md'
import EnergyBar from './EnergyBar'
import { updateCount } from '../lib/cityUtils'
import { IoIosInformationCircleOutline } from 'react-icons/io'
import { handleCollectEffect } from '../lib/actionUtils2'
import { ref } from '../lib/actionUtils'

const InspectEntity = React.memo(({ inspect, setInspect, myBoundRef, myCoords, setMyCoords, mode, setMode, sendAction, groupEntityMap,
    isSendActionLoading, cityId, layerCacheRef, emissionView, setSelectedEntity, closeInspectFromOutside, setCloseInspectFromOutside }) => {
    // console.log("Inspect </> ...")
    const [mounted, setMounted] = useState(false)
    const [visible, setVisible] = useState(false)
    const [pageIdx, setPageIdx] = useState(0)
    const [quantity, setQuantity] = useState(0)
    
    const handleNext = (e, data) => {
        setPageIdx(prev => (prev + 1) % data.length) // for looping
        setQuantity(0)
    }

    const handlePrev = (e, data) => {
        setPageIdx(prev => (prev - 1 + data.length) % data.length) // for looping
        setQuantity(0)
    }

    const handleItemClick = (e, max) => {
        const newQuantity = Math.min(max, quantity+1)
        setQuantity(newQuantity)
    }

    const handleCollect = async (e, t, grp, s, myBoundRef, inspect, count, max, growthTime, produceType) => {
        if (!e || !t || !grp || !inspect) return
        let droppingEarthlyData = null
        if (myCoords.holding?.grp === "earthly") { 
            const myEarthly = layerCacheRef.current.get(myCoords.plotId).layers[myCoords.layerIdx].earthlies[myCoords.on].find(eth => eth.t === myCoords.holding?.t)
            if (myEarthly) droppingEarthlyData = myEarthly
        }
        const savePayload = { 
            myCoords, 
            action: "collect", 
            parent: { _id: inspect._id, max, growthTime, s: inspect.s, [produceType]: inspect[produceType] }, 
            child: { produceType, deadAt: null, lastHitAt: null, grp, energy: 100, dna: myCoords._id, p: [0,0], t: t.name, s, q: quantity}, 
            cityId, emissionView, droppingEarthlyData
        }
        console.log(savePayload)
        const data = await sendAction(savePayload)
        if (data?.success) {
            const { results } = data
            handleCollectEffect(results, { layerCacheRef, setMyCoords, myCoords, setSelectedEntity })
        }

        // const payload = { action: "collect", entity: { parent, child: entity} }
        // handleSelectAction(payload)
        closeComponent(myBoundRef)
    }

    const handlePick = async (e, inspect, myBoundRef) => {
        if (!quantity || !inspect || !myBoundRef?.current) return
        
        const modEnt = { ...inspect, t: inspect.t.name, dna: myCoords._id, p: [0,0] }
        const savePayload = { action: "pick", myCoords, entity: modEnt, cityId, emissionView, quantity }
        // console.log(savePayload)
        const data = await sendAction(savePayload)
    } 

    const handleDrop = async (e, inspect, myBoundRef) => {
        if (!quantity || !inspect || !myBoundRef?.current || !myCoords || !cityId || !emissionView) return

        const modEnt = { ...inspect, t: inspect.t.name, dna: myCoords._id, p: [myCoords.x, myCoords.y] }
        const savePayload = { action: "drop", myCoords, entity: modEnt, cityId, emissionView, quantity }
        // console.log(savePayload)
        const data = await sendAction(savePayload)
    }

    const closeComponent = (myBoundRef) => {
        myBoundRef.current?.focus()
        setVisible(false)
    }

    useEffect(() => {
        if (inspect) {
            console.log({ inspect })
            myBoundRef.current?.blur()
            setQuantity(0)
            setMounted(true)
            const timer = setTimeout(() => setVisible(true), 50)
            return () => clearTimeout(timer)
        } 
    }, [inspect])

    useEffect(() => {
        if (closeInspectFromOutside) closeComponent(myBoundRef)
    }, [closeInspectFromOutside])

    useEffect(() => {
        if (!visible) {
            const timer = setTimeout(() => {
                setMounted(false)
                setInspect(null)
                setCloseInspectFromOutside(false)
                setMode("inspect")
                setPageIdx(0)
                setQuantity(0)
            }, 300)
            return () => clearTimeout(timer)
        }
    }, [visible])

    const inspectState = inspect?.t.states[inspect.s]
    const picture = inspectState?.purl.x ? inspectState?.purl.x.p : inspectState?.purl ? inspectState?.purl : ''
    const name = inspect?.t.name ?? ''
    const energy = inspect?.energy

    const hasPrimary = inspect?.primary
    const primaryGrp = hasPrimary ? ref[inspect?.grp]?.[0][0] : null
    const primaryState = hasPrimary ? ref[inspect?.grp]?.[0][1] : null
    const primary = hasPrimary ? groupEntityMap[primaryGrp]?.[inspectState?.primary?.name] : null

    const hasSecondary = inspect?.secondary
    const secondaryGrp = hasSecondary ? ref[inspect?.grp]?.[1][0] : null
    const secondaryState = hasSecondary ? ref[inspect?.grp]?.[1][1] : null
    const secondary = hasSecondary ? groupEntityMap[secondaryGrp]?.[inspectState?.secondary?.name] : null
    
    const hasResource = inspectState?.resource
    const resourceGrp = hasResource ? ref[inspect?.grp]?.[2][0] : null
    const resourceState = hasResource ? ref[inspect?.grp]?.[2][1] : null
    const resource = hasResource ? groupEntityMap[resourceGrp]?.[hasResource?.name] : null
    const resourceCount = hasResource?.max

    const growthTime = inspect?.t.growth
    const resourceGrowthTime = inspect?.t.resourceGrowth
    // updateCount(100, energy, 30000, inspect?.lastHitAt)

    const data = [
        {
            name,
            picture,
            count: mode === "inspect" ?  energy : inspect.q, 
            max: mode === "inspect" ? 100 : inspect.q,
            produceType: null,
            grp: mode === "inspect" ? null : inspect.grp,
            t: mode === "inspect" ? null : inspect.t,
            s: mode === "inspect" ? null : inspect.s,
            growthTime
        },
        ...(hasPrimary ? [{
            name: inspectState.primary?.name,
            picture: primary.states[primaryState].purl,
            count: updateCount(inspectState.primary.max, hasPrimary.count, resourceGrowthTime, hasPrimary.lastGenerated),
            max: inspectState.primary.max,
            produceType: "primary",
            grp: primaryGrp,
            t: primary,
            s: primaryState,
            growthTime: resourceGrowthTime
        }] : []),
        ...(hasSecondary ? [{
            name: inspectState.secondary?.name,
            picture: secondary.states[secondaryState].purl,
            count: updateCount(inspectState.secondary.max, hasSecondary.count, resourceGrowthTime, hasSecondary.lastGenerated),
            max: inspectState.secondary.max,
            produceType: "secondary",
            grp: secondaryGrp,
            t: secondary,
            s: secondaryState,
            growthTime: resourceGrowthTime
        }] : []),
        ...(hasResource ? [{
            name: inspectState.resource?.name,
            picture: resource.states[resourceState].purl,
            count: resourceCount ?? 0,
            max: resourceCount ?? 0,
            produceType: resourceGrp,
            grp: resourceGrp,
            t: resource,
            s: resourceState,
            growthTime: resourceGrowthTime
        }] : [])
    ]


    return (
        <>
        {mounted && (
            <div className={`w-full h-1/2 absolute left-0 bottom-0 bg-black z-[99999999] rounded-t-3xl overflow-hidden
            transition-transform duration-300 ${visible ? "translate-y-0" : "translate-y-[110%]"}`}>
                <div onClick={() => isSendActionLoading ? null : closeComponent(myBoundRef)}
                className='w-[20%] bg-neutral-200 h-2 absolute left-[40%] top-0 rounded-b-lg cursor-pointer z-[99]'></div>
                {(pageIdx > 0 && !isSendActionLoading) && (
                    <div onClick={(e) => handlePrev(e, data)} className='absolute top-[45%] left-[5%] h-[40px] w-[40px] rounded-lg bg-neutral-900 cursor-pointer z-[99] flex items-center justify-center'>
                        <MdOutlineKeyboardArrowLeft className='h-[20px] w-[20px]'/>
                    </div>
                )}
                {(pageIdx < data.length-1 && !isSendActionLoading) && (
                    <div onClick={(e) => handleNext(e, data)} className='absolute top-[45%] right-[5%] h-[40px] w-[40px] rounded-lg bg-neutral-900 cursor-pointer z-[99] flex items-center justify-center'>
                        <MdOutlineKeyboardArrowRight className='h-[20px] w-[20px]'/>
                    </div>
                )}

                {/* Carousel */}
                <div
                    className="flex h-full w-full transition-transform duration-500"
                    style={{ transform: `translateX(-${pageIdx * 100}%)` }}
                >
                    {data && data.map(({name, picture, count, max, produceType, grp, t, s, growthTime}, didx) => (
                        <div key={didx} className={`flex flex-shrink-0 items-center justify-center gap-10 h-full w-full`}>
                            <div className=' h-[60%] w-[25%] lg:w-[15%] bg-neutral-900 rounded-xl flex items-center justify-center'>          
                                <img src={picture ?? ''} className='h-[80%] w-[80%] object-contain cursor-pointer'
                                onClick={(e) => ((mode === "inspect" && (produceType && produceType !== "resource")) || (mode === "pick" || mode === "drop"))
                                    ? handleItemClick(e, count) : null} />
                            </div>  

                            <div className='flex flex-col items-start justify-start h-[60%] gap-4'>
                                <div className='capitalize font-semibold text-white text-lg font-special'>{name}</div>
                                <EnergyBar quantity={count} max={max} />
                                {((mode === "inspect" && (produceType && produceType !== "resource")) || (mode === "pick" || mode === "drop")) && (
                                    <>
                                    {/* <input className='h-[35px] w-[150px] text-center rounded-lg bg-transparent
                                    border border-neutral-900 text-white text-xs font-special outline-none'
                                    value={quantity} type='text' onChange={(e) => handleQuantityChange(e, count)}/> */}
                                    <div className='text-[10px] font-special flex items-center gap-1'>
                                        <IoIosInformationCircleOutline /> Click on the item to pick
                                    </div>
                                    {(quantity > 0 && count > 0) && (
                                    <div
                                    onClick={ isSendActionLoading ? () => null
                                        : mode === "inspect" ? (e) => (!quantity || !produceType || produceType === "resource") ? null : handleCollect(e, t, grp, s, myBoundRef, inspect, count, max, growthTime, produceType)
                                        : mode === "pick" ? (e) => handlePick(e, inspect, myBoundRef)
                                        : mode === "drop" ? (e) => handleDrop(e, inspect, myBoundRef)
                                        : () => null
                                    } 
                                    className={`h-[35px] w-[150px] flex items-center justify-center text-xs
                                    font-special bg-neutral-900 rounded-lg ${isSendActionLoading ? '' : 'cursor-pointer hover:bg-neutral-800'} 
                                    transition-all duration-300 ease-in-out capitalize`}>
                                        {isSendActionLoading ? (
                                            <div className='loader'></div>
                                        ) : (
                                            <>{mode === "inspect" ? "collect" : `${mode}`} {quantity}</>
                                        )}
                                        
                                    </div>
                                    )}
                                    </>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

            </div>
        )}
        </>
    )
})

export default React.memo(InspectEntity, (prev, next) => {
  return (
    prev.inspect === next.inspect &&
    prev.setInspect === next.setInspect &&
    prev.myBoundRef?.current === next.myBoundRef?.current &&
    prev.myCoords === next.myCoords &&
    prev.setMyCoords === next.setMyCoords &&
    prev.mode === next.mode &&
    prev.setMode === next.setMode &&
    prev.sendAction === next.sendAction &&
    prev.isSendActionLoading === next.isSendActionLoading &&
    prev.cityId === next.cityId &&
    prev.layerCacheRef?.current === next.layerCacheRef?.current &&
    prev.emissionView === next.emissionView &&
    prev.setSelectedEntity === next.setSelectedEntity &&
    prev.closeInspectFromOutside === next.closeInspectFromOutside &&
    prev.setCloseInspectFromOutside === next.setCloseInspectFromOutside
  )
})