import React from 'react'

const MobileCtrlRounder = ({ setStep, rounderKey }) => {
    return (
        <div className='absolute top-[-10px] left-[-10px] rounded-full w-[70px] h-[70px]'
        onClick={(e) => setStep({ preventDefault: () => null, key: rounderKey })} />
    )
}

export default MobileCtrlRounder
