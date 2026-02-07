import { useSearchUsernameForInvite } from '../api/SearchApi'
import React, { useEffect, useState } from 'react'
import { IoCloseSharp } from "react-icons/io5"
import { Badge } from './ui/badge'
import { useAuth } from '../contexts/AuthContext'

const InviteFriends = ({ invitedUsers, setInvitedUsers }) => {
    const { loggedInUser, isLoading: isAuthLoading} = useAuth()
    const { searchUsersForInvite, isLoading } = useSearchUsernameForInvite()
    const [searchInput, setSearchInput] = useState('')
    const [usernames, setUsernames] = useState(undefined)

    const handleSearchChange = async () => {
        if (searchInput) {
            const payload = {
                searchInput
            }
            const data = await searchUsersForInvite(payload)
            setUsernames(data)
        }
    }

    const handleSearchClick = async () => {
        if (!searchInput) {
            const payload = {
                searchInput
            }
            const data = await searchUsersForInvite(payload)
            setUsernames(data)
        }
    }

    const sendInvite = (user) => {
        setInvitedUsers(prev => [...prev, user])
    }

    const cancelInvite = (user) => {
        setInvitedUsers(prev => prev.filter(usernames => usernames._id !== user._id))
    }

    const clearSearch = (ev) => {
        ev.preventDefault()
        setSearchInput('')
        setUsernames(undefined)
    }

    useEffect(() => {
        handleSearchChange()
    }, [searchInput])

    return (
        <div className='w-full relative'>
            <div className='w-full flex flex-col gap-5'>
                <div className='bg-black w-full h-12 top-16 xs:top-20 left-0 p-0 sm:top-0 sm:left-0 sm:relative z-4 flex items-center sm:h-10 sm:w-full'>
                    <input
                    onFocus={handleSearchClick}
                    value={searchInput}
                    onChange={(ev) => setSearchInput(ev.target.value)}
                    placeholder='Invite Friends or Strangers'
                    className='py-3 px-3 w-full h-12 sm:h-full sm:p-3 rounded-l-lg border border-neutral-800 text-[11px] xs:text-xs bg-inherit focus:outline-none placeholder-neutral-200 placeholder:text-[11px] xs:placeholder:text-xs' />
                    <button onClick={clearSearch} className='w-16 h-full flex items-center justify-center border-none rounded-r-lg bg-neutral-800 sm:p-3 sm:h-full sm:w-auto hover:bg-neutral-900 transition-colors ease-in-out duration-300'>
                        <IoCloseSharp />
                    </button>
                </div>
                <div className='max-h-44 flex flex-wrap justify-center gap-1 overflow-y-scroll overflow-x-hidden'>
                    {invitedUsers.map((username, index) => (
                        <div key={index} className='cursor-pointer relative h-12 w-12 sm:h-14 sm:w-14 rounded-full hover:scale-105 transition-all ease-in-out duration-300'>
                            <img className='h-full w-full rounded-full object-cover' src={username.profilePicture} alt="picture" />
                            <div onClick={() => cancelInvite(username)} className='absolute top-0 left-0 flex items-center justify-center black-opacity w-full h-full rounded-full hover:opacity-100 opacity-100 lg:opacity-0 transition-all ease-in-out duration-300'>
                                <IoCloseSharp className='h-[20px] w-[20px] sm:h-[25px] sm:w-[25px]' />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            {isLoading || isAuthLoading ? (
                <div className={`mt-4 sm:mt-2 left-0 top-10 w-full z-10 shadow-lg p-0 sm:z-5 sm:w-full rounded-lg bg-black text-white absolute sm:right-0 transition-opacity duration-500 ease-in-out ${isLoading} ? 'opacity-100 visible' : 'opacity-0 invisible'}`}>
                    <div className='p-4 sm:p-3 border border-neutral-800 flex justify-center rounded-lg'>
                        <div className='loader'></div>
                    </div>
                </div>
            ) : (
                <div className={`mt-4 sm:mt-2 max-h-[200px] sm:max-h-[270px] rounded-lg left-0 top-10 w-full shadow-lg z-10 p-0 sm:z-5 sm:w-full bg-transparent text-white absolute sm:right-0 transition-opacity duration-500 ease-in-out ${usernames ? 'opacity-100 visible' : 'opacity-0 invisible'}`}>
                    <div className={`bg-black ${usernames?.length > 2 ? 'overflow-y-scroll' : 'null'} sm:${usernames?.length > 3 ? 'overflow-y-scroll' : 'null'} max-h-[200px] sm:max-h-[270px] rounded-lg border w-full border-neutral-800 flex flex-col`} >
                        {usernames?.length > 0 ? (
                            usernames.map((username, index) => (
                                <div key={index} className={`relative transition-colors duration-300 ease-in-out hover:bg-neutral-900  ${index === 0 && (usernames?.length < 3) ? 'rounded-t-lg' : null} ${(index === usernames?.length-1) && (usernames?.length < 3) ? 'rounded-b-lg' : null}`}>
                                    <div className={`px-4 pt-4 pb-4 cursor-pointer flex items-center gap-2 text-sm ${index !== 0 ? null : 'rounded-t-lg'} ${index === usernames.length-1 ? 'rounded-b-lg' : null} transition-colors duration-300 ease-in-out`} key={index}>
                                        <span className='max-w-24 sm:max-w-36 overflow-hidden'>{username.username}</span>
                                        
                                        {username.friends.some((friend) => friend.userId === loggedInUser._id) && (
                                            <Badge className={'hidden xs:flex py-2 text-[9px] xs:text-xs hover:scale-110 transition-all duration-300 ease-in-out'}>
                                                <span>Friend</span>
                                            </Badge>
                                        )}
        
                                        {!invitedUsers.some((user) => user._id === username._id) ? (
                                            <Badge onClick={() => sendInvite(username)} className={'flex text-[9px] xs:text-xs items-center justify-center w-16 py-2 hover:scale-110 transition-all duration-300 ease-in-out'}>
                                                <span className='flex items-center gap-2'>Invite</span>
                                            </Badge>
                                        ) : ( 
                                            <Badge onClick={() => cancelInvite(username)} className={'text-[9px] xs:text-xs py-2 hover:scale-110 transition-all duration-300 ease-in-out'}>
                                                <span>Sent</span>
                                            </Badge>
                                        )}
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className='sm:p-3 p-4 text-sm rounded-lg'>No results found</div>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}

export default InviteFriends

// import { useSearchUsernameForInvite } from '../api/SearchApi'
// import React, { useEffect, useState } from 'react'
// import { IoCloseSharp } from "react-icons/io5"
// import { Badge } from './ui/badge'
// import { useAuth } from '../contexts/AuthContext'

// const InviteFriends = () => {
//     const { loggedInUser, isLoading: isAuthLoading} = useAuth()
//     const { searchUsersForInvite, isLoading } = useSearchUsernameForInvite()
//     const [searchInput, setSearchInput] = useState('')
//     const [usernames, setUsernames] = useState(undefined)
//     const [invitedUsers, setInvitedUsers] = useState([])

//     const handleSearchChange = async () => {
//         if (searchInput) {
//             const data = await searchUsersForInvite(searchInput)
//             setUsernames(data)
//         }
//     }

//     const handleSearchClick = async () => {
//         if (!searchInput) {
//             const data = await searchUsersForInvite(searchInput)
//             setUsernames(data)
//         }
//     }

//     const sendInvite = (user) => {
//         setInvitedUsers(prev => [...prev, user])
//     }

//     const cancelInvite = (user) => {
//         setInvitedUsers(prev => prev.filter(usernames => usernames._id !== user._id))
//     }

//     const clearSearch = (ev) => {
//         ev.preventDefault()
//         setSearchInput('')
//         setUsernames(undefined)
//     }

//     useEffect(() => {
//         handleSearchChange()
//     }, [searchInput])

//     return (
//         <div className='w-full relative'>
//             <div className='w-full flex flex-col gap-5'>
//                 <div className='bg-black w-full h-12 top-16 xs:top-20 left-0 px-7 sm:p-0 sm:top-0 sm:left-0 sm:relative z-4 flex items-center sm:h-10 sm:w-full sm:bg-black'>
//                     <input
//                     onFocus={handleSearchClick}
//                     value={searchInput}
//                     onChange={(ev) => setSearchInput(ev.target.value)}
//                     placeholder='Invite Friends or Strangers'
//                     className='py-3 px-3 w-full h-12 sm:h-full sm:p-3 rounded-l-lg border border-neutral-800 sm:text-xs bg-inherit focus:outline-none placeholder-neutral-200 placeholder:text-xs' />
//                     <button onClick={clearSearch} className='w-16 h-full flex items-center justify-center border-none rounded-r-lg bg-neutral-800 sm:p-3 sm:h-full sm:w-auto hover:bg-neutral-900 transition-colors ease-in-out duration-300'>
//                         <IoCloseSharp />
//                     </button>
//                 </div>
//                 <div className='flex flex-wrap justify-center gap-1'>
//                     {invitedUsers.map((username, index) => (
//                         <div key={index} className='cursor-pointer relative h-12 w-12 rounded-full hover:scale-105 transition-all ease-in-out duration-300'>
//                             <img className='h-full w-full rounded-full object-cover' src={username.profilePicture} alt="picture" />
//                             <div onClick={() => cancelInvite(username)} className='absolute top-0 left-0 flex items-center justify-center black-opacity w-full h-full rounded-full hover:opacity-100 opacity-0 transition-all ease-in-out duration-300'>
//                                 <IoCloseSharp style={{ fontSize: '25px' }} />
//                             </div>
//                         </div>
//                     ))}
//                 </div>
//             </div>
//             {isLoading || isAuthLoading ? (
//                 <div className={`mt-20 xs:mt-24 left-0 top-10 w-full z-10 shadow-lg px-7 sm:p-0 sm:z-5 sm:w-full rounded-lg bg-black text-white absolute sm:right-0 sm:mt-2 transition-opacity duration-500 ease-in-out ${isLoading} ? 'opacity-100 visible' : 'opacity-0 invisible'}`}>
//                     <div className='p-4 sm:p-3 border border-neutral-800 flex justify-center rounded-lg'>
//                         <div className='loader'></div>
//                     </div>
//                 </div>
//             ) : (
//                 <div className={`max-h-[270px] rounded-lg left-0 top-10 w-full shadow-lg z-10 px-7 sm:p-0 sm:z-5 sm:w-full bg-black text-white absolute sm:right-0 sm:mt-2 transition-opacity duration-500 ease-in-out ${usernames ? 'opacity-100 visible' : 'opacity-0 invisible'}`}>
//                     <div className={`overflow-y-scroll max-h-[270px] rounded-lg border w-full border-neutral-800 flex flex-col`} >
//                         {usernames?.length > 0 ? (
//                             usernames.map((username, index) => (
//                                 <div key={index}>
//                                     <div className={`px-4 pt-4 pb-4 cursor-pointer flex items-center gap-2 text-sm ${index !== 0 ? null : 'rounded-t-lg'} ${index === usernames.length-1 ? 'rounded-b-lg' : null} transition-colors duration-300 ease-in-out`} key={index}>
//                                         {username.username}
                                        
//                                         {username.friends.some((friend) => friend.userId === loggedInUser._id) && (
//                                             <Badge className={'py-2 hover:scale-110 transition-all duration-300 ease-in-out'}>
//                                                 <span>Friend</span>
//                                             </Badge>
//                                         )}
        
//                                         {!invitedUsers.some((user) => user._id === username._id) ? (
//                                             <Badge onClick={() => sendInvite(username)} className={'py-2 hover:scale-110 transition-all duration-300 ease-in-out'}>
//                                                 <span className='flex items-center gap-2'>Invite</span>
//                                             </Badge>
//                                         ) : ( 
//                                             <Badge onClick={() => cancelInvite(username)} className={'py-2 hover:scale-110 transition-all duration-300 ease-in-out'}>
//                                                 <span>Sent</span>
//                                             </Badge>
//                                         )}
//                                     </div>
//                                 </div>
//                             ))
//                         ) : (
//                             <div className='sm:p-3 p-4 text-sm rounded-lg'>No results found</div>
//                         )}
//                     </div>
//                 </div>
//             )}
//         </div>
//     )
// }

// export default InviteFriends
