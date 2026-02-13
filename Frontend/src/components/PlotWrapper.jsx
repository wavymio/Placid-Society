import { countryColour, countryColour2 } from '../lib/mapUtils'
import React, { act, memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import VeinyCracks from './VeinyCracks'
import { betterHash, seededRandom } from '../lib/cityUtils'
import AirAnimalEntity from './AirAnimalEntity'
import PlantEntity from './PlantEntity'
import AnimalEntity from './AnimalEntity'
import ObjectEntity from './ObjectEntity'
import LayerWrapper from './LayerWrapper'
import UserStyle from './UserStyle'
import { DateTime } from 'luxon'
import { grassStyles } from '../lib/plotUtils'
import BaseLayer from './BaseLayer'

const PlotWrapper = ({ plot, timeFilter, viewport, scale, filteredPlots, layerIdx, setLayerIdx, layer,
    usersInViewSnapshot, usersInView, userRef, myBoundRef, myCoords, setMyCoords, moveUser, setSelectedEntity, actionsMap, 
    timeNow, timeSecond, timeHour, plotMarginsRef, ridingEntityRef, setRidingAction, groupEntityMap }) => {
    const rng = useCallback(() => {
        const resultFunc = seededRandom(betterHash(`{plotX${plot.x}-plotY${plot.y}-plotId${plot.id}-layerIdx${layerIdx}`))
        for (let i = 0; i < 7; i++) resultFunc()
        return resultFunc
    }, [plot.id, plot.x, plot.y, layerIdx])

    const grassIdx = useMemo(() => !plot.isWaterPatch ? 1 : Math.floor(rng() * grassStyles.length), [plot.id])
    const ceKey = useRef(null)
    const hourRef = useRef(null)

    // const plotUsersInView = useMemo(() => {
    //     const allUsers = [ ...usersInViewSnapshot, ...(myCoords.riding ? [myCoords] : []) ]
    //     const usersINeed = []
    //     for (const user of allUsers) {
    //         if ((user.plotId === plot.id) && (user.layerIdx === layerIdx) && !user.held && !user.riding) usersINeed.push(user)
    //         else if (user.riding) usersINeed.push({ ...user.riding, mainRider: user, f: user.facing, p: [user.x, user.y], base: [user.x, user.y], })
    //     }
    //     return usersINeed
    //     // usersInViewSnapshot.filter(u => ((u.plotId === plot.id) && (u.layerIdx === layerIdx) && !u.held && !u.riding))
    // }, [usersInViewSnapshot, plot.id])
    

    const workerRef = useRef(null)
    const [visibleLayerData, setVisibleLayerData] = useState([])

    useEffect(() => {
        if (myCoords) {
            plotMarginsRef.current = plot.margins
        }
    }, [myCoords?.plotId])

    useEffect(() => {
        if (!workerRef.current) return

        const dateTime = DateTime.utc()
        const second = dateTime.second
        const prev10Second = second - (second % 10)
        const next10Second = (prev10Second + 10) % 60

        const prevHour = dateTime.hour 
        const prevMinute = dateTime.minute 
        const prevHourMin = `${prevHour}-${prevMinute}`
        
        let nextHour = dateTime.hour 
        let nextMinute = dateTime.minute 
        if (next10Second === 0) { 
            nextMinute += 1 
            if (nextMinute === 60) { 
                nextMinute = 0 
                nextHour = (nextHour + 1) % 24
            }
        } 
        const nextHourMin = `${nextHour}-${nextMinute}`
        const hourChanged = hourRef.current !== timeHour
        const fetchTimetable = hourChanged
        if (hourChanged) hourRef.current = timeHour

        workerRef.current.postMessage({
            layer, layerIdx,
            plot,
            usersInViewSnapshot,
            viewport,
            scale, groupEntityMap,
            myCoords, fetchTimetable,
            timeData: { second, prev10Second, next10Second, prevHourMin, nextHourMin, timeHour, currentMs: Date.now() }
        })
    }, [timeSecond])

    // console.log("Plot Layer", layer)
    useEffect(() => {
        if (workerRef.current) return
        if (!layer) return
        workerRef.current = new Worker(new URL('../workers/plotWorker.js', import.meta.url), { type: 'module' })
        workerRef.current.onmessage = (e) => {
            const { visibleEntities, ceKey: ceKeyVal, newEntities, ridingEntity } = e.data
            layer.entities = newEntities
            ceKey.current = ceKeyVal
            setVisibleLayerData(visibleEntities)
            if (myCoords) {
                const ridingActionChanged = (ridingEntity?.ins ?? null) !== (ridingEntityRef.current?.ins ?? null)
                if (ridingActionChanged) setRidingAction(ridingEntity?.ins)
                ridingEntityRef.current = (ridingEntity ?? null)
            }
        }

        return () => {
            workerRef.current?.terminate()
            workerRef.current = null
            hourRef.current = null
        }
    }, [layer, myCoords?.plotId])

    const walls = layer?.walls

    const hasLeftRoad = (plot.id % 50 === 1 && !plot.waterPatch)
    const hasRightRoad = plot.waterPatch ? false : true
    const hasTopRoad = (plot.id <= 50 && !plot.waterPatch)
    const hasBottomRoad = plot.waterPatch ? false : true
    const bottomRoadIsWide = plot.id % 50 === 0 && plot.id !== 1000
    const isNight = timeFilter > 0.7

    useEffect(() => {
        if (myCoords && (["land", "water", "road"].includes(ceKey.current))) {
            // console.log(myCoords.on)
            // console.log(plot)
            // console.log(ceKey.current)
            const theEarthlies = layer?.earthlies[myCoords.on]
            const earthlyEntities = theEarthlies?.map((e, eidx) => ({...e, t: groupEntityMap["earthly"][e.t] }))
            setSelectedEntity(earthlyEntities)
        }
    }, [ceKey.current])

    return (
        <>
        {/* GROUND ACTIVITY LAYER Z-200 */}
        <LayerWrapper height={plot.height} width={plot.width} x={plot.x} y={plot.y} zIndex={300} bg1='' bg2='' >
            {visibleLayerData?.map((entity, eidx) => {
                const isUser = entity.userStyleId 
                const eKey = isUser ? entity._id : entity.id
                const compareKey = isUser ? entity._id : `${entity.t}-${entity.p[0]}-${entity.p[1]}`
                const closest = ceKey.current === compareKey
                return (
                    <React.Fragment key={entity._id || eKey}>
                     {entity.grp === "plant" && ( 
                        <PlantEntity key={`${entity._id}-${entity.s}` || eKey} entity={entity} plantTypes={groupEntityMap[entity.grp]} timeFilter={timeFilter}
                        closest={closest} setSelectedEntity={setSelectedEntity} />
                    )}
                    {entity.grp === "animal" && (
                        <AnimalEntity key={entity._id || eKey} entity={entity} animalTypes={groupEntityMap[entity.grp]} timeFilter={timeFilter} 
                        closest={closest} setSelectedEntity={setSelectedEntity}
                        setMyCoords={setMyCoords} usersInView={usersInView} groupEntityMap={groupEntityMap}
                        riderIsMe={entity.mainRider && (entity.mainRider._id === myCoords?._id) ? true : false} />
                    )}
                    {/* {entity.grp === "airAnimal" && (
                        <AirAnimalEntity key={entity._id || eKey} isNight={isNight} entity={entity} animalTypes={groupEntityMap[entity.grp]} timeFilter={timeFilter} 
                        closest={closest} setSelectedEntity={setSelectedEntity} plotId={plot.id} />
                    )} */}
                    {(["object", "food", "leaf", "fruit", "element"].includes(entity.grp)) && (
                        <ObjectEntity key={entity._id || eKey} entity={entity} objectTypes={groupEntityMap[entity.grp]} timeFilter={timeFilter} 
                        closest={closest} setSelectedEntity={setSelectedEntity}/>
                    )}
                    {/* {entity.grp === "naturalResource" && (
                        <AirAnimalEntity />
                    )} */}
                    {(entity.userStyleId && !entity.riding) && (
                        <UserStyle timeFilter={timeFilter} key={entity._id} myCoords={entity} userRef={null} myId={myCoords?._id ?? null}
                        closest={closest} setSelectedEntity={setSelectedEntity} usersInView={usersInView} actionsMap={actionsMap}
                        groupEntityMap={groupEntityMap} />
                    )}
                    </React.Fragment>
                )
            })}
            {(myCoords && myCoords?.plotId === plot.id && !myCoords.riding && !myCoords.held) && (
                <UserStyle groupEntityMap={groupEntityMap} setMyCoords={setMyCoords} timeFilter={timeFilter} myCoords={myCoords} userRef={userRef} actionsMap={actionsMap}/>
            )}

            {/* UNDERGROUND WALLS */}
            {/* {(layerIdx > 0) && (
                <>
                {!plot.waterPatch && (
                <>
                {walls?.t && (
                    <Wall bg={plot.waterPatch ? '' : '#3E2C1C'} filter={`brightness(${1 - ((layerIdx/10) + 0.32)})`}
                    height={200} width={hasLeftRoad ? 1960 : 1820} loc={'t'}
                    plotId={plot.id} skew={'skewX(30deg)'} zIndex={-9999}
                    top={hasTopRoad ? -320 : -200} left={hasLeftRoad ? -197 : -57} border={plot.waterPatch ? '' : 'border-[3px] border-[#000]'}
                    viewable={true} waterPatch={plot.waterPatch} layerIdx={layerIdx} rng={rng} />
                )}

                {walls?.b && (
                    <Wall bg={plot.waterPatch ? '' : '#3E2C1C'} filter={`brightness(${1 - ((layerIdx/10) + 0.55)})`}
                    height={200} width={hasLeftRoad ? 1960 : 1820} loc={'b'}
                    plotId={plot.id} skew={'skewX(30deg)'} zIndex={30000}
                    bottom={-120} left={hasLeftRoad ? -197 : -57} border={plot.waterPatch ? '' : 'border-[3px] border-[#000]'}
                    viewable={true} waterPatch={plot.waterPatch} layerIdx={layerIdx} rng={rng} />
                )}

                {walls?.r && (
                    <Wall bg={plot.waterPatch ? '' : '#3E2C1C'} filter={`brightness(${1 - ((layerIdx/10) + 0.55)})`}
                    height={hasTopRoad ? 1740 : 1620} width={115} loc={'r'}
                    plotId={plot.id} skew={'skewY(60deg)'} zIndex={30000}
                    bottom={-20} right={-140} border={plot.waterPatch ? '' : 'border-[3px] border-[#000]'}
                    viewable={true} waterPatch={plot.waterPatch} layerIdx={layerIdx} rng={rng} />
                )}

                {walls?.l && (
                    <Wall bg={plot.waterPatch ? '' : '#3E2C1C'} filter={`brightness(${1 - ((layerIdx/10) + 0.32)})`}
                    height={hasTopRoad ? 1740 : 1620} width={117} loc={'l'}
                    plotId={plot.id} skew={'skewY(60deg)'} zIndex={-9999}
                    bottom={-20} left={hasLeftRoad ? -255 : -115} border={plot.waterPatch ? '' : 'border-[3px] border-[#000]'}
                    viewable={true} waterPatch={plot.waterPatch} layerIdx={layerIdx} rng={rng} />
                )}
                </>
                )}

                <div className={`absolute ${plot.waterPatch ? '' : 'border-[2px] border-[#21170f]'}`}
                style={{ 
                    width: hasLeftRoad ? `1960px` : `1820px`,
                    height: hasTopRoad ? `1740px` : `1620px`,
                    bottom: plot.waterPatch ? '200px' : '80px',
                    left: hasLeftRoad ? '-255px' : '-115px',
                    background: plot.waterPatch ? 'repeating-radial-gradient(circle, rgba(0, 0, 0, 0.15) 0px, rgba(0, 0, 0, 0.15) 1px, transparent 3px)'
                    : myCoords.plotId === plot.id ? 'repeating-radial-gradient(circle, #3e2c1c 0px, #3e2c1c 1px, transparent 3px)'
                    :'#3E2C1C',
                    filter: myCoords.plotId === plot.id ? '' : `brightness(${1 - ((layerIdx/10) + 0.35)})`,
                    opacity: (myCoords.plotId === plot.id && !plot.waterPatch) ? 0.45 : 1,
                    pointerEvents: 'none',
                    zIndex: 60
                }}>
                    {(!plot.waterPatch && myCoords.plotId !== plot.id) && (
                        <div className='h-full w-full absolute top-0 left-0 overflow-hidden'>
                            <VeinyCracks width={hasLeftRoad ? 1960 : 1820} height={hasTopRoad ? 1740 : 1620} count={10} segments={6} rng={rng} />
                        </div>
                    )}
                </div>
                </>
            )} */}
        </LayerWrapper>        

        {/* PLOT NODES LAYER Z-200 LAYER */}
        <LayerWrapper height={plot.height} width={plot.width} x={plot.x} y={plot.y} zIndex={200} bg1='' bg2=''
        withRoad={true} timeFilter={timeFilter} plotId={plot.id} isWaterPatch={plot.waterPatch} moveUser={moveUser}
        myBoundRef={myBoundRef} myPlotId={myCoords?.plotId} layerIdx={layerIdx}
        walls={walls} modHeight={plot.modHeight} modWidth={plot.modWidth} xOffset={plot.xOffset} yOffset={plot.yOffset} 
        skewOffset={plot.skewOffset} topOffset={plot.topOffset} leftOffset={plot.leftOffset} baseContentWidth={plot.bcw} >           
        </LayerWrapper>

        {/* BASE LAYER Z-100 */}
        <BaseLayer isFiltered={filteredPlots.has(plot.id)} grassIdx={grassIdx} grassStyles={grassStyles}
        layerIdx={layerIdx} plotHeight={plot.height} plotId={plot.id} plotWaterPatch={plot.waterPatch} plotWidth={plot.width}
        plotX={plot.x} plotY={plot.y} rng={rng} timeFilter={timeFilter} key={plot.id} />
        </>
    )
}

export default PlotWrapper