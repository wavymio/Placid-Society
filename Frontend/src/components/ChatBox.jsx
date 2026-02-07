import { format, formatDate, isToday, isYesterday, parseISO } from 'date-fns'
import { useGetConversation, useGetSeenStatuses, useSendMessage } from '../api/ConversationApi'
import React, { useEffect, useRef, useState } from 'react'
import { IoMdArrowUp, IoMdAttach, IoMdSend, IoMdVideocam } from 'react-icons/io'
import { IoCheckmark, IoCheckmarkDoneSharp, IoCheckmarkSharp, IoCloseSharp } from 'react-icons/io5'
import { LiaCommentSlashSolid } from "react-icons/lia"
import { FaCheck, FaCheckDouble } from 'react-icons/fa'
import { debounce } from 'lodash'
import { useQueryClient } from 'react-query'
import { useRoomEvents } from '../contexts/RoomEventsContext'

const ChatBox = ({ room, loggedInUser, socket, scrollToTop }) => {
    const queryClient = useQueryClient()
    const { conversation, isConversationLoading } = useGetConversation(room.conversation._id)
    const { seenStatuses, isSeenStatusesLoading } = useGetSeenStatuses(room.conversation._id)
    const { sendMessage, isSendMessageLoading } = useSendMessage()
    const { roomEvent, changeRoomEvent } = useRoomEvents()
    const [messageMode, setMessageMode] = useState('text')
    const [textMessage, setTextMessage] = useState('')
    const [imageCaption, setImageCaption] = useState('')
    const [ imageMessage, setImageMessage ] = useState(null)
    const [ imageMessagePreview, setImageMessagePreview ] = useState(null)
    const fileInputRef = useRef(null)
    const [messages, setMesages] = useState([]) 
    const messageRefs = useRef([])
    const messageEndRef = useRef(null)
    const containerRef = useRef(null)
    const seenMessages = useRef(new Set())
    const [pageStatus, setPageStatus] = useState("new")
    const [pendingMessages, setPendingMessages] = useState([])
    const [isSending, setIsSending] = useState(false)
    const [sendingQueue, setSendingQueue] = useState([])
    const [markingQueue, setMarkingQueue] = useState([])
    const [isMarking, setIsMarking] = useState(false)
    const [animationKey, setAnimationKey] = useState(0)

    const formatMessageDate = (dateString) => {
        const date = parseISO(dateString)

        // if (isToday(date)) {
            return format(date, "HH:mm")
        // } else if (isYesterday(date)) {
        //     return format(date, "'Yesterday', HH:mm")
        // } else {
        //     return format(date, "MMMM do, HH:mm")
        // }
    }

    const handleImageMessageChange = (ev) => {
        const image = ev.target.files[0]
        setImageMessage(image)
        setImageMessagePreview(URL.createObjectURL(image))
        if (image) {
            setTextMessage('')
            setMessageMode('image')
        }
    }

    const removeImage = () => {
        setImageMessage(null)
        setImageMessagePreview(null)
        if (fileInputRef.current) {
            fileInputRef.current.value = ''
        }
        setImageCaption('')
        setMessageMode('text')
    }

    const resetInputs = () => {
        setImageCaption('')
        setImageMessage(null)
        setImageMessagePreview(null)
        if (fileInputRef.current) {
            fileInputRef.current.value = ''
        }
        setTextMessage('')
        setMessageMode('text')
    }

    const getUserColour = (userId) => {
        if (room.owner.some(owner => owner._id === userId)) {
            return "text-yellow-500"
        } 
        if (room.admins.some(admin => admin._id === userId)) {
            return "text-red-300"
        }
        return "text-white"
    }

    const getBorderColour = (userId) => {
        if (room.owner.some(owner => owner._id === userId)) {
            return "border-yellow-500"
        } 
        if (room.admins.some(admin => admin._id === userId)) {
            return "border-red-300"
        }
        return "border-neutral-900"
    }

    const scrollToBottom = () => {
        messageEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }

    const scrollToMessage = (messageIndex) => {
        if (messageRefs.current[messageIndex]) {
          messageRefs.current[messageIndex].scrollIntoView({ behavior: 'smooth' })
        }
    }

    const handleScroll = (ev) => {
        const container = containerRef.current
        markMessagesAsSeen(container)
    }

    // const debouncedHandleScroll = debounce(handleScroll, 1000)

    // const addToMarkingQueue = (messageId, roomId) => {
    //     setMarkingQueue(prevQueue => [...prevQueue, { messageId, roomId }])
    // }

    // const processMarkingQueue = async () => {
    //     if (isMarking || markingQueue.length === 0) return
    
    //     setIsMarking(true)
    //     const { messageId, roomId } = markingQueue[0]
    
    //     try {
    //         // Emit marking as seen
    //         markMessageAsSeen(messageId, roomId)
    
    //         // Remove from queue
    //         setMarkingQueue(prevQueue => prevQueue.slice(1))
    //     } catch (error) {
    //         console.error("Error marking message as seen:", error)
    //     } finally {
    //         setIsMarking(false)
    //     }
    // }

    // useEffect(() => {
    //     if (!isMarking && markingQueue.length > 0) {
    //         processMarkingQueue()
    //     }
    // }, [markingQueue, isMarking])

    const markMessageAsSeen = (messageId, roomId) => {
        socket.emit('markMessageAsSeen', {messageId, roomId})
    }

    const markMessagesAsSeen = (container) => {
        messageRefs.current.forEach(async (element) => {
            if (element) {
                if (element.dataset.senderId.toString() === loggedInUser._id.toString()) return
                if (element.dataset.messageSeen === true) return

                const { top, bottom } = element.getBoundingClientRect()
                const containerRect = container.getBoundingClientRect()
    
                if (top >= containerRect.top && bottom <= containerRect.bottom) {

                    const messageId = element.dataset.messageId
                    
                    if (!seenMessages.current.has(messageId) && !pendingMessages.find(msg => msg._id === messageId)) {
                        seenMessages.current.add(messageId)
                        
                        // addToMarkingQueue(messageId, room?._id)
                        markMessageAsSeen(messageId, room?._id)
                    }
                }
            }
        })
    }

    const handleSubmit = async (ev) => {
        ev.preventDefault()

        if (messageMode === 'text' && !textMessage) return
        if (messageMode === 'image' && !imageMessage) return

        const tempMessageId = Date.now()
        const newMessage = {
            _id: tempMessageId,
            senderId: {
                _id: loggedInUser._id,
                username: loggedInUser.username,
                profilePicture: loggedInUser.profilePicture
            },
            message: messageMode === "text" ? textMessage : imageMessagePreview,
            imageCaption: messageMode === "image" ? imageCaption : null,
            type: messageMode === "text" ? "text" : "image",
            createdAt: new Date().toISOString(),
            status: 'sending',
            seen: []
        }
        
        setPendingMessages(prevMessages => [...prevMessages, newMessage])
        setSendingQueue(prevQueue => [...prevQueue, { tempMessageId, messageMode, textMessage, imageMessage, imageCaption }])

        resetInputs()
    }

    const handleKeyDown = (event) => {
        if (event.key === 'Enter') {
            console.log("yse")
            handleSubmit(event)
        }
    }

    useEffect(() => {
        if (sendingQueue.length > 0 && !isSending) {
            sendNextMessage()
        }
    }, [sendingQueue, isSending])

    const sendNextMessage = async () => {
        if (sendingQueue.length === 0 || isSending) return

        setIsSending(true)

        const { tempMessageId, messageMode, textMessage, imageMessage, imageCaption } = sendingQueue[0]
        
        const formData = new FormData()

        formData.append('roomId', room._id)
        formData.append('tempMessageId', tempMessageId)

        if (messageMode === "text") {

            formData.append('message', textMessage.trim())
            formData.append('messageMode', messageMode)

        } else if (messageMode === 'image') {
            
            formData.append('imageMessage', imageMessage)

            if (imageCaption.trim()) {
                formData.append('imageCaption', imageCaption.trim())
            }

            formData.append('messageMode', messageMode)
        }

        const payload = {
            conversationId: room.conversation._id,
            formData
        }

        try {
            const data = await sendMessage(payload)
    
            if (data.success) {
                await queryClient.invalidateQueries('getConversation')
                setPendingMessages(prevPendingMessages => {
                    return prevPendingMessages.filter(msg => msg._id.toString() !== data.tempMessageId.toString())
                })
                setSendingQueue(prevQueue => prevQueue.slice(1))
            }
        } catch (error) {
            console.error("Error sending message:", error)
        } finally {
            setIsSending(false)
        }
    }

    useEffect(() => {
        const allMessages = [
            ...(conversation?.messages || []),
            ...pendingMessages
        ]
        setMesages(allMessages)
    }, [conversation?.messages, pendingMessages])

    useEffect(() => {
        const handleNewMessage = async () => {
            await queryClient.invalidateQueries('getConversation')
        }

        const handleMessageSeen = async () => {
            await queryClient.invalidateQueries(['getSeenStatuses', room?.conversation._id])
        }

        socket.on("newMessage", handleNewMessage)
        socket.on("messageSeen", handleMessageSeen)

        return () => {
            socket.off("newMessage", handleNewMessage)
            socket.off("messageSeen", handleMessageSeen)
        }
    }, [socket, pendingMessages])

    useEffect(() => {
        // if I sent the last message
        if (messages[(messages?.length - 1)]?.senderId._id === loggedInUser?._id) {
            scrollToBottom()
        } 
        
        // if I didn't send the last message
        else {
            // the useEffect runs before the component mounts and the messages array might be empty
            // if the effect runs with the empty array, it will cause problems for us
            // it'll set page status to be old - we don't want this
            if (messages.length < 1) return

            // when I open the page for the first time
            if (pageStatus === "new") {
                const firstUnreadIndex = messages?.findIndex(message => {
                    return ((!message?.seen.includes(loggedInUser._id)) && ((message?.senderId._id !== loggedInUser._id)))
                })

                // scroll to the message
                // if the last sent message was not by me, and hasn't been read by me
                if (firstUnreadIndex !== -1) {
                    scrollToMessage(firstUnreadIndex)
                    setPageStatus("old")
                } 

                // scroll to the bottom
                // if the last sent message was not by me, but has been read by me
                else {
                    scrollToBottom()
                    setPageStatus("old")
                }
            } 

            // if the message was not sent by me and,
            // if the page is old that is:
            // if I get a new message after the page has loaded
            else {
                const lastMessageIndex = messages.length - 1
                const lastMessageElement = messageRefs.current[lastMessageIndex]

                if (lastMessageElement) {
                    const container = containerRef.current

                    const { top, bottom } = lastMessageElement.getBoundingClientRect()
                    const containerRect = container.getBoundingClientRect()
                    
                    // if the message is visible, scroll to the bottom 
                    if (top >= containerRect.top && bottom <= containerRect.bottom+25) {
                        scrollToMessage(lastMessageIndex)
                    }
                }
            }
        }

        if (messages.length > 0) {
            // Mark new incoming messages as seen immediately if they are in the viewport
            const container = containerRef.current
            if (container) {
                markMessagesAsSeen(container)
            }
        }
    }, [messages])

    useEffect(() => {
        if (roomEvent) {
            setAnimationKey(prevKey => prevKey + 1)
        }
    }, [roomEvent])

    if (!conversation || isConversationLoading || isSeenStatusesLoading) {
        return (
            <div className={`xs:h-[48vh] xs:w-full sm:w-full sm:h-[80vh] flex justify-center relative lg:bg-neutral-950 lg:w-1/3 lg:h-full rounded-xl`}>
                <div className='mt-36 flex flex-col items-center gap-4'>
                    <div className='big-loader'></div>
                    <div className='text-xs'>Getting Messages...</div>
                </div>
            </div>
        )
    }

    return (
        <div ref={containerRef} className={`px-1 sm:px-0 h-[54vh] mt-1 xs:bg-black xs:h-[48vh] xs:w-full sm:pt-[10px] sm:pb-[95px] sm:bg-black sm:w-full sm:h-[80vh] sm:rounded-xl lg:bg-neutral-950 lg:w-1/3 lg:h-full lg:rounded-xl lg:pt-[50px] ${conversation.messages?.length < 1 ? 'flex justify-center' : 'flex flex-col'} relative `}>
            <div className='hidden lg:flex items-center pl-5 absolute top-0 left-0 gap-2 rounded-t-xl bg-neutral-900 w-full h-14'>
                <div className='h-3 w-3 rounded-full bg-green-300'></div>
                <div key={animationKey} className='room-event-animation-large text-[13px] font-semibold'>{roomEvent ? roomEvent : `${room.participants.length} participants online`}</div>
            </div>
            {roomEvent && (
                <div key={animationKey} className='room-event-animation absolute top-0 right-2 text-xs rounded-l-xl w-auto px-3 py-2 font-bold flex lg:hidden bg-slate-800 items-center justify-center'>
                    {roomEvent}
                </div>
            )}
            <>
                {conversation.messages?.length < 1 ? (
                    <div className='mt-14 sm:mt-36 flex flex-col items-center gap-4'>
                        <div className='bg-neutral-900 flex items-center justify-center rounded-full border h-24 w-24'>
                            <LiaCommentSlashSolid className='h-8 w-8' />
                        </div>
                        <div className='text-xs'>NO MESSAGES</div>
                    </div>
                ) : (
                    <div onScroll={handleScroll} className='pb-12 overflow-y-scroll sm:p-2 w-full h-full flex flex-col gap-3'>
                    {messages?.map((message, index) => { 
                        const seenStatusMessage = seenStatuses?.messages?.find(msg => msg._id === message._id)
                        return (
                            <div 
                            ref={element => messageRefs.current[index] = element} 
                            data-message-id={message._id}
                            data-message-seen={seenStatusMessage?.seen?.includes(loggedInUser._id)}
                            data-sender-id={message?.senderId._id}
                            key={index} 
                            className={`text-xs sm:text-sm flex items-end ${message?.senderId?._id === loggedInUser._id ? 'justify-end' : null} gap-3`}>
                                {((message?.senderId?._id !== loggedInUser._id) && (message?.senderId?._id !== messages[(index + 1)]?.senderId?._id)) ? (
                                    <div className={`h-10 w-10 xs:h-12 xs:w-12 p-1 rounded-full border ${getBorderColour(message?.senderId?._id)}`}>
                                        <img src={message.senderId.profilePicture} className='h-full w-full object-cover rounded-full ' />
                                    </div>
                                ) : (
                                    <div className='h-10 w-10 xs:h-12 xs:w-12 p-1 rounded-full border border-neutral-900 opacity-0'></div>
                                )}
                                <div className={`flex flex-col gap-1 rounded-xl min-w-[60px] max-w-[200px] xs:max-w-[250px] h-auto ${message?.type === "image" ? null : 'pt-2 pl-3 pr-3 pb-2'} ${message.status === 'sending' ? 'bg-slate-900' : (message.senderId._id !== loggedInUser._id) ? 'bg-neutral-900' : 'bg-neutral-800'} transition-all duration-300 ease-in-out`}>
                                    {((message?.senderId._id !== loggedInUser._id) && (message?.senderId._id !== messages[(index - 1)]?.senderId._id)) && (
                                        <div className={`font-bold text-[11px] xs:text-xs ${getUserColour(message?.senderId._id)} ${message?.type === "image" ? 'pt-2 pl-3' : null}`}>{message.senderId.username}</div>
                                    )}
                                    {message?.type === "text" && (
                                        <div className='flex flex-wrap items-center h-full text-xs xs:text-sm'>{message?.message}</div>
                                    )}
                                    {message?.type === "image" && (
                                        <div className={`flex flex-col gap-0 h-auto w-40 xs:w-56 ${(message?.senderId._id !== loggedInUser._id) ? (message?.senderId._id === messages[(index - 1)]?.senderId._id) ? 'rounded-t-xl' : 'rounded-t-xl mt-2' : 'rounded-t-xl'}`}>
                                            <img src={message?.message} className={`object-cover w-full h-40 xs:h-56 ${(message?.senderId._id === loggedInUser._id) ? 'rounded-t-xl' : (message?.senderId._id !== messages[(index - 1)]?.senderId._id) ? null : 'rounded-t-xl'}`} />
                                            <div className='flex flex-wrap items-center h-full text-xs xs:text-sm pt-2 pl-3 pr-3 pb-2'>{message?.imageCaption}</div>
                                        </div>
                                    )}
                                    <div className={`w-full flex justify-between items-center gap-7 ${message.type === "image" ? 'pl-3 pr-3 pb-2' : null}`}>
                                        {((message.senderId._id === loggedInUser._id) && (message.status !== 'sending')) && (
                                            <>
                                                {!seenStatusMessage || ((seenStatusMessage?.seen.filter(userseen => userseen !== loggedInUser?._id).length < 1)) ? (
                                                    <div className={`flex items-center justify-start gap-1`}>
                                                        <span className='text-[9px] xs:text-[10px] font-semibold'>Sent,</span>
                                                        <IoCheckmarkSharp className='w-[11px] h-[11px] xs:h-[12px] xs:w-[12px]'/>
                                                    </div>
                                                ) : (
                                                    <div className={`flex items-center justify-start gap-1`}>
                                                        <span className='text-[10px] font-semibold'>Seen,</span>
                                                        <IoCheckmarkDoneSharp className='w-[11px] h-[11px] xs:h-[12px] xs:w-[12px]' />
                                                    </div>
                                                )}
                                            </>
                                        )}
                                        <div className={`${(message.senderId._id !== loggedInUser._id) || (message.status === 'sending')  ? 'w-full' : null} flex justify-end font-semibold text-[9px] xs:text-[10px]`}>
                                            {formatMessageDate(message.createdAt)}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                    <div ref={messageEndRef}></div>
                    </div>
                )}
            </>
            
            {imageMessage && (
                <div className='px-1 sm:px-0 flex items-center absolute left-0 top-0 h-full w-full bg-transparent backdrop-filter backdrop-blur-lg shadow-lg'>
                    <div className='relative bg-transparent border w-full h-52 xs:h-44 sm:h-64 md:h-64 lg:h-64 rounded-xl'>
                        <img 
                        src={imageMessagePreview || `https://via.placeholder.com/150`} 
                        className='object-cover xs:object-contain lg:object-cover w-full h-full rounded-xl' alt="Cannot display image" />
                        <div onClick={removeImage} className='flex items-center justify-center absolute top-2 right-2 bg-neutral-800 transition-all duration-300 ease-in-out hover:bg-neutral-900 hover:scale-105 cursor-pointer h-8 w-8 rounded-full'>
                            <IoCloseSharp />
                        </div>
                    </div>
                </div>
            )}
            <form onSubmit={handleSubmit} onKeyDown={handleKeyDown} className='px-1 border-t-1 border-black h-12 bg-black sm:rounded-b-xl sm:py-5 sm:px-3 sm:h-24 sm:border-neutral-900 sm:bg-neutral-900 flex items-center absolute left-0 bottom-0 w-full'>
                <div className='relative cursor-pointer w-16 h-full flex items-center justify-center border-r border-neutral-900 rounded-l-lg bg-neutral-950 sm:p-3 sm:h-full sm:w-16 hover:bg-neutral-800 transition-colors ease-in-out duration-300'>
                    <IoMdAttach />
                    <input ref={fileInputRef} onChange={handleImageMessageChange} type='file' accept='image/*' className='absolute top-0 left-0 cursor-pointer opacity-0 border h-full w-full border-red-600' />
                </div>
                <textarea 
                    value={imageMessage ? imageCaption : textMessage}
                    onChange={(ev) => imageMessage ? setImageCaption(ev.target.value) : setTextMessage(ev.target.value)}
                    placeholder={imageMessage ? `Image caption 📷. . .` : `Send a text 👋`}
                    className='pt-[16px] pb-[10px] sm:pt-[18px] sm:pb-3 px-3 w-full text-xs h-12 sm:h-full sm:text-xs flex items-center justify-center border border-neutral-950 bg-neutral-950 focus:outline-none placeholder-neutral-200 placeholder:text-xs resize-none overflow-y-scroll'
                    rows={1}
                />
                <button type='submit' className='w-16 h-full flex items-center justify-center border-l border-neutral-900 rounded-r-lg bg-neutral-950 sm:p-3 sm:h-full sm:w-16 hover:bg-neutral-800 transition-colors ease-in-out duration-300'>
                    <IoMdSend />
                </button>
                <div onClick={scrollToTop} className='hidden lg:hidden w-16 h-full sm:flex items-center justify-center border-l border-neutral-900 rounded-lg bg-neutral-950 sm:p-3 sm:h-full sm:w-16 hover:bg-neutral-800 transition-colors ease-in-out duration-300'>
                    <IoMdArrowUp />
                </div>
            </form>
        </div>
    )
}

export default ChatBox
