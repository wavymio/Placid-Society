import { useToast } from '../contexts/ToastContext'
import { useSendVerificationEmail} from '../api/MyUserApi'
import React, { useEffect, useState } from 'react'
import { IoCloseSharp } from 'react-icons/io5'
import { useQueryClient } from 'react-query'

const VerifyTab = ({ handleOpenVerify, user }) => {
    const { addToast } = useToast()
    const queryClient = useQueryClient()
    const {sendVerificationEmail, isLoading: isSendVerificationEmailLoading } = useSendVerificationEmail()
    const [email, setEmail] = useState(user?.isVerified ? user.email :  (user?.pendingEmail || ''))
    const [emailError, setEmailError] = useState('')

    const handleSubmit = async (ev) => {
        ev.preventDefault()
        if (user?.isVerified) {
            addToast("success", "Feature disabled tempoarily")
            return
        } 

        if (!email) return
        if (isSendVerificationEmailLoading) return

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(email)) {
            setEmailError('Invalid Email')
            return
        }

        const input = {email}
        console.log(input)
        const res = await sendVerificationEmail(input)
        if (res.error) {
            setEmailError('')
            setEmailError(res.error)
        }

        if (res.success) {
            setEmailError('')
            await queryClient.invalidateQueries('validateUser')
        }
    }

    const emailVerified = async () => {
        console.log("verification successful")
        await queryClient.invalidateQueries('validateUser')
        handleOpenVerify()
    }

    useEffect(() => {
        const channel = new BroadcastChannel('email_verification')
        channel.onmessage = async (event) => {
            if (event.data.status === 'verified') {
                await emailVerified()
            }
        }

        return () => channel.close()
    }, [])

    return (
        <div className='px-5 xs:px-0 flex items-center justify-center z-20 fixed top-0 left-0 bg-transparent w-full h-full backdrop-filter backdrop-blur-lg shadow-lg rounded-lg'>
            <form onSubmit={handleSubmit} className='relative flex flex-col gap-5 bg-black p-10 w-[350px] border border-neutral-800 rounded-lg'>
                <div onClick={handleOpenVerify} className='absolute top-1 right-1 rounded-lg py-2 px-2 bg-neutral-900 hover:bg-red-900 text-xs cursor-pointer transition-all duration-300 ease-in-out font-bold'>
                    <IoCloseSharp />
                </div>
                <div className='w-full'>
                    <input value={email} onChange={(ev) => setEmail(ev.target.value)} className='w-full p-3 rounded-lg border border-neutral-800 bg-inherit focus:outline-none focus:ring-1 focus:ring-neutral-800 placeholder-neutral-200 placeholder:text-sm' placeholder='Enter Email' />
                    {emailError && <span className='text-xs overflow-x-hidden inline-block w-full whitespace-nowrap mt-1 ml-1 text-red-500'>{emailError}</span>}
                </div>
                <div className='flex  w-full xs:justify-end'>
                    <button disabled={isSendVerificationEmailLoading} type="submit" className={`min-w-full xs:min-w-32 cursor-pointer bg-neutral-900 border border-white flex items-center justify-center whitespace-nowrap  px-2 py-3 rounded-lg font-semibold text-sm hover:bg-neutral-950 transition-colors ease-in-out duration-300`}>
                        {isSendVerificationEmailLoading ? (
                            <span className='loader'></span>
                        ) : (
                            <span>{user?.isVerified ? 'Change Email' : 'Verify Account'}</span>
                        )}
                    </button>
                </div>
            </form>
        </div>
    )
}

export default VerifyTab
