import React from 'react'

const TabBtn = ({ name, activeTab, setActiveTab }) => {
    const same = activeTab === name
    return (
        <div onClick={same ? () => null : () => setActiveTab(name)} 
        className={`text-[10px] font-extrabold p-2 h-[35px] w-[80px] rounded-lg 
        flex items-center justify-center ${same ? 'bg-red-900 text-white' : 'bg-white text-neutral-800'} capitalize
        ${same ? '' : 'cursor-pointer hover:bg-neutral-900 hover:text-white'} transition-all ease-in-out duration-300`}>{name}</div>
    )
}

export default TabBtn
