import React from 'react'

const LoadingTab = () => {
    return (
        <div className='overflow-y-hidden w-full h-[75vh] flex flex-col gap-7 items-center justify-center'>
            <div className='big-loader'></div>
            <div className='text-xs font-bold'>LOADING ROOM...</div>
        </div>
    )
}

export default LoadingTab
