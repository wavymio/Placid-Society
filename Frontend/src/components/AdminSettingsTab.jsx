import React, { useState } from 'react'
import { Badge } from './ui/badge'
import { usePromoteToAdmin, useDemoteMyAdmin } from '../api/MyRoomApi'

const AdminSettingsTab = ({ room, loggedInUser }) => {
    const { promoteToAdmin, isPromoteToAdminLoading } = usePromoteToAdmin()
    const { demoteMyAdmin, isDemoteMyAdminLoading } = useDemoteMyAdmin()
    const [selectedUser, setSelectedUser] = useState(null)
    const convertToUpper = (string) => {
        return string.charAt(0).toUpperCase() + string.slice(1)
    }

    const handlePromoteUser = async (participantId) => {
        setSelectedUser(participantId)
        if (isPromoteToAdminLoading) return 

        const payload = {
            roomId: room._id,
            participantDetails: {
                participantId
            }
        }

        const data = await promoteToAdmin(payload)
        setSelectedUser(null)
    } 

    const handleDemoteAdmin = async (participantId) => {
        setSelectedUser(participantId)
        if (isDemoteMyAdminLoading) return 

        const payload = {
            roomId: room._id,
            participantDetails: {
                participantId
            }
        }

        const data = await demoteMyAdmin(payload)
        setSelectedUser(null)
    } 

    return (
        <div className='px-2 xs:px-8 py-8 mt-0 sm:mt-16 w-[260px] xs:w-[350px] sm:w-[470px] md:w-[550px] lg:mt-0 lg:w-[600px] min-h-[250px] max-h-[300px] sm:min-h-[300px] sm:max-h-[400px] relative bg-black border border-neutral-900 rounded-2xl flex flex-col gap-5 items-center'>
            <div className='flex items-center gap-2 font-semibold'>
                <div className='flex items-center gap-1 justify-center'><span className='text-xs xs:text-sm'>{room.owner.length}</span><span className='text-xs xs:text-sm'>{room.owner.length === 1 ? 'Ruler,' : 'Rulers,'}</span></div>
                <div className='flex items-center gap-1 justify-center'><span className='text-xs xs:text-sm'>{room.admins.length}</span><span className='text-xs xs:text-sm'>{room.admins.length === 1 ? 'Noble' : 'Nobles'}</span></div>
            </div>
            
            <div className='overflow-y-scroll w-full px-3 flex flex-col gap-10'>
                <div className='flex flex-col gap-6 w-full'>
                    {room.owner.map((owner, index) => (
                        <div key={index} className='w-full flex items-center justify-between bg-neutral-950 rounded-l-full rounded-r-lg pr-1 sm:pr-5 py-1'>
                            <div className='flex items-center gap-2'>
                                <div className='h-12 w-12 sm:h-14 sm:w-14 border border-neutral-800 p-1 rounded-full'>
                                    <img className='object-cover h-full w-full rounded-full' src={owner.profilePicture ? owner.profilePicture : 'https://avatar.iran.liara.run/public'} />
                                </div>
                                <div className='font-semibold text-xs sm:text-sm max-w-16 xs:max-w-20 sm:max-w-[155px] overflow-x-hidden'>{convertToUpper(owner.username)}</div>
                                <Badge className={'font-bold px-2 xs:px-4 py-2 sm:py-3 text-[11px] sm:text-sm'}>ruler</Badge>
                            </div>
                        </div>
                    ))}
                    {room.admins.map((admin, index) => (
                        <div key={index} className='w-full flex items-center justify-between bg-neutral-950 rounded-l-full rounded-r-lg pr-1 sm:pr-5 py-1'>
                            <div className='flex items-center gap-2'>
                                <div className='h-12 w-12 sm:h-14 sm:w-14 border border-neutral-800 p-1 rounded-full'>
                                    <img className='object-cover h-full w-full rounded-full' src={admin.profilePicture ? admin.profilePicture : 'https://avatar.iran.liara.run/public'} />
                                </div>
                                <div className='font-semibold text-xs sm:text-sm max-w-7 xs:max-w-[41px] sm:max-w-[125px] overflow-x-hidden'>{convertToUpper(admin.username)}</div>
                                <Badge className={'font-bold px-2 xs:px-4 py-2 sm:py-3 text-[11px] sm:text-sm bg-red-950 hover:bg-red-950'}>noble</Badge>
                            </div>
                            {room.owner.some(owner => owner._id === loggedInUser._id) && (
                                <Badge onClick={() => handleDemoteAdmin(admin._id)} className={'flex items-center justify-center font-bold px-2 xs:px-6 py-2 sm:py-3 w-16 sm:w-20 bg-neutral-900 hover:bg-neutral-800 cursor-pointer transition-colors duration-300 ease-in-out'}>
                                    {isDemoteMyAdminLoading && (selectedUser === admin._id) ? (
                                        <span className='loader'></span>
                                    ) : (
                                        <span className='text-[11px] sm:text-sm'>Demote</span>
                                    )}
                                </Badge>
                            )}
                        </div>
                    ))}
                </div>
                <div className='w-full'>
                    {/* <div className={`${(room.participants.length - (room.admins.length + room.owner.length)) > 0 ? 'flex' : 'hidden'} justify-center w-full mb-3 text-sm`}>Other Members</div> */}
                    <div className='flex flex-col gap-6 w-full'>
                        {room.participants.filter((participant) => {
                            return (room.owner.every((owner) => owner._id !== participant.userId._id)) && (room.admins.length === 0 || room.admins.every((admin) => admin._id !== participant.userId._id)) 
                        }).map((peasant, index) => (
                            <div key={index} className='w-full flex items-center justify-between bg-neutral-950 rounded-l-full rounded-r-lg pr-1 sm:pr-5 py-1'>
                                <div className='flex items-center gap-2'>
                                    <div className='h-12 w-12 sm:h-14 sm:w-14 border border-neutral-800 p-1 rounded-full'>
                                        <img className='object-cover h-full w-full rounded-full' src={peasant.userId.profilePicture ? peasant.userId.profilePicture : 'https://avatar.iran.liara.run/public'} />
                                    </div>
                                    <div className='font-semibold text-xs sm:text-sm max-w-4 xs:max-w-10 sm:max-w-28 overflow-x-hidden'>{convertToUpper(peasant.userId.username)}</div>
                                    <Badge className={'font-bold px-2 xs:px-4 py-2 sm:py-3 text-[11px] sm:text-sm bg-green-950 hover:bg-green-950'}>peasant</Badge>
                                </div>
                                {((room.owner.some(owner => owner._id === loggedInUser._id)) || (room.admins.some(admin => admin._id === loggedInUser._id)))  && (
                                    <Badge onClick={() => handlePromoteUser(peasant.userId._id)} className={'flex items-center justify-center font-bold px-2 xs:px-6 py-2 sm:py-3 w-16 sm:w-20 bg-neutral-900 hover:bg-neutral-800 cursor-pointer transition-colors duration-300 ease-in-out'}>
                                        {isPromoteToAdminLoading && (selectedUser === peasant.userId._id) ? (
                                            <span className='loader'></span>
                                        ) : (
                                            <span className='text-[11px] sm:text-sm'>Promote</span>
                                        )}
                                    </Badge>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default AdminSettingsTab
