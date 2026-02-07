import UserProfileRooms from '../components/UserProfileRooms'
import UserProfileBio from '../components/UserProfileBio'
import { useAuth } from '../contexts/AuthContext'
import React, { useEffect } from 'react'
import { useLoading } from '../contexts/LoadingContext'

const UserProfile = () => {
    const { isLoading, loggedInUser } = useAuth()
    const { isRedirectLoading, setIsRedirectLoading } = useLoading()

    if (isLoading) {
        return (
            <div className='overflow-y-hidden w-full h-[43vh] pb-2 flex justify-center items-center pt-[145px] lg:pt-[200px]'>
                <div className='big-loader'></div>
            </div>
        )
    }

    if (isRedirectLoading) {
        return (
            <div className='overflow-y-hidden w-full h-screen flex flex-col gap-7 items-center pt-[145px] lg:pt-[200px]'>
                <div className='big-loader'></div>
                <div className='text-xs font-bold'>REDIRECTING TO ROOM...</div>
            </div>
        )
    }

    return (
        <div className='w-full flex flex-col justify-center gap-9 sm:gap-14'>
            <UserProfileBio user={loggedInUser} sameUser={true} />
            <UserProfileRooms user={loggedInUser} sameUser={true} />
        </div>
    )
}

export default UserProfile
