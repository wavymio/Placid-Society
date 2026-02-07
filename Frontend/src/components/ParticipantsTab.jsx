import React, { useState } from 'react'
import { Badge } from './ui/badge'
import { useKickMyParticipant } from '../api/MyRoomApi'

const ParticipantsTab = ({ room, loggedInUser }) => {
    const { kickMyParticipant, isKickMyParticipantLoading } = useKickMyParticipant()
    const [selectedUser, setSelectedUser] = useState(null)

    const convertToUpper = (string) => {
        return string.charAt(0).toUpperCase() + string.slice(1)
    }

    const handleKickUser = async (participantId) => {
        setSelectedUser(participantId)
        if (isKickMyParticipantLoading) return 

        const payload = {
            roomId: room._id,
            participantDetails: {
                participantId
            }
        }

        const data = await kickMyParticipant(payload)
        setSelectedUser(null)
    } 
    
    return (
        <div className='px-2 xs:px-8 py-8 w-[260px] xs:w-[350px] sm:w-[470px] md:w-[550px] lg:w-[600px] min-h-[250px] max-h-[300px] sm:min-h-[300px] sm:max-h-[400px] relative bg-black border border-neutral-900 rounded-2xl flex flex-col gap-5 items-center'>
            <div className='flex items-center gap-2 justify-center font-semibold'><span className='text-xs xs:text-sm'>{room.participants.length}</span><span className='text-xs xs:text-sm'>{room.participants.length === 1 ? 'Participant' : 'Participants'}</span></div>
            {/* <Separator className='bg-neutral-900' /> */}
            <div className='overflow-y-scroll w-full px-3'>
                <div className='flex flex-col gap-6 w-full'>
                    {room.participants.filter((participant) => {
                        return room.owner.some((owner) => owner._id === participant.userId._id) 
                    }).map((owner, index) => (
                        <div key={index} className='w-full flex items-center justify-between bg-neutral-950 rounded-l-full rounded-r-lg pr-5 py-1'>
                            <div className='flex items-center gap-2'>
                                <div className='h-12 w-12 sm:h-14 sm:w-14 border border-neutral-800 p-1 rounded-full'>
                                    <img className='object-cover h-full w-full rounded-full' src={owner.userId.profilePicture ? owner.userId.profilePicture : 'https://avatar.iran.liara.run/public'} />
                                </div>
                                <div className='font-semibold text-xs sm:text-sm max-w-16 xs:max-w-24 sm:max-w-28 overflow-x-hidden'>{convertToUpper(owner.userId.username)}</div>
                                <Badge className={'font-bold px-2 xs:px-4 py-2 sm:py-3 text-[11px] sm:text-sm'}>ruler</Badge>
                            </div>
                        </div>
                    ))}
                    {room.participants.filter((participant) => {
                        return room.admins.some((admin) => admin._id === participant.userId._id)  
                    }).map((admin, index) => (
                        <div key={index} className='w-full flex items-center justify-between bg-neutral-950 rounded-l-full rounded-r-lg pr-1 sm:pr-5 py-1'>
                            <div className='flex items-center gap-2'>
                                <div className='h-12 w-12 sm:h-14 sm:w-14 border border-neutral-800 p-1 rounded-full'>
                                    <img className='object-cover h-full w-full rounded-full' src={admin.userId.profilePicture ? admin.userId.profilePicture : 'https://avatar.iran.liara.run/public'} />
                                </div>
                                <div className='font-semibold text-xs sm:text-sm max-w-6 xs:max-w-16 sm:max-w-28 overflow-x-hidden'>{convertToUpper(admin.userId.username)}</div>
                                <Badge className={'font-bold px-2 xs:px-4 py-2 sm:py-3 text-[11px] sm:text-sm bg-red-950 hover:bg-red-950'}>noble</Badge>
                            </div>
                            {room.owner.some((owner) => owner._id === loggedInUser._id) && (
                                <Badge className={'flex items-center justify-center font-bold px-6 py-2 sm:py-3 w-12 sm:w-20 bg-neutral-900 hover:bg-neutral-800 cursor-pointer transition-colors duration-300 ease-in-out'}>
                                    {isKickMyParticipantLoading && (selectedUser === admin.userId._id) ? (
                                        <span className='loader'></span>
                                    ) : (
                                        <span className='text-[11px] sm:text-sm'>Kick</span>
                                    )}
                                </Badge>
                            )}
                        </div>
                    ))}
                    {room.participants.filter((participant) => {
                        return (room.owner.every((owner) => owner._id !== participant.userId._id)) && (room.admins.length === 0 || room.admins.every((admin) => admin._id !== participant.userId._id)) 
                    }).map((peasant, index) => (
                        <div key={index} className='w-full flex items-center justify-between bg-neutral-950 rounded-l-full rounded-r-lg pr-1 sm:pr-5 py-1'>
                            <div className='flex items-center gap-2'>
                                <div className='h-12 w-12 sm:h-14 sm:w-14 border border-neutral-800 p-1 rounded-full'>
                                    <img className='object-cover h-full w-full rounded-full' src={peasant.userId.profilePicture ? peasant.userId.profilePicture : 'https://avatar.iran.liara.run/public'} />
                                </div>
                                <div className='font-semibold text-xs sm:text-sm max-w-6 xs:max-w-12 sm:max-w-28 overflow-x-hidden'>{convertToUpper(peasant.userId.username)}</div>
                                <Badge className={'font-bold px-2 xs:px-4 py-2 sm:py-3 text-[11px] sm:text-sm bg-green-950 hover:bg-green-950'}>peasant</Badge>
                            </div>
                            {(room.owner.some((owner) => owner._id === loggedInUser._id) || room.admins.some((owner) => owner._id === loggedInUser._id)) && (
                                <Badge onClick={() => handleKickUser(peasant.userId._id)} className={'flex items-center justify-center font-bold w-12 sm:w-20 px-6 py-2 sm:py-3 bg-neutral-900 hover:bg-neutral-800 cursor-pointer transition-colors duration-300 ease-in-out'}>
                                    {isKickMyParticipantLoading && (selectedUser === peasant.userId._id) ? (
                                        <span className='loader'></span>
                                    ) : (
                                        <span className='text-[11px] sm:text-sm'>Kick</span>
                                    )}
                                </Badge>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}

export default ParticipantsTab
