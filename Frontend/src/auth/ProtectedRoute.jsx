import { useAuth } from '../contexts/AuthContext'
import React from 'react'
import { Navigate, Outlet } from 'react-router-dom'

const ProtectedRoute = () => {
    const { isLoggedIn,  isLoading, loggedInUser } = useAuth()
    
    if (isLoading) {
        return (
            <div className='flex items-center justify-center w-full h-screen'>
                <div className='flex flex-col items-center gap-5'>
                    <div className='big-loader'></div>
                    {/* <div className='text-xl font-heading font-bold text-white'>{` PLÂCID `}</div> */}
                </div>
                
            </div>
        )
    }

    if (isLoggedIn && loggedInUser) {
        return <Outlet />
    }

    return <Navigate to="/login" replace />
}

export default ProtectedRoute

