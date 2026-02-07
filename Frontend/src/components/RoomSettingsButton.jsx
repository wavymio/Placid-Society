import React from 'react'

const RoomSettingsButton = ({ children, tab, setTab, title, selectorText }) => {
    const activeTabStyle = "bg-neutral-900"

    return (
        <div onClick={() => tab === selectorText ? closeComponent() : setTab(selectorText)}className={`flex items-center justify-center ${tab === selectorText ? 'bg-neutral-800' : activeTabStyle } h-9 w-9 xs:h-12 xs:w-12 sm:h-14 sm:w-14 rounded-xl cursor-pointer transition-transform duration-300 ease-in-out hover:scale-125`} title={title}>
            {children}
        </div>
    )
}

export default RoomSettingsButton
