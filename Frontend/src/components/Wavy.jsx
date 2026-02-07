import React from 'react'

const Wavy = ({ energy }) => {
    // console.log("Wavy </> ...")
    return (
        <div className='absolute top-0 left-0 w-full h-full z-[99999] flex items-center justify-center'
        style={{
            backdropFilter: `blur(${energy <= 10 ?
                (10 * ((100 - energy)/100)) : 0}px)`,
            filter: energy <= 10 ? 'url(#wavy)' : 'none',
            backgroundColor: 'transparent',
            transition: 'backdrop-filter 0.6s ease-out',
            pointerEvents: 'none'
        }} >{energy <= 5 && (
            <svg width="0" height="0">
                <filter id="wavy">
                    <feTurbulence
                    type="turbulence"
                    baseFrequency="0.01"
                    numOctaves="1"
                    seed="2"
                    >
                    <animate
                        attributeName="baseFrequency"
                        dur="25s"
                        values="0.01;0.02;0.01"
                        repeatCount="indefinite"
                    />
                    </feTurbulence>
                    <feDisplacementMap in="SourceGraphic" scale="20" />
                </filter>
            </svg>
        )}</div>
        
    )
}

export default React.memo(
    Wavy,
    (prev, next) => {
        return (
            prev.energy === next.energy 
        )
    }
)
