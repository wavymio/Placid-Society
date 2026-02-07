import React from 'react'

const MaxSetter = ({ buttonText, value, valueChanger, color = 'bg-teal-950', disabled }) => {
    return (
        <div className='w-[400px] h-14 rounded-lg flex items-center'>
            <button type='button' disabled={true} className={`w-[40%] h-full ${color} text-white font-semibold
            flex items-center justify-center rounded-l-lg text-sm`}>
                {buttonText}
            </button>
            <input disabled={disabled} className=' border rounded-r-lg border-neutral-800 h-full w-[60%] px-4 bg-black outline-none
            text-sm text-white font-semibold'
            type='text' value={value} onChange={valueChanger} />
        </div>
    )
}

export default MaxSetter
