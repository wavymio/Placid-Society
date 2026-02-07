import { useNavigate } from 'react-router-dom'
import { useCreateMyUser } from '../api/MyUserApi'
import LoginForm from '../components/LoginForm'
import React, { useState } from 'react'
import { useQueryClient } from 'react-query'
import { useAuth } from '../contexts/AuthContext'

const SignUp = () => {
    const queryClient = useQueryClient()
    const { isNewUser }= useAuth()
    const { createUser, isLoading, isSuccess, isError, error } = useCreateMyUser() 
    const [response, setResponse] = useState({})
    const navigate = useNavigate()

    const handleSignUp = async (inputs) => {
        const res = await createUser(inputs)
        setResponse(res)
        if (res?.success) {
            // const redirectToRoom = sessionStorage.getItem('redirectToRoom')
            isNewUser.current = true
            await queryClient.invalidateQueries('validateUser')
            await queryClient.invalidateQueries('getCurrentCityRoles')
            // await queryClient.invalidateQueries('getMyUserCoords')
        }
    }

    return (
        <LoginForm buttonText={"Sign Up"} bottomText={"Already have an account?"} bottomLinkText={"Sign In"} bottomLink={"/login"} handleLoginOrSignUp={handleSignUp} response={response} isLoading={isLoading} />
    )
}

export default SignUp
