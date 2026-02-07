import React from 'react'

const EnergyBar = ({ quantity, max, hideNumbers=false, className=null, style=null }) => {
    const getColor = (percent) => {
        if (percent > 90) return 'bg-green-700'
        else if (percent > 60) return 'bg-lime-400'
        else if (percent > 45) return 'bg-yellow-400'
        else if (percent > 20) return 'bg-orange-400'
        else return 'bg-red-700'
    }
    const percent = Math.floor(quantity/max * 100)

    return (
        <div style={style} 
        className={`${className ? className : 'relative text-[10px] h-[35px] w-[150px] rounded-lg'} border border-neutral-900 overflow-hidden 
        flex items-center justify-center font-special font-extralight text-white`}>
            <div style={{ width: `${percent}%` }} className={`absolute top-0 left-0 h-full ${getColor(percent)} z-0`}></div>
            {!hideNumbers && (<div className='relative z-10'>{quantity} / {max}</div>)}
        </div>
    )
}

export default EnergyBar
