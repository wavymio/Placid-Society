import { useNavigate, useParams } from 'react-router-dom'
import { useGetUser } from '../api/UserApi'
import { useAuth } from '../contexts/AuthContext'
import React, { useState } from 'react'
import UserProfileBio from '../components/UserProfileBio'
import UserProfileRooms from '../components/UserProfileRooms'
import { useLoading } from '../contexts/LoadingContext'
import { IoCloseSharp } from 'react-icons/io5'

const OtherUserProfile = () => {
    const { id } = useParams()
    const { isLoading: isUserLoading, user } = useGetUser(id)
    const { isLoading: isAuthLoading, loggedInUser } = useAuth()
    const { isRedirectLoading, setIsRedirectLoading } = useLoading()
    const navigate = useNavigate()
    const sameUser = loggedInUser?._id.toString() === user?._id.toString()
    const [ locationId, setLocationId ] = useState(null)
    const [ openLogin, setOpenLogin ] = useState(false)

    const handleRedirectToLoginOrSignUp = (page) => {
        const roomLink = locationId
        sessionStorage.setItem('redirectToRoom', roomLink)
        if (page === "login") {
            navigate('/login')
        }
        if (page === "signup") {
            navigate('/signup')
        }
        
    }

    if (isAuthLoading || isUserLoading) {
        return (
            <div className='overflow-y-hidden w-full h-[43vh] pb-2 flex justify-center items-center pt-[145px] lg:pt-[200px]'>
                <div className='big-loader'></div>
            </div>
        )
    }

    if (sameUser) {
        navigate('/user-profile')
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
            <UserProfileBio user={user} sameUser={sameUser} loggedInUser={loggedInUser} />
            <UserProfileRooms user={user} sameUser={sameUser} loggedInUser={loggedInUser} setLocationId={setLocationId} setOpenLogin={setOpenLogin} />

            {openLogin && (
                <div className='flex items-center justify-center z-20 fixed top-0 left-0 bg-transparent w-full h-full backdrop-filter backdrop-blur-lg shadow-lg rounded-lg'>
                    <div className='flex items-center justify-center relative w-[240px] xs:w-[350px] sm:w-[370px] md:w-[450px] lg:w-[400px] h-[400x] bg-black px-10 py-12 border border-neutral-800 rounded-lg'>
                        <div onClick={() => setOpenLogin(false)} className='absolute top-1 right-1 rounded-lg py-2 px-2 bg-neutral-900 hover:bg-red-900 text-xs cursor-pointer transition-all duration-300 ease-in-out font-bold'>
                            <IoCloseSharp />
                        </div>
                        <div className='w-full flex flex-col gap-3'>
                            <div className='w-full flex flex-col gap-4'>
                                <div onClick={() => handleRedirectToLoginOrSignUp("login")} className='w-full h-14 text-white border-1 bg-neutral-900 hover:bg-neutral-800 flex items-center justify-center font-extrabold cursor-pointer rounded-lg transition-all ease-in-out duration-500 hover:scale-105'>Login</div>
                                <div className='text-white text-xs w-full flex justify-center font-extrabold'>OR</div>
                                <div onClick={() => handleRedirectToLoginOrSignUp("signup")} className='w-full h-14 text-white bg-neutral-900 hover:bg-neutral-800 border-1 flex items-center justify-center font-extrabold cursor-pointer rounded-lg transition-all ease-in-out duration-500 hover:scale-105'>Sign Up</div>
                            </div>
                            <div className='text-center text-xs'>{'Login or Sign up to  join this space'}</div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default OtherUserProfile
