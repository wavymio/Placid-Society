import React from 'react'

const TabChanger = ({ tab, changeTabs, source }) => {
    return (
        <div className='px-10 flex items-center justify-center gap-5 sm:gap-10 border-b-1 border-neutral-800 w-full'>
            {!source && (
                <>
                <div className={`w-36 cursor-pointer hidden sm:flex whitespace-nowrap justify-center pb-3 text-xs font-semibold transition-colors ease-in-out duration-300 ${tab === "invites" ? "border-b-2 border-white" : "text-neutral-400"}`} onClick={() => changeTabs("invites")}>
                    INVITED USERS
                </div>
                <div className={`w-36 px-2 cursor-pointer flex sm:hidden whitespace-nowrap justify-center pb-3 text-[11px] xs:text-xs font-semibold transition-colors ease-in-out duration-300 ${tab === "invites" ? "border-b-2 border-white" : "text-neutral-400"}`} onClick={() => changeTabs("invites")}>
                    INVITES
                </div>
                <div className={`w-36 cursor-pointer hidden sm:flex whitespace-nowrap justify-center pb-3 text-xs font-semibold transition-colors ease-in-out duration-300 ${tab === "requests" ? "border-b-2 border-white" : "text-neutral-400"}`} onClick={() => changeTabs("requests")}>
                    ROOM REQUESTS
                </div>
                <div className={`w-36 px-2 cursor-pointer flex sm:hidden whitespace-nowrap justify-center pb-3 text-[11px] xs:text-xs font-semibold transition-colors ease-in-out duration-300 ${tab === "requests" ? "border-b-2 border-white" : "text-neutral-400"}`} onClick={() => changeTabs("requests")}>
                    REQUESTS
                </div>
                </>
            )}

            {source === "building-requests" && (
                <>
                <div className={`w-36 cursor-pointer hidden sm:flex whitespace-nowrap justify-center pb-3 text-xs font-semibold transition-colors ease-in-out duration-300 ${tab === "pending" ? "border-b-2 border-white" : "text-neutral-400"}`} onClick={() => changeTabs("pending")}>
                    PENDING REQUESTS
                </div>
                <div className={`w-36 px-2 cursor-pointer flex sm:hidden whitespace-nowrap justify-center pb-3 text-[11px] xs:text-xs font-semibold transition-colors ease-in-out duration-300 ${tab === "pending" ? "border-b-2 border-white" : "text-neutral-400"}`} onClick={() => changeTabs("pending")}>
                    PENDING
                </div>
                <div className={`w-36 cursor-pointer hidden sm:flex whitespace-nowrap justify-center pb-3 text-xs font-semibold transition-colors ease-in-out duration-300 ${tab === "closed" ? "border-b-2 border-white" : "text-neutral-400"}`} onClick={() => changeTabs("closed")}>
                    CLOSED REQUESTS
                </div>
                <div className={`w-36 px-2 cursor-pointer flex sm:hidden whitespace-nowrap justify-center pb-3 text-[11px] xs:text-xs font-semibold transition-colors ease-in-out duration-300 ${tab === "closed" ? "border-b-2 border-white" : "text-neutral-400"}`} onClick={() => changeTabs("closed")}>
                    CLOSED
                </div>
                </>
            )}
        </div>
    )
}

export default TabChanger
