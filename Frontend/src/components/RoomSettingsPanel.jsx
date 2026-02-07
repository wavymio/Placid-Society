import React, { useEffect, useState } from 'react'
import { IoIosArrowBack, IoIosArrowDown } from 'react-icons/io'
import { useNavigate } from 'react-router-dom'
import EditRoomTab from './EditRoomTab'
import ParticipantsTab from './ParticipantsTab'
import VideoSettingsTab from './VideoSettingsTab'
import InvitesTab from './InvitesTab'
import AdminSettingsTab from './AdminSettingsTab'
import RoomPanelButtons from './RoomPanelButtons'
import ViewBuildingRequests from './ViewBuildingRequests'

const RoomSettingsPanel = ({ openRoomSettingsBar, toggleRoomSettingsBar, room, loggedInUser, formatTime, mode,
    page, setPage, neededTab, setNeededTab, buildingRequestsData, setRequiredRequest
 }) => {
    const getFirstTab = (mode) => {
        switch (mode) {
            case "building": return "create-design"
            default: return "edit-room" 
        }
    }
    const navigate = useNavigate()
    const [tab, setTab] = useState(getFirstTab(mode))

    const closeComponent = () => {
        setTab(null)
        setNeededTab(null)
        toggleRoomSettingsBar()
    }

    const handleLeaveRoom = () => {
        navigate('/')
    }

    useEffect(() => {
        if (neededTab) {
            setTab(neededTab)   
        }
    }, [neededTab])

    return (
        <div className={`flex flex-col sm:flex-row h-screen w-full bg-transparent backdrop-filter backdrop-blur-lg shadow-lg z-20 fixed left-0 top-0  transition-all duration-700 ease-in-out ${openRoomSettingsBar ? 'translate-x-0' : '-translate-x-full'}`}>
            <div className='fixed bottom-0 w-full h-[150px] sm:h-full sm:w-[150px] md:w-[170px] sm:relative'>
                <div className='fixed bottom-0 sm:static flex flex-row justify-evenly pt-5 w-full h-[134px] sm:pt-24 sm:pl-8 sm:h-full sm:flex-col sm:items-stretch sm:justify-normal sm:gap-7 sm:w-[126px] md:w-[146px] lg:pt-32 font-semibold bg-black'>
                    {(room && formatTime) && (
                        <RoomPanelButtons handleLeaveRoom={handleLeaveRoom} setTab={setTab} tab={tab} />
                    )}
                    {(mode === "building") && (
                        <RoomPanelButtons handleLeaveRoom={handleLeaveRoom} setTab={setTab} tab={tab} mode={mode} />
                    )}
                </div>
                {page !== 0 && (
                <div onClick={closeComponent} className='top-0 right-0 h-8 w-8 sm:h-12 sm:w-12 sm:top-1/2 sm:right-0 cursor-pointer bg-black flex items-center justify-center rounded-full absolute transition-transform duration-300 ease-in-out hover:scale-105'>
                    <IoIosArrowBack style={{ fontSize: '15px' }} className='hidden sm:flex' />
                    <IoIosArrowDown style={{ fontSize: '15px' }} className='flex sm:hidden' />
                </div>
                )}
            </div>
            <div className='h-full flex flex-grow items-center justify-center bg-transparent'>
                {(room && formatTime) && (
                    <>
                    {tab === 'edit-room' && (
                        <EditRoomTab room={room} loggedInUser={loggedInUser} />
                    )}
                    {tab === 'participants' && (
                        <ParticipantsTab room={room} loggedInUser={loggedInUser} />
                    )}
                    {tab === 'video-settings' && (
                        <VideoSettingsTab room={room} loggedInUser={loggedInUser} formatTime={formatTime} />
                    )}
                    {tab === 'invites-requests' && (
                        <InvitesTab room={room} loggedInUser={loggedInUser} />
                    )}
                    {tab === 'admin-settings' && (
                        <AdminSettingsTab room={room} loggedInUser={loggedInUser} />
                    )}
                    </>
                )}
                {mode === "building" && (
                    <>
                    {tab === 'create-design' && (
                        <div className='-mt-10 xs:mt-0 w-[250px] xs:w-[350px] sm:w-[470px] md:w-[550px] lg:w-[600px] h-[350px] xs:h-[250px] sm:h-[300px] relative bg-black border border-neutral-900 rounded-t-md rounded-b-2xl px-8 py-8 flex flex-col gap-5 items-center justify-center'>
                            <div className='w-full flex flex-col items-center'>
                                <div className='font-special mb-4'>Welcome to the Design Room</div>
                                <div className='text-xs text-neutral-300'>You will be paid a fee in <span className='font-semibold text-white'>{'₱lacs {₱}'}</span> for each approved design</div>
                                <div className='text-xs text-neutral-300 mb-2'>Follow your supervisor's instructions to improve your design's chances of being approved</div>
                            </div>
                            <button onClick={() => {
                                setPage(1)
                                closeComponent()
                            }}
                            className='font-semibold bg-neutral-800 
                            border border-white flex items-center justify-center cursor-pointer
                            transition-all ease-in-out duration-300 hover:bg-neutral-900
                            h-12 w-[150px] text-xs text-white rounded-lg'>Start Designing</button>
                        </div>
                    )}
                    {(tab === "requests" && buildingRequestsData) && (
                        <ViewBuildingRequests buildingRequestsData={buildingRequestsData} setRequiredRequest={setRequiredRequest}
                        closeComponent={closeComponent} setPage={setPage} />  
                    )}
                    </>
                )}
            </div>
        </div>
    )
}

export default RoomSettingsPanel
