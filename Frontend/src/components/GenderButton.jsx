import React from 'react'

const GenderButton = ({ text, inputs, setInputs }) => {
    return (
        <div className={`w-[30%] border
        ${inputs.gender === text ? "border-white bg-neutral-800 font-semibold" : "border-neutral-800  bg-inherit"} 
        p-3 rounded-lg flex items-center justify-center cursor-pointer capitalize
        hover:border-white hover:bg-neutral-800 hover:font-semibold transition-all ease-in-out duration-300`}
        onClick={() => setInputs(prev => ({ ...prev, gender: text }))}>{text}</div>
    )
}

export default GenderButton
