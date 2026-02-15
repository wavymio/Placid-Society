import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import PatchEditForms from './PatchEditForms'
import { usePatchEditMyUser, usePatchEditMyUserProfilePic } from '../api/MyUserApi'
import { useQueryClient } from 'react-query'
import { useAcceptFriend, useAddFriend, useCancelFriend, useRejectFriend, useUnfriend } from '../api/UserApi'
import { TiUserAdd } from "react-icons/ti"
import { TiUserDelete } from "react-icons/ti"
import FriendsTab from './FriendsTab'
import VerifyTab from './VerifyTab'
import { FaCheckCircle } from 'react-icons/fa'

const UserProfileBio = ({ user, sameUser, loggedInUser }) => {
    const queryClient = useQueryClient()
    const [openUsername, setOpenUsername] = useState(false)
    const [openFriends, setOpenFriends] = useState(false)
    const [openVerify, setOpenVerify] = useState(false)
    const [response, setResponse] = useState({})
    const { patchEditUser, isLoading } = usePatchEditMyUser()
    const { patchEditUserProfilePic, isLoading: isProfilePicLoading } = usePatchEditMyUserProfilePic()
    const { sendFriendRequest, isLoading: isSendFriendRequestLoading } = useAddFriend()
    const { cancelFriendRequest, isLoading: isCancelFriendRequestLoading } = useCancelFriend()
    const { acceptFriendRequest, isLoading: isAcceptFriendRequestLoading } = useAcceptFriend()
    const { rejectFriendRequest, isLoading: isRejectFriendRequestLoading } = useRejectFriend()
    const { unfriendRequest, isLoading: isUnfriendRequestLoading } = useUnfriend()

    const editUsername = () => {
        if (!sameUser) {
            return
        }
        setOpenUsername(true)
    }

    const showFriends = () => {
        if (user.friends.length < 1) return
        setOpenFriends(true)
    }

    const editUser = async (inputs) => {
        const res = await patchEditUser(inputs)
        setResponse(res)
        if (res?.success) {
            setOpenUsername(false)
            await queryClient.invalidateQueries('validateUser')
        }
    }

    const handlePfpChange = async (ev) => {
        const file = ev.target.files[0]
        
        if (file) {
            const formData = new FormData()
            formData.append('profilePicture', file)
            const res = await patchEditUserProfilePic(formData)

            if (res?.success) {
                await queryClient.invalidateQueries('validateUser')
            }
        }
    }

    const handleFriendRequests = async (ev, requestType) => {
        ev.preventDefault()
        const details = {
            to: user?._id
        }
        const response = requestType === "add" ? await sendFriendRequest(details)
        : requestType === "cancel" ? await cancelFriendRequest(details)
        : requestType === "accept" ? await acceptFriendRequest(details)
        : requestType === "reject" ? await rejectFriendRequest(details)
        : requestType === "unfriend" ? await unfriendRequest(details)
        : null

        if (response?.success) {
            await queryClient.invalidateQueries("getUser")
            await queryClient.invalidateQueries("validateUser")
        }
    }

    const handleOpenVerify = () => {
        if (openVerify) {
            setOpenVerify(false)
            return
        }

        setOpenVerify(true)
    }

    const isFriend = user?.friends.some((friend) => friend.userId._id === loggedInUser?._id)

    return (
        <div className={` w-full flex flex-col sm:flex-row items-center justify-center gap-5 sm:gap-5 md:gap-16 xs:px-0 sm:px-10`}>
            {sameUser ? (
                <div className='relative z-10'>
                    <img src={user?.profilePicture ? user.profilePicture : `https://avatar.iran.liara.run/public`} alt="img" className='object-cover h-28 w-28 xs:h-32 xs:w-32 sm:h-32 sm:w-32 md:h-44 md:w-44 rounded-full' />
                    {isProfilePicLoading ? (
                        <div className='absolute flex items-center justify-center opacity-50 bg-black cursor-pointer top-0 h-28 w-28 xs:h-32 xs:w-32 sm:h-32 sm:w-32 md:h-44 md:w-44 rounded-full'>
                            <span className='loader'></span>
                        </div>
                    ) : (
                        <input type='file' accept="image/*" onChange={handlePfpChange} className='absolute opacity-0 cursor-pointer top-0 h-28 w-28 xs:h-32 xs:w-32 sm:h-32 sm:w-32 md:h-44 md:w-44 rounded-full'/>
                    )}
                </div>
            ) : (
                <div className=''>
                    <img src={user?.profilePicture ? user.profilePicture : '/nopfp.webp'} alt="img" className='object-cover h-28 w-28 xs:h-32 xs:w-32 sm:h-32 sm:w-32 md:h-44 md:w-44 rounded-full' />
                </div>
            )}

            <div className='flex flex-col gap-3 xs:gap-5'>
                <div className='flex items-center gap-3'>
                    <div onClick={editUsername} className='overflow-hidden whitespace-nowrap cursor-pointer border border-neutral-800 bg-neutral-900 flex justify-center px-3 py-3 max-w-16 xs:px-2 xs:py-3 xs:min-w-20 sm:py-4 sm:w-24 md:px-2 md:py-4 md:min-w-28 rounded-lg font-semibold text-xs sm:text-sm hover:bg-neutral-800 transition-colors ease-in-out duration-300'>
                        <div className={`${user?.username.length > 8 ? 'animate-slide' : null} px-3`}>{user?.username}</div>
                    </div>
                    <div className='border border-neutral-800 bg-neutral-900 flex justify-center px-3 py-3 min-w-14 xs:px-2 xs:py-3 xs:min-w-20 sm:px-2 sm:py-4 sm:w-24 md:px-2 md:py-4 md:w-28 rounded-lg font-semibold text-xs sm:text-sm'>
                        Noob
                    </div>
                    {sameUser? (
                        <>
                            <button onClick={handleOpenVerify} className={`cursor-pointer ${user?.isVerified ? 'bg-neutral-200 text-neutral-700 font-extrabold hover:bg-neutral-800 hover:text-white hover:font-semibold' : 'bg-red-900 font-semibold hover:bg-red-950'} hidden xs:flex items-center justify-center whitespace-nowrap px-2 py-3 w-24 sm:px-2 sm:py-4 sm:w-28 rounded-lg text-xs sm:text-sm transition-colors ease-in-out duration-300`}>{user?.isVerified ? <span className='flex items-center justify-center gap-1'>Verified <FaCheckCircle /></span> : 'Verify'}</button>
                            <button onClick={handleOpenVerify} className={`cursor-pointer ${user?.isVerified ? 'bg-neutral-200 text-neutral-700 font-extrabold hover:bg-neutral-800 hover:text-white hover:font-semibold' : 'bg-red-900 font-semibold hover:bg-red-950'} flex xs:hidden justify-center xs:whitespace-nowrap px-3 py-3 w-20 rounded-lg font-semibold text-xs sm:text-sm transition-colors ease-in-out duration-300`}>{user?.isVerified ? <span className='flex items-center justify-center gap-1'>Verified <FaCheckCircle /></span> : 'Verify'}</button>
                        </>
                    ) : (
                        <>
                            {user.receivedFriendRequests.includes(loggedInUser?._id) ? (
                                <>
                                    <button disabled={isCancelFriendRequestLoading} onClick={(ev) => handleFriendRequests(ev, "cancel")} className={`cursor-pointer bg-red-900 hidden xs:flex justify-center whitespace-nowrap px-2 py-3 border border-red-900 w-24 sm:px-2 sm:py-4 sm:w-28 rounded-lg font-semibold text-xs sm:text-sm hover:bg-red-950 transition-colors ease-in-out duration-300`}>{isCancelFriendRequestLoading ?  <span className='loader'></span> : <span>Cancel</span>}</button>
                                    <button disabled={isCancelFriendRequestLoading} onClick={(ev) => handleFriendRequests(ev, "cancel")} className={`cursor-pointer bg-red-900 flex xs:hidden justify-center xs:whitespace-nowrap px-4 py-3 w-15 border border-red-900 rounded-lg font-semibold text-xs sm:text-sm hover:bg-red-950 transition-colors ease-in-out duration-300`}>{isCancelFriendRequestLoading ?  <span className='loader'></span> : <span>Cancel</span>}</button>
                                </>
                            ) : user.sentFriendRequests.includes(loggedInUser?._id) ? (
                                <div className='flex gap-0'>
                                    <button disabled={isAcceptFriendRequestLoading} onClick={(ev) => handleFriendRequests(ev, "accept")} className={`cursor-pointer bg-neutral-900 border border-neutral-800 hidden xs:flex items-center justify-center whitespace-nowrap px-2 py-3 w-12 sm:px-2 sm:py-4 sm:w-14 rounded-l-lg font-semibold text-xs sm:text-md hover:bg-neutral-800 transition-colors ease-in-out duration-300`}>{isAcceptFriendRequestLoading ?  <span className='loader'></span> : <TiUserAdd className='h-[16px] w-[16px] sm:h-[20px] sm:w-[20px]' />}</button>
                                    <button disabled={isAcceptFriendRequestLoading} onClick={(ev) => handleFriendRequests(ev, "accept")} className={`cursor-pointer bg-neutral-900 border border-neutral-800 flex xs:hidden justify-center items-center xs:whitespace-nowrap px-0 py-0 h-10 w-11 rounded-l-lg font-semibold text-xs sm:text-sm hover:bg-red-950 transition-colors ease-in-out duration-300`}>{isAcceptFriendRequestLoading ?  <span className='loader'></span> : <TiUserAdd className='h-[16px] w-[16px]' />}</button>
                                    <button disabled={isRejectFriendRequestLoading} onClick={(ev) => handleFriendRequests(ev, "reject")} className={`cursor-pointer bg-red-950 hidden xs:flex justify-center whitespace-nowrap px-2 py-3 w-12 sm:px-2 sm:py-4 sm:w-14 rounded-r-lg font-semibold text-xs sm:text-sm hover:bg-red-900 transition-colors ease-in-out duration-300`}>{isRejectFriendRequestLoading ?  <span className='loader'></span> : <TiUserDelete className='h-[16px] w-[16px] sm:h-[20px] sm:w-[20px]' />}</button>
                                    <button disabled={isRejectFriendRequestLoading} onClick={(ev) => handleFriendRequests(ev, "reject")} className={`cursor-pointer bg-red-950 flex xs:hidden justify-center items-center xs:whitespace-nowrap px-0 py-0 h-10 w-11 rounded-r-lg font-semibold text-xs sm:text-sm hover:bg-red-900 transition-colors ease-in-out duration-300`}>{isRejectFriendRequestLoading ?  <span className='loader'></span> : <TiUserDelete className='h-[16px] w-[16px]' />}</button>
                                </div>
                            ) : (
                                <>
                                    {isFriend ? (
                                        <>
                                            <button disabled={isUnfriendRequestLoading} onClick={(ev) => handleFriendRequests(ev, "unfriend")} className={`cursor-pointer bg-red-900 hidden xs:flex justify-center whitespace-nowrap px-2 py-3 w-24 sm:px-2 sm:py-4 sm:w-28 rounded-lg font-semibold text-xs sm:text-sm hover:bg-red-950 transition-colors ease-in-out duration-300`}>{isUnfriendRequestLoading ?  <span className='loader'></span> : <span>Unfriend</span>}</button>
                                            <button disabled={isUnfriendRequestLoading} onClick={(ev) => handleFriendRequests(ev, "unfriend")} className={`cursor-pointer bg-red-900 flex xs:hidden justify-center xs:whitespace-nowrap px-3 py-3 w-[70px] rounded-lg font-semibold text-xs sm:text-sm hover:bg-red-950 transition-colors ease-in-out duration-300`}>{isUnfriendRequestLoading ?  <span className='loader'></span> : <span>Unfriend</span>}</button>
                                        </>
                                    ) : (
                                        <>
                                            <button disabled={isSendFriendRequestLoading} onClick={(ev) => handleFriendRequests(ev, "add")} className={`cursor-pointer bg-red-900 hidden xs:flex justify-center whitespace-nowrap px-2 py-3 w-24 sm:px-2 sm:py-4 sm:w-28 rounded-lg font-semibold text-xs sm:text-sm hover:bg-red-950 transition-colors ease-in-out duration-300`}>{isSendFriendRequestLoading ?  <span className='loader'></span> : <span>Add Friend</span>}</button>
                                            <button disabled={isSendFriendRequestLoading} onClick={(ev) => handleFriendRequests(ev, "add")} className={`cursor-pointer bg-red-900 flex xs:hidden justify-center xs:whitespace-nowrap px-3 py-3 w-14 rounded-lg font-semibold text-xs sm:text-sm hover:bg-red-950 transition-colors ease-in-out duration-300`}>{isSendFriendRequestLoading ?  <span className='loader'></span> : <span>Add</span>}</button>
                                        </> 
                                    )}
                                </>
                            )}
                            
                        </>
                    )}
                </div>

                <div className='flex items-center justify-center xs:justify-normal gap-3'>
                    <div onClick={showFriends} className='cursor-pointer border border-neutral-800 bg-neutral-900 flex justify-center px-3 py-3 w-auto xs:px-2 xs:py-3 xs:w-20 sm:px-2 sm:py-4 sm:w-24 md:px-2 md:py-4 md:w-28 rounded-lg font-semibold text-xs sm:text-sm hover:bg-neutral-800 transition-colors ease-in-out duration-300'>
                        {user?.friends.length === 1 ? `${user?.friends.length} Friend` : `${user?.friends.length} Friends`}
                    </div>
                    <div className='cursor-pointer border border-neutral-800 bg-neutral-900 flex justify-center px-3 py-3 w-auto xs:px-2 xs:py-3 xs:min-w-20 sm:px-2 sm:py-4 sm:min-w-28 rounded-lg font-semibold text-xs sm:text-sm hover:bg-neutral-800 transition-colors ease-in-out duration-300'>
                        {user?.country ? user?.country : "Passport"}
                    </div>
                </div>
            </div>

            {openUsername &&
                <PatchEditForms response={response} isLoading={isLoading} editUser={editUser} setOpenUsername={setOpenUsername} user={user} />
            }

            {openFriends &&
                <FriendsTab  sameUser={sameUser} setOpenFriends={setOpenFriends} user={user} loggedInUser={loggedInUser} />
            }

            {openVerify &&
                <VerifyTab handleOpenVerify={handleOpenVerify} user={user} />
            }
        </div>
    )
}

export default UserProfileBio
