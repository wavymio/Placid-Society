import React from 'react'
import RoomSettingsButton from './RoomSettingsButton'
import { IoPersonAdd } from 'react-icons/io5'
import { MdAdminPanelSettings, MdModeEdit } from 'react-icons/md'
import { IoIosChatboxes, IoMdExit } from 'react-icons/io'
import { FaUsers, FaVideo } from 'react-icons/fa'
import { TbSubtask } from "react-icons/tb"
import { MdPayments } from "react-icons/md"

const RoomPanelButtons = ({ tab, setTab, handleLeaveRoom, mode }) => {
    return (
        <>
            {!mode && (
            <>
                <RoomSettingsButton tab={tab} setTab={setTab} title={'Edit Room'} selectorText={'edit-room'}>
                    <MdModeEdit className='h-[18px] w-[18px] xs:h-[22px] xs:w-[22px]' />
                </RoomSettingsButton>
                <RoomSettingsButton tab={tab} setTab={setTab} title={'Participants'} selectorText={'participants'} >
                    <FaUsers className='h-[18px] w-[18px] xs:h-[22px] xs:w-[22px]' />
                </RoomSettingsButton>
                <RoomSettingsButton tab={tab} setTab={setTab} title={'Video Settings'} selectorText={'video-settings'}>
                    <FaVideo className='h-[18px] w-[18px] xs:h-[22px] xs:w-[22px]' />
                </RoomSettingsButton>
                <RoomSettingsButton tab={tab} setTab={setTab} title={'Room Invites and Requests'} selectorText={'invites-requests'}>
                    <IoPersonAdd className='h-[18px] w-[18px] xs:h-[22px] xs:w-[22px]' />
                </RoomSettingsButton>
                <RoomSettingsButton tab={tab} setTab={setTab} title={'Admin Settings'} selectorText={'admin-settings'}>
                    <MdAdminPanelSettings className='h-[18px] w-[18px] xs:h-[22px] xs:w-[22px]' />
                </RoomSettingsButton>
                <div 
                onClick={handleLeaveRoom}
                className='flex items-center justify-center bg-neutral-900 h-9 w-9 xs:h-12 xs:w-12 sm:h-14 sm:w-14 rounded-xl cursor-pointer transition-transform duration-300 ease-in-out hover:scale-125' title='Exit Room'><IoMdExit className='h-[18px] w-[18px] xs:h-[22px] xs:w-[22px]' /></div>
            </>
        )}

        {mode === "building" && (
            <>
                <RoomSettingsButton tab={tab} setTab={setTab} title={'Create New Design'} selectorText={'create-design'}>
                    <MdModeEdit className='h-[18px] w-[18px] xs:h-[22px] xs:w-[22px]' />
                </RoomSettingsButton>
                <RoomSettingsButton tab={tab} setTab={setTab} title={'Design Requests'} selectorText={'requests'}>
                    <TbSubtask className='h-[18px] w-[18px] xs:h-[22px] xs:w-[22px]' />
                </RoomSettingsButton>
                <RoomSettingsButton tab={tab} setTab={setTab} title={'Architects'} selectorText={'architects'} >
                    <FaUsers className='h-[18px] w-[18px] xs:h-[22px] xs:w-[22px]' />
                </RoomSettingsButton>
                <RoomSettingsButton tab={tab} setTab={setTab} title={'Supervisors'} selectorText={'supervisors'}>
                    <MdAdminPanelSettings className='h-[18px] w-[18px] xs:h-[22px] xs:w-[22px]' />
                </RoomSettingsButton>
                <RoomSettingsButton tab={tab} setTab={setTab} title={'Payments'} selectorText={'payments'}>
                    <MdPayments className='h-[18px] w-[18px] xs:h-[22px] xs:w-[22px]' />
                </RoomSettingsButton>
                <RoomSettingsButton tab={tab} setTab={setTab} title={'Chat'} selectorText={'chat'}>
                    <IoIosChatboxes className='h-[18px] w-[18px] xs:h-[22px] xs:w-[22px]' />
                </RoomSettingsButton>
                
            </>
        )}
    </>
    )
}

export default RoomPanelButtons
