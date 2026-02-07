import React from 'react'
import { FaLock } from 'react-icons/fa'

const RoomPrivacyButton = ({ isPublic, setIsPublic }) => {

    const togglePrivacy = () => {
        setIsPublic(!isPublic)
    }

    return (
        <>
            <div onClick={togglePrivacy} className="cursor-pointer relative bg-neutral-900 w-16 h-8 xs:w-24 xs:h-12 sm:w-32 sm:h-16 my-4 rounded-full">
                <div className={`${isPublic ? 'translate-x-0' : 'translate-x-full'} transition-all duration-300 ease-in-out absolute top-0 left-0 h-full w-8 xs:w-12 sm:w-16 bg-white rounded-full cursor-pointer`}></div>
                {!isPublic && (
                    <div className='w-full h-full rounded-full flex items-center pl-2 xs:pl-4 sm:pl-5'>
                        <FaLock className='h-[15px] w-[15px] xs:h-[20px] xs:w-[20px] sm:h-[30px] sm:w-[30px]' />
                    </div>
                )}
            </div>
            {isPublic ? (
                <div className='text-xs xs:text-sm'>
                    Public
                </div>
            ) : (
                <div className='text-xs xs:text-sm'>
                    Private
                </div>
            )}
        </>
    )
}

export default RoomPrivacyButton
