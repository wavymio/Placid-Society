import React, { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Separator } from './ui/separator'
import { useQueryClient } from 'react-query'
import { IoLogOut } from "react-icons/io5"
import { IoMdHome, IoMdNotifications } from 'react-icons/io'
import { BsPersonArmsUp } from "react-icons/bs"
import Notifications from './Notifications'

import { useMarkMyNotifications } from '../api/MyNotificationsApi'
import { FaVideo } from 'react-icons/fa'
import { BsBuildingsFill } from "react-icons/bs"
import { PiCompassRoseThin } from 'react-icons/pi'
import { GiWorld } from "react-icons/gi"

const MobileNav = ({ isLoggedIn, user, logout, isLoading, isAuthLoading }) => {
    const queryClient = useQueryClient()
    const navigate = useNavigate()
    const { markNotifications } = useMarkMyNotifications()
    const [profileDrop, setProfileDrop] = useState(false)
    const [notifDrop, setNotifDrop] = useState(false)
    const prevNotifDropRef = useRef(notifDrop)
    const [done, setDone] = useState(false)
    const unseenMessages = user?.notifications.filter((notification) => !notification.seen)

    const handlePfpClick = () => {
        setNotifDrop(false)
        setProfileDrop(!profileDrop)
    }

    const handleNotifClick = () => {
        setProfileDrop(false)
        setNotifDrop(!notifDrop)
    } 

    const handleLinkClick = () => {
        setProfileDrop(!profileDrop)
    }

    const handleCompassClick = (loc) => {
        setNotifDrop(false)
        setProfileDrop(false)
        navigate(loc)
    }

    const handleLogout = async () => {
        if (!done) {
            setDone(true)
            
            const res = await logout()

            if (res?.success) {            
                handleLinkClick()
                await queryClient.invalidateQueries('validateUser')
            }

            setDone(false)
        }   
    }

    const handleMarkNotifications = async () => {
        if(!user) {
            return
        }

        return await markNotifications()
    }

    useEffect(() => {
        if (prevNotifDropRef.current && !notifDrop) {
            handleMarkNotifications()
        }
        prevNotifDropRef.current = notifDrop
    }, [notifDrop])

    return (
        <div className='text-xs'>
            <div className='flex items-center gap-2'>
                {user &&
                    <>
                     <div onClick={() => handleCompassClick('/map')} className='relative bg-neutral-800 h-7 w-7 flex items-center justify-center rounded-lg cursor-pointer hover:bg-neutral-900 hover:scale-105 transition-all duration-300 ease-in-out'>
                        <GiWorld className='h-5 w-5 animate-spin' />
                    </div>
                    <div onClick={() => handleCompassClick('/city')} className='relative bg-neutral-800 h-7 w-7 flex items-center justify-center rounded-lg cursor-pointer hover:bg-neutral-900 hover:scale-105 transition-all duration-300 ease-in-out'>
                        <IoMdHome className='h-6 w-6' />
                        <div className={`${unseenMessages.length < 1 ? 'hidden' : 'flex'} absolute rounded-full w-4 h-4  text-xs items-center justify-center font-bold bg-red-700 bottom-0 left-0`}>{unseenMessages.length > 9 ? '9+' : unseenMessages.length}</div>
                    </div>
                    <div onClick={handleNotifClick} className='relative bg-neutral-800 h-7 w-7 flex items-center justify-center rounded-lg cursor-pointer hover:bg-neutral-900 hover:scale-105 transition-all duration-300 ease-in-out'>
                        <IoMdNotifications className='h-6 w-6' />
                        <div className={`${unseenMessages.length < 1 ? 'hidden' : 'flex'} absolute rounded-full w-4 h-4  text-xs items-center justify-center font-bold bg-red-700 bottom-0 left-0`}>{unseenMessages.length > 9 ? '9+' : unseenMessages.length}</div>
                    </div>
                    </>
                }
                <img onClick={handlePfpClick} src={user?.profilePicture ? user?.profilePicture : '/nopfp.webp'} className='object-cover h-7 w-7 rounded-full border-2 border-gray-200 cursor-pointer transition-transform transform hover:scale-105' />
            </div>
            <div className={`px-6 shadow-lg z-[9999999999] absolute right-0 mt-4 w-full bg-black font-semibold text-white transition-opacity duration-500 ease-in-out ${profileDrop ? 'opacity-100 visible' : 'opacity-0 invisible'}`}>
                <div className={`w-full flex flex-col`}>
                    {isLoggedIn && user ? (
                        <>
                            <Link onClick={handleLinkClick} to={'/user-profile'} className='px-4 pt-4 pb-4 cursor-pointer hover:bg-neutral-800 rounded-t-lg transition-colors duration-300 ease-in-out'><span className='flex items-center gap-2'>Profile <BsPersonArmsUp /></span></Link>
                            <Separator className="bg-neutral-800" />
                            {/* <Link onClick={handleLinkClick} to={'/my-videos'} className='px-4 pt-4 pb-4 cursor-pointer hover:bg-neutral-800 transition-colors duration-300 ease-in-out'><span className='flex items-center gap-2'>Videos <FaVideo /></span></Link>
                            <Separator className="bg-neutral-800" /> */}
                            <Link onClick={handleLinkClick} to={'/buildings'} className='px-4 pt-4 pb-4 cursor-pointer hover:bg-neutral-800 transition-colors duration-300 ease-in-out'><span className='flex items-center gap-2'>Buildings <BsBuildingsFill /></span></Link>
                            <Separator className="bg-neutral-800" />
                            <Link onClick={handleLogout} className='px-4 pt-4 pb-4 cursor-pointer hover:bg-neutral-800 rounded-b-lg transition-colors duration-300 ease-in-out'>{isLoading ? (<span className='loader'></span>) : (<span className='flex items-center gap-2'>Logout <IoLogOut /></span>)}</Link>
                        </>
                    ) : (
                        <>
                            <Link onClick={handleLinkClick} to={'/login'} className='px-4 pt-4 pb-4 cursor-pointer hover:bg-neutral-800 rounded-t-lg transition-colors duration-300 ease-in-out'>Login</Link>
                            <Separator className="bg-neutral-800" />
                            <Link onClick={handleLinkClick} className='px-4 pt-4 pb-4 cursor-pointer hover:bg-neutral-800 rounded-b-lg transition-colors duration-300 ease-in-out'>Docs</Link>
                        </>
                    )}
                </div>
            </div>
            <Notifications notifDrop={notifDrop} />
        </div>
    )
}

export default MobileNav
