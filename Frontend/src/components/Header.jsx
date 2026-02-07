import React from 'react'
import { Link } from 'react-router-dom'
import MobileNav from './MobileNav'
import MainNav from './MainNav'
import { Separator } from './ui/separator'
import { useAuth } from '../contexts/AuthContext'
import { useLogoutMyUser } from '../api/MyUserApi'
import SearchBar from './SearchBar'
import MobileSearchBar from './MobileSearchBar'

const Header = () => {
    // const {isError, userInfo} = useValidateMyUser()
    const { isLoggedIn, loggedInUser, isLoading: isAuthLoading } = useAuth()
    const { logoutUser, isLoading } = useLogoutMyUser()

    return (
        <>
            <div onMouseDown={(e) => e.preventDefault()} className='bg-black py-5 w-full fixed z-[9999999] mb-10'>
                <div className="container mx-auto flex justify-between items-center">
                    <Link to={'/city'} className='text-sm sm:text-xl font-heading font-bold logo tracking-wider text-white'>
                        PLÂCID
                    </Link>
                    {/* <div className='hidden md:block md:w-96 md:relative'>
                        <SearchBar />
                    </div> */}
                    <div className='flex items-center gap-2'>
                        {/* <div className='md:hidden'>
                            <MobileSearchBar />
                        </div> */}
                        <div className='xs:hidden'>
                            <MobileNav isAuthLoading={isAuthLoading} isLoggedIn={isLoggedIn} user={loggedInUser} logout={logoutUser} isLoading={isLoading} />
                        </div>
                        <div className='hidden xs:block '>
                            <MainNav isAuthLoading={isAuthLoading} isLoggedIn={isLoggedIn} user={loggedInUser} logout={logoutUser} isLoading={isLoading} />
                        </div>
                    </div>
                </div>
            </div>
            <Separator className="bg-neutral-800" />
        </>
    )
}

export default Header
