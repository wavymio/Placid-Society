import React, { useEffect } from 'react'
import Road from './Road'
import Wall from './Wall'

const LayerWrapper = ({ children, width, height, x, y, zIndex, bg1='', bg2='', withRoad=false, 
xOffset, yOffset, skewOffset, modWidth, modHeight, topOffset, leftOffset, baseContentWidth,
myBoundRef, myPlotId, timeFilter, plotId, isWaterPatch, moveUser, layerIdx, walls }) => {
    // if (myBoundRef) console.log("Layer Wrapper </> ...")

    useEffect(() => {
        if (myPlotId === plotId && myBoundRef?.current) {
            myBoundRef.current.focus({ preventScroll: true })
            console.log("FOCUSING: ", plotId)
        }
    }, [myPlotId, plotId])


    return (
        <div className=''
            style={{
                width: `${width}px`,
                height: `${height}px`,
                transform: `translate3d(${x}px, ${y}px, 0)`,
                transformOrigin: 'top left',
                position: 'absolute',
                willChange: 'transform',
                zIndex,
                pointerEvents: 'none',
                background: bg1,
                // background: 'rgb(134 239 172)'
                
            }}>
                <div className='relative' 
                style={{ width: '100%', height: '100%', transform: 'skewX(-30deg)', transformOrigin: 'top left', 
                pointerEvents: 'none', overflow: 'visible',
                background: bg2 
                // background: 'rgb(253 224 71)' 
                }}>
                    {children}

                    {withRoad && (
                        <div ref={myPlotId === plotId ? myBoundRef : null}
                        tabIndex={myPlotId === plotId ? 0 : -1}
                        data-plot-id={plotId}
                        data-surface-name={isWaterPatch ? "water" : "land"}
                        data-x-offset={xOffset}
                        data-y-offset={yOffset}
                        data-width={modWidth}
                        data-height={modHeight}
                        data-skew-offset={skewOffset}
                        data-wall-t={walls?.t}
                        data-wall-r={walls?.r}
                        data-wall-b={walls?.b}
                        data-wall-l={walls?.l}
                        className="absolute focus:outline-none"
                        onKeyDown={(e) => moveUser(e)}
                        style={{
                            width: `${modWidth}px`,
                            height: `${modHeight}px`,
                            top: `-${topOffset}px`,
                            left: `-${leftOffset}px`,
                            zIndex: 1,
                            pointerEvents: 'auto'
                        }}
                        >
                            {/* UNDERGROUND WALL LAYOUT */}
                            {(layerIdx > 0) && (
                                <>
                                {/* Top Side */}
                                {walls?.t && (
                                    <Wall 
                                    bg={''} 
                                    // bg={'green'} 
                                    filter={`brightness(${1 - ((layerIdx/10) + 0.32)})`}
                                    height={200} width={hasLeftRoad ? 1960 : 1820} loc={'t'}
                                    plotId={plotId} skew={'skewX(30deg)'} waterPatch={isWaterPatch} zIndex={1}
                                    top={hasTopRoad ? 320 : -200} left={hasLeftRoad ? -197 : -57} />
                                )}

                                {/* Bottom Side */}
                                {walls?.b && (
                                    <Wall 
                                    bg={''} 
                                    // bg={'red'} 
                                    filter={`brightness(${1 - ((layerIdx/10) + 0.55)})`}
                                    height={200} width={hasLeftRoad ? 1960 : 1820} loc={'b'}
                                    plotId={plotId} skew={'skewX(30deg)'} waterPatch={isWaterPatch} zIndex={30000}
                                    bottom={0} left={hasLeftRoad ? -197 : -57} />
                                )}

                                {/* Right Side */}
                                {walls?.r && (
                                    <Wall 
                                    bg={''} 
                                    // bg={'purple'} 
                                    filter={`brightness(${1 - ((layerIdx/10) + 0.55)})`}
                                    height={hasTopRoad ? 1740 : 1620} width={115} loc={'r'}
                                    plotId={plotId} skew={'skewY(60deg)'} waterPatch={isWaterPatch} zIndex={30000}
                                    bottom={100} right={0} />
                                )}

                                {/* Left Side */}
                                {walls?.l && (
                                    <Wall 
                                    bg={''} 
                                    // bg={'maroon'} 
                                    filter={`brightness(${1 - ((layerIdx/10) + 0.55)})`}
                                    height={hasTopRoad ? 1740 : 1620} width={117} loc={'l'}
                                    plotId={plotId} skew={'skewY(60deg)'} waterPatch={isWaterPatch} zIndex={1}
                                    bottom={100} left={hasLeftRoad ? -255 : -115} />
                                )}
                                </>
                            )}

                            {/* ROAD LAYOUT */}
                            {(!isWaterPatch && layerIdx === 0) && (
                            <>
                                {/* Right Road */}
                                <Road axis={'y'} loc={'r'}
                                bgColor={''}
                                bgSize={'114% 405px'} timeFilter={timeFilter} plotId={plotId}
                                xOffset={xOffset}
                                yOffset={yOffset}
                                dataWidth={modWidth}
                                dataHeight={modHeight}
                                dataSkewOffset={skewOffset}
                                height='1620px' width='140px' right={`${modWidth - baseContentWidth}px`} />

                                {/* Left Road */}
                                {plotId % 50 === 1 && (
                                    <Road axis={'y'} loc={'l'} 
                                    bgColor={''}
                                    bgSize={'114% 405px'} timeFilter={timeFilter} plotId={plotId}
                                    xOffset={xOffset}
                                    yOffset={yOffset}
                                    dataWidth={modWidth}
                                    dataHeight={modHeight}
                                    dataSkewOffset={skewOffset}
                                    height={modHeight} width='140px'
                                    left='0px' top='0px' />
                                )}
                                
                                {/* Bottom Road */}
                                <Road axis={'x'} loc={'b'} 
                                bgColor={''}
                                bgSize={'620px 114%'} timeFilter={timeFilter} plotId={plotId}
                                xOffset={xOffset}
                                yOffset={yOffset}
                                dataWidth={modWidth}
                                dataHeight={modHeight}
                                dataSkewOffset={skewOffset}
                                height='120px' width={`${modWidth}px`} 
                                bottom='0px' left='0px' />
                                
                                {/* Top Road */}
                                {(plotId <= 50) && (
                                    <Road axis={'x'} loc={'t'} 
                                    bgColor={''}
                                    bgSize={'620px 114%'} timeFilter={timeFilter} plotId={plotId}
                                    xOffset={xOffset}
                                    yOffset={yOffset} 
                                    dataWidth={modWidth}
                                    dataHeight={modHeight}
                                    dataSkewOffset={skewOffset}
                                    height='120px' width={`${modWidth}px`} 
                                    top='0px' />
                                )}
                            </>
                            )}
                        </div>
                    )}
                </div>
        </div>
    )
}

// export default LayerWrapper
export default React.memo(
    LayerWrapper,
    (prev, next) => {
        const childrenEmpty = !prev.children && !next.children
        return (
            childrenEmpty &&
            prev.children === next.children &&
            prev.width === next.width &&
            prev.height === next.height &&
            prev.x === next.x &&
            prev.y === next.y &&
            prev.zIndex === next.zIndex &&
            prev.bg1 === next.bg1 &&
            prev.bg2 === next.bg2 &&
            prev.withRoad === next.withRoad &&
            prev.xOffset === next.xOffset &&
            prev.yOffset === next.yOffset &&
            prev.skewOffset === next.skewOffset &&
            prev.modWidth === next.modWidth &&
            prev.modHeight === next.modHeight &&
            prev.topOffset === next.topOffset &&
            prev.leftOffset === next.leftOffset &&
            prev.baseContentWidth === next.baseContentWidth &&
            prev.myBoundRef?.current === next.myBoundRef?.current &&
            prev.myPlotId === next.myPlotId &&
            prev.plotId === next.plotId &&
            prev.timeFilter === next.timeFilter &&
            prev.isWaterPatch === next.isWaterPatch &&
            prev.moveUser === next.moveUser &&
            prev.layerIdx === next.layerIdx &&
            prev.walls === next.walls
        )
    }
)
