import React from 'react'
import { LuArrowBigDown, LuArrowBigLeft, LuArrowBigRight, LuArrowBigUp } from 'react-icons/lu'

const MobileCtrl = ({ setStep }) => {
    // console.log("Mobile Ctrl </> ...")
    return (
        <div style={{ pointerEvents: 'none' }} onMouseDown={(e) => e.preventDefault()} className='h-[100px] w-[100px] absolute rounded-full bottom-[75px] left-[30px] z-[999]'>
            <div style={{ pointerEvents: 'none' }} className='w-full h-full rounded-full relative'>
                <div style={{ pointerEvents: 'auto' }} onClick={(e) => setStep({ preventDefault: () => null, key: "ArrowUp" })} className='top-[-25px] left-[25px] white-opacity border border-white rounded-full h-[50px] w-[50px] absolute flex items-center justify-center'>
                    <LuArrowBigUp className='h-8 w-8' fill='#e5e5e5' stroke='white' strokeWidth={0.7} />
                </div>
                <div style={{ pointerEvents: 'auto' }} onClick={(e) => setStep({ preventDefault: () => null, key: "ArrowDown" })} className='top-[75px] left-[25px] white-opacity border border-white rounded-full h-[50px] w-[50px] absolute flex items-center justify-center'>
                    <LuArrowBigDown className='h-8 w-8' fill='#e5e5e5' stroke='white' strokeWidth={0.7} />
                </div>
                <div style={{ pointerEvents: 'auto' }} onClick={(e) => setStep({ preventDefault: () => null, key: "ArrowLeft" })} className='top-[25px] left-[-25px] white-opacity border border-white rounded-full h-[50px] w-[50px] absolute flex items-center justify-center'>
                    <LuArrowBigLeft className='h-8 w-8' fill='#e5e5e5' stroke='white' strokeWidth={0.7} />
                </div>
                <div style={{ pointerEvents: 'auto' }} onClick={(e) => setStep({ preventDefault: () => null, key: "ArrowRight" })} className='top-[25px] left-[75px] white-opacity border border-white rounded-full h-[50px] w-[50px] absolute flex items-center justify-center'>
                    <LuArrowBigRight className='h-8 w-8' fill='#e5e5e5' stroke='white' strokeWidth={0.7} />
                </div>
            </div>
        </div>
    )
}

// export default MobileCtrl

export default React.memo(
    MobileCtrl,
    (prev, next) => {
        return (
            prev.setStep === next.setStep
        )
    }
)
