import React from 'react'

const LandPlotNodes = ({ moveToNode }) => {
    return (
        <>
        { Array.from({ length: 42 }).map((node, i) => {
            const columnIndex = i % 7
            const rowIndex = Math.floor(i / 7)

            const topPosition = rowIndex * 80;
            const leftPosition = columnIndex * 80;

            return (
                <div key={`${node}-${i}`} 
                onClick={moveToNode}
                className='cursor-pointer group w-[100px] h-[100px] absolute'
                style={{
                    top: topPosition,
                    left: leftPosition,
                    zIndex: 0,
                    transform: 'rotateX(-30deg) rotateZ(0deg) scaleY(1.45)',
                }} />
            );
        })}
        </>
    )
}

export default LandPlotNodes
