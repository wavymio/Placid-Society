import React from 'react'
import { IoCloseSharp } from 'react-icons/io5'
import { Link } from 'react-router-dom'

const FriendsTab = ({ sameUser, setOpenFriends, user, loggedInUser }) => {
    return (
        <div className='px-5 xs:px-0 flex items-center justify-center z-20 fixed top-0 left-0 bg-transparent w-full h-full backdrop-filter backdrop-blur-lg shadow-lg rounded-lg'>
            <div className='relative flex flex-col gap-5 overflow-y-auto bg-black p-10 w-[350px] max-h-[400px] border border-neutral-800 rounded-lg'>
                <div onClick={() => setOpenFriends(false)} className='absolute top-1 right-1 rounded-lg py-2 px-2 bg-neutral-900 hover:bg-red-900 text-xs cursor-pointer transition-all duration-300 ease-in-out font-bold'>
                    <IoCloseSharp />
                </div>
                {sameUser ? (
                    <>
                        {user.onlineFriends.map((friend, index) => (
                            <Link to={`/user/${friend.userId._id}`} className='relative bg-neutral-950 h-12 xs:h-16 rounded-l-full rounded-r-full flex items-center gap-3 cursor-pointer hover:scale-105 transition-all duration-300 ease-in-out' key={index}>
                                <div><img src={friend.userId.profilePicture} alt='img' className='object-cover h-12 w-12 xs:h-16 xs:w-16 rounded-full' /></div>
                                <div className='text-sm font-bold'>{friend.userId.username[0].toString().toUpperCase()+friend.userId.username.toString().slice(1)}</div>
                                <div className='absolute h-3 w-3 xs:h-3 xs:w-3 bottom-0 left-8 xs:left-12 border border-neutral-950 rounded-full bg-green-400'></div>
                            </Link>
                        ))}
                        {user.offlineFriends.map((friend, index) => (
                            <Link to={`/user/${friend.userId._id}`} className='bg-neutral-950 h-12 xs:h-16 rounded-l-full rounded-r-full flex items-center gap-3 cursor-pointer hover:scale-105 transition-all duration-300 ease-in-out' key={index}>
                                <div><img src={friend.userId.profilePicture} alt='img' className='object-cover h-12 w-12 xs:h-16 xs:w-16 rounded-full' /></div>
                                <div className='text-sm  font-bold'>{friend.userId.username[0].toString().toUpperCase()+friend.userId.username.toString().slice(1)}</div>
                            </Link>
                        ))}
                    </>
                ) : (
                    <>
                        {user.friends.map((friend, index) => (
                            <Link to={`/user/${friend.userId._id}`} className='relative bg-neutral-950 h-12 xs:h-16 rounded-l-full rounded-r-full flex items-center gap-3 cursor-pointer hover:scale-105 transition-all duration-300 ease-in-out' key={index}>
                                <div><img src={friend.userId.profilePicture} alt='img' className='object-cover h-12 w-12 xs:h-16 xs:w-16 rounded-full' /></div>
                                <div className='text-sm xs:text-lg font-bold'>{friend.userId.username[0].toString().toUpperCase()+friend.userId.username.toString().slice(1)}</div>
                                {loggedInUser?._id === friend.userId._id &&
                                    <div className='absolute h-3 w-3 xs:h-3 xs:w-3 bottom-0 left-8 xs:left-12 border border-neutral-950 rounded-full bg-green-400'></div>
                                }
                            </Link>
                        ))}
                    </>
                )}
            </div>
        </div>
    )
}

export default FriendsTab
