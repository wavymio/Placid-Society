import React, { useState } from 'react'
import RoomInvitesTab from './RoomInvitesTab'
import RoomRequestsTab from './RoomRequestsTab'
import TabChanger from './TabChanger'

const InvitesTab = ({ room, loggedInUser }) => {
    const [tab, setTab] = useState("invites")

    const changeTabs = (tabName) => {
        setTab(tabName)
    }

    return (
        <div className='-mt-10 xs:mt-0 sm:mt-16 md:mt-0 w-[260px] xs:w-[350px] sm:w-[470px] md:w-[550px] lg:w-[600px] min-h-[250px] relative bg-black border border-neutral-900 rounded-2xl px-8 py-8 max-h-[300px] xs:max-h-[400px] flex flex-col gap-5 items-center'>
            {/* <div className='flex flex-col items-center justify-center w-full sm:px-0 md:px-16 lg:px-60 mt-0 sm:mt-2'> */}
            <TabChanger changeTabs={changeTabs} tab={tab} />
            {tab === "invites" && (
                <RoomInvitesTab room={room} loggedInUser={loggedInUser} />
            )}
            {tab === "requests" && (
                <RoomRequestsTab room={room} loggedInUser={loggedInUser} />
            )}
        </div>
    )
}

export default InvitesTab
