import React from 'react'

const Road = ({ top='', left='', bottom='', right='', width='', height='', bgImg=null, bgColor, bgSize, axis, timeFilter, loc, 
    plotId, yOffset, xOffset, dataWidth, dataHeight, dataSkewOffset }) => {
    return (
        <div className={`absolute`} 
        data-plot-id={plotId}
        data-surface-name='road'
        data-road-loc={loc}
        data-y-offset={yOffset}
        data-x-offset={xOffset}
        data-width={dataWidth}
        data-height={dataHeight}
        data-skew-offset={dataSkewOffset}
        style={{ 
            width: width, 
            height: height,
            top: top,
            left: left,
            bottom: bottom,
            right: right,
            background: bgImg ? `url(${bgImg}), ${bgColor}` : bgColor,
            ...(bgImg ? {backgroundRepeat: axis === 'x' ? 'repeat-x' : 'repeat-y',
            backgroundSize: bgSize,
            backgroundPosition: 'center'} : {}),
            filter: `brightness(${1 - timeFilter})`,
        }}></div>
    )
}

export default Road
