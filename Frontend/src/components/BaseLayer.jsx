import React from 'react'
import dirtRoad from '../assets/dirt road.png'
import dirtRoadVert from '../assets/dirt road vertical.png'
import VeinyCracks from './VeinyCracks'
import Road from './Road'

const BaseLayer = ({plotId, plotX, plotY, plotWaterPatch, layerIdx, isFiltered, grassStyles, timeFilter, grassIdx, plotHeight, plotWidth, rng}) => {
    // console.log("Base Layer </> ...")
    return (
        <div className='' key={plotId}
        style={{
            // left: `${plot.x}px`,
            // top: `${plot.y}px`,
            width: '1820px',
            height: '1620px',
            transform: `translate3d(${plotX}px, ${plotY}px, 0) skewX(-30deg)`,
            transformOrigin: 'top left',
            position: 'absolute',
            willChange: 'transform',
            zIndex: 100
        }}>

            {/* Floor for Land/Water/ */}
            <div
                className={`absolute cursor-pointer `}
                style={{
                    background: (plotWaterPatch && layerIdx === 0 && (isFiltered)) ? `${grassStyles[2]}, rgba(33, 148, 183, 1)`:
                    (plotWaterPatch && layerIdx === 0) ? `${grassStyles[2]}, rgba(33, 148, 183, 1)`:
                    (plotWaterPatch && layerIdx > 0) ? `rgba(33, 148, 183, ${1 - ((layerIdx/10) + 0.35)})` :  
                    layerIdx === 0 ? grassStyles[grassIdx] : 'radial-gradient(circle at center, transparent 20%, rgba(0, 0, 0, 0.9))',
                    width: `${(plotWaterPatch || layerIdx > 0) ? 1820 : plotWidth}px`,
                    height: `${(plotWaterPatch || layerIdx > 0) ? 1620 : plotHeight}px`,
                    zIndex: 35
                }}
                onDoubleClick={() => null}
            >
                {/* Underground cracks on ground floor */}
                {(!plotWaterPatch && layerIdx > 0) && (
                    <div className='h-[1620px] w-[1820px] absolute top-0 left-0 overflow-hidden'>
                        <VeinyCracks width={1820} height={1620} count={10} segments={6} rng={rng} />
                    </div>
                )}
            </div>
            
            {/* ROADS */}
            {(!plotWaterPatch && layerIdx === 0) && (
                <>
                {/* Right Road */}
                <Road axis={'y'} bgColor={'linear-gradient(#6c6846, #6c6846)'} bgImg={dirtRoadVert}
                bgSize={'110% 405px'} timeFilter={timeFilter}
                height='1620px' width='140px' right='0px' />

                {/* Left Road */}
                {plotId % 50 === 1 && (
                    <Road axis={'y'} bgColor={'linear-gradient(#6c6846, #6c6846)'} bgImg={dirtRoadVert}
                    bgSize={'110% 405px'} timeFilter={timeFilter}
                    height={plotId === 1 ? '1740px' : '1620px'} width='140px'
                    left='-140px' top={plotId === 1 ? '-120px' : ''} />
                )}
                
                {/* Bottom Road */}
                <Road axis={'x'} bgColor={'linear-gradient(#6c6846, #6c6846)'} bgImg={dirtRoad}
                bgSize={'620px 110%'} timeFilter={timeFilter} 
                height='120px' width={(plotId % 50 === 0 && plotId !== 1000) ? '2755px' : '1820px'} 
                bottom='0px' />
                
                {/* Top Road */}
                {(plotId <= 50) && (
                    <Road axis={'x'} bgColor={'linear-gradient(#6c6846, #6c6846)'} bgImg={dirtRoad}
                    bgSize={'620px 110%'} timeFilter={timeFilter} 
                    height='120px' width='1820px' 
                    top='-120px' />
                )}
                </>
            )}
        </div>
    )
}

// export default BaseLayer
export default React.memo(
    BaseLayer,
    (prev, next) => {
        return (
            prev.plotId === next.plotId &&
            prev.plotX === next.plotX &&
            prev.plotY === next.plotY &&
            prev.plotWaterPatch === next.plotWaterPatch &&
            prev.layerIdx === next.layerIdx &&
            prev.isFiltered === next.isFiltered &&
            prev.grassStyles === next.grassStyles &&
            prev.timeFilter === next.timeFilter &&
            prev.grassIdx === next.grassIdx &&
            prev.plotHeight === next.plotHeight &&
            prev.plotWidth === next.plotWidth &&
            prev.rng === next.rng
        )
    }
)
