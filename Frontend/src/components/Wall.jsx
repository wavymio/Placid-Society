import React from 'react'
import VeinyCracks from './VeinyCracks'

const Wall = ({ width, height, top, left, right, bottom, loc, skew, bg, filter, zIndex, plotId, border='', 
    viewable=false, waterPatch=false, layerIdx, rng }) => {
    return (
        <div className={`absolute ${border}`}
        data-wall-plot-id={plotId}
        data-surface-name={"wall"}
        data-wall-type={waterPatch ? "water" : "land"}
        data-wall-loc={loc}
        style={{ 
            width: `${width}px`,
            height: `${height}px`,
            top: (top || top === 0) ? `${top}px` : null,
            left: (left || left === 0) ? `${left}px` : null,
            bottom: (bottom || bottom === 0) ? `${bottom}px` : null,
            right: (right || right === 0) ? `${right}px` : null,
            transform: skew,
            // background: plot.waterPatch ? '' : '#3E2C1C',
            background: bg,
            filter: filter,
            zIndex: zIndex
        }}>
            {(viewable && !waterPatch && layerIdx > 0) && (
                <div className='h-full w-full absolute top-0 left-0 overflow-hidden'>
                    <VeinyCracks width={width} height={height} count={10} segments={6} rng={rng} skew={skew} />
                </div>
            )}
        </div>
    )
}

export default Wall
