import React, { useEffect, useState } from 'react'
import { IoCloseSharp } from "react-icons/io5"

const PatchEditForms = ({ response, isLoading, editUser, setOpenUsername, user }) => {
    const [username, setUsername] = useState(user?.username)
    const [usernameError, setUsernameError] = useState('')

    const handleSubmit = (ev) => {
        ev.preventDefault()
        if (!username) {
            setUsernameError('Please choose a username')
            return 
        }

        if (username === user?.username) {
            return
        }

        editUser({username})
    }

    useEffect(() => {
        if (response?.error) {
            setUsernameError(response.error)
        }
    }, [response])

    return (
        <div className='px-5 xs:px-0 flex items-center justify-center z-20 fixed top-0 left-0 bg-transparent w-full h-full backdrop-filter backdrop-blur-lg shadow-lg rounded-lg'>
            <form onSubmit={handleSubmit} className='relative flex flex-col gap-5 bg-black p-10 w-[350px] border border-neutral-800 rounded-lg'>
                <div onClick={() => setOpenUsername(false)} className='absolute top-1 right-1 rounded-lg py-2 px-2 bg-neutral-900 hover:bg-red-900 text-xs cursor-pointer transition-all duration-300 ease-in-out font-bold'>
                    <IoCloseSharp />
                </div>
                <div>
                    <input value={username} onChange={(ev) => setUsername(ev.target.value)} className='w-full p-3 rounded-lg border border-neutral-800 bg-inherit focus:outline-none focus:ring-1 focus:ring-neutral-800 placeholder-neutral-200 placeholder:text-sm' placeholder='Change Username' />
                    {usernameError && (<span className='text-xs whitespace-nowrap ml-1 mt-1 text-red-500'>{usernameError}</span>)}
                </div>
                <div className='flex w-full xs:justify-end'>
                    <button disabled={isLoading} className={`min-w-full xs:min-w-32 cursor-pointer bg-neutral-900 border border-white flex justify-center whitespace-nowrap  px-2 py-3 rounded-lg font-semibold text-sm hover:bg-neutral-950 transition-colors ease-in-out duration-300`}>
                        {isLoading ? (
                            <span className='loader'></span>
                        ) : (
                            <span>Save Changes</span>
                        )}
                    </button>
                </div>
            </form>
        </div>
    )
}

export default PatchEditForms
