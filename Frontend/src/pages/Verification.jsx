import React, { useEffect } from 'react'
import { FaCheck, FaCross } from "react-icons/fa6"
import { IoClose } from 'react-icons/io5'
import { useParams } from 'react-router-dom'

const Verification = () => {
    const { outcome, reason } = useParams()

    useEffect(() => {
        if (outcome === "successful") {
            const channel = new BroadcastChannel('email_verification')
            channel.postMessage({ status: 'verified' })
            channel.close()
            // When you are sending a message via a BroadcastChannel, the channel is only needed momentarily to send the message. Once the message is sent, there's no reason to keep the channel open.
            // By calling channel.close() immediately after sending, you ensure:
            // Resources used by the sending channel are freed up quickly.
            // There's no lingering channel that might accidentally receive messages or remain open unnecessarily.
        }
    }, [outcome])

    const renderFailureMessage = (reason) => {
        switch (reason) {
            case 'no-user':
                return 'The user associated with this request could not be found.'
            case 'no-token':
                return 'No token was provided for email verification.'
            case 'expired-token':
                return 'The token has expired. Please request a new verification email.'
            case 'fishy':
                return 'Something unusual happened during the verification process.'
            case 'email-taken':
                return 'The email address is already in use by another account.'
            default:
                return 'An unknown error occurred. Please try again later.'
        }
    }

    if (outcome === "successful") {
        return (
            <div className='px-5 xs:px-0 flex items-center justify-center z-20 fixed top-0 left-0 bg-transparent w-full h-full backdrop-filter backdrop-blur-lg shadow-lg rounded-lg'>
                <div className='relative flex flex-col items-center justify-center gap-4 bg-black p-10 min-h-[350px] w-[350px] border border-neutral-800 rounded-lg'>
                    <div className='border-[3px] border-white h-20 w-20 rounded-full flex items-center justify-center'>
                        <FaCheck className='h-6 w-6 text-white' />
                    </div>
                    <div className='font-bold text-sm text-white'>Verification Successful!</div>
                </div>
            </div>
        )
    }

    return (
        <div className='px-5 xs:px-0 flex items-center justify-center z-20 fixed top-0 left-0 bg-transparent w-full h-full backdrop-filter backdrop-blur-lg shadow-lg rounded-lg'>
            <div className='relative flex flex-col items-center justify-center gap-4 bg-black p-10 min-h-[350px] w-[350px] border border-neutral-800 rounded-lg'>
                <div className='border-[3px] border-red-300 h-20 w-20 rounded-full flex items-center justify-center'>
                    <IoClose className='h-8 w-8 text-red-300' />
                </div>
                <div className='font-bold text-sm text-red-300 flex items-center justify-center text-center'>{renderFailureMessage(reason)}</div>
            </div>
        </div>
    )
}

export default Verification
