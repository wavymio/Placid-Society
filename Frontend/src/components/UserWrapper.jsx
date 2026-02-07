import React, { Children } from 'react'
import { Outlet } from 'react-router-dom'

const UserWrapper = ({ children, riderHeight, riderWidth, top, left, zIndex, innerTop }) => {
    return (
        <div className='overflow-visible flex flex-col items-center' style={{ 
            height: `${riderHeight}px`,
            width: `${riderWidth}px`, 
            top,
            left,
            position: "absolute", transform: 'skewX(30deg)',
            zIndex,
        }}>
            <div className='h-full w-full absolute flex flex-col items-center'
            style={{ top: innerTop }}>
                {children}
            </div>
        </div>
    )
}

export default UserWrapper
