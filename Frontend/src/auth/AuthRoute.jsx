import { useAuth } from '../contexts/AuthContext'
import React from 'react'
import { Navigate, Outlet } from 'react-router-dom'

const AuthRoute = () => {
    const { isLoggedIn,  isLoading, loggedInUser, isNewUser } = useAuth()
    
    if (isLoading) {
        return (
            <div className='loader'></div>
        )
    }

    if (!isLoggedIn && !loggedInUser) {
        return <Outlet />
    }

    return <Navigate to={isNewUser.current ? "/map?new" : "/city"} replace />
}

export default AuthRoute

