import { useQueryClient } from 'react-query'
import LoginForm from '../components/LoginForm'
import React, { useEffect, useState } from 'react'
import { useLoginMyUser } from '../api/MyUserApi'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

const Login = () => {
    const queryClient = useQueryClient()
    const { isLoggedIn } = useAuth()
    const { loginUser, isLoading, isSuccess, isError, error } = useLoginMyUser() 
    const [response, setResponse] = useState({})
    const navigate = useNavigate()

    const handleLogin = async (inputs) => {
        const res = await loginUser(inputs)
        setResponse(res)
        if (res?.success) {
            // const redirectToRoom = sessionStorage.getItem('redirectToRoom')
            await queryClient.invalidateQueries('validateUser')
            await queryClient.invalidateQueries('getCurrentCityRoles')
            // await queryClient.invalidateQueries('getMyUserCoords')
        }
    }

    // useEffect(() => {
    //     if (isLoggedIn) {
    //         navigate('/')
    //     } 
    // })

    return (
        <LoginForm buttonText={"Login"} bottomText={"Don't have an account?"} bottomLinkText={"Create One"} bottomLink={"/signup"} handleLoginOrSignUp={handleLogin} response={response} isLoading={isLoading} />
    )
}

export default Login
