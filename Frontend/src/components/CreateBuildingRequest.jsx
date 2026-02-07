import { buildingTypes, convertToNumber, imageRequirements } from '../lib/buildingUtils'
import React, { useEffect, useState } from 'react'
import DropdownSelector from './DropdownSelector'
import MaxSetter from './MaxSetter'
import { useQueryClient } from 'react-query'
import { FaLocationDot } from 'react-icons/fa6'
import ApproveDenyBuildingTab from './ApproveDenyBuildingTab'

const CreateBuildingRequest = ({ loggedInUser, createBuildingDesign, isBuildingDesignCreating, requiredRequest, isASupervisor,
    denyDesign, approveDesign, isDenying, isApproving
}) => {
    const queryClient = useQueryClient()
     // Image Preview
    const [buildingImage, setBuildingImage] = useState(null)
    const [previewUrl, setPreviewUrl] = useState(requiredRequest?.pictureUrl || null)
    const [error, setError] = useState('')
    const handleImageChange = (e) => {
        const file = e.target.files?.[0]
        console.log(file)
        const fileExtension = file.name.split('.').pop()
        if (file) {
            const url = URL.createObjectURL(file)
            setPreviewUrl(url)
            
            if (file.size > (300 * 1024)) {
                setError('size')
            } else if (!(["avif", "webp"].includes(fileExtension))) {
                setError('format')
            } else {
                setError('')
                setBuildingImage(file)
            }
        }
    }

    // Building Type Selection
    const [openDropdown, setOpenDropDown] = useState(false)
    const [selectedValue, setSelectedValue] = useState(buildingTypes.find(type => type.name === requiredRequest?.buildingType) || null)
    const allBuildingTypes = buildingTypes
    const [searchInput, setSearchInput] = useState('')

    // Max Participants
    const [maxParticipants, setMaxParticipants] = useState(requiredRequest?.maxOccupants || 1)
    const handleMaxParticipantChange = (e) => {
        const value = e.target.value
        convertToNumber(value, setMaxParticipants, 1)
    }
    const [maxRooms, setMaxRooms] = useState(requiredRequest?.maxRooms || 2)
    const handleMaxRoomChange = (e) => {
        const value = e.target.value
        convertToNumber(value, setMaxRooms, 2)
    }

    const [price, setPrice] = useState(parseFloat(requiredRequest?.price) || 0)
    const handlePriceChange = (e) => {
        const value = e.target.value
        convertToNumber(value, setPrice, 0, true)
    }

    // Building Name
    const [name, setName] = useState(requiredRequest?.name || '')

    // Status
    const [status, setStatus] = useState(requiredRequest?.status || null)

    // Approve/Deny
    const [openApproveDeny, setOpenApproveDeny] = useState(null)
    const [comments, setComments] = useState('')
    const [tags, setTags] = useState([])

    // Payload
    const createPayload = () => {
        if (openApproveDeny === "approve") {
            if (!isASupervisor) return
            if (!requiredRequest._id) return
            if (!tags || tags.length === 0 || (tags && tags.length > 3) || ((tags.length === 1) && tags.some(value => value === ''))) return
            const filteredTags = tags.filter((tag) => tag !== '')
            const data = {
                requestId: requiredRequest._id,
                tags: filteredTags
            }
            return data
        } else if (openApproveDeny === "deny") {
            if (!isASupervisor) return
            if (!requiredRequest._id) return
            if (!comments) return
            return {
                requestId: requiredRequest._id,
                comments: comments
            }
        } else {
            if (error) return null
            if (!buildingImage) return setError('format')
            if (!selectedValue) return setError('buildingType')
            if (!name) return setError('name')
            if (!maxParticipants || isNaN(maxParticipants)) return null
            if (!maxRooms || isNaN(maxRooms) || maxRooms < 2) return null
            if (isNaN(parseFloat(price.toString().replace(/,/g, '')))) return null

            const formData = new FormData()
            formData.append('pictureUrl', buildingImage)
            formData.append('name', name)
            formData.append('buildingType', selectedValue.name)
            formData.append('maxRooms', maxRooms)
            formData.append('maxOccupants', maxParticipants)
            formData.append('price', price.toString().replace(/,/g, ''))
            return formData
        }
    }

    // Submit
    const handleSubmit = async (e) => {
        e.preventDefault()
        const payload = createPayload()
        if (!payload) return
        console.log(payload)

        const data = await createBuildingDesign(payload)
        if (data?.success) {
            await queryClient.invalidateQueries("getMyBuildingRequests")
            setOpenApproveDeny(null)
        }
    }

    const handleApproveDenyReuest = async (e) => {
        e.preventDefault()
        const payload = createPayload()
        if (!payload) return
        console.log(payload)

        let data
        if (openApproveDeny === "approve") {
            data = await approveDesign(payload)
        } else if (openApproveDeny === "deny") {
            data = await denyDesign(payload)
        } else {
            return null
        }

        if (data?.success) {
            await queryClient.invalidateQueries("getMyBuildingRequests")
            setOpenApproveDeny(null)
        }
    }

    const getButtonDisplay = (status) => {
        switch (status) {
            case "pending": return "PENDING"
            case "approved": return "APPROVED"
            case "denied": return "DENIED"
            default: return "Submit Request"
        }
    }
    const getButtonColour = (status) => {
        switch (status) {
            case "pending": return "border-primary bg-primary  hover:bg-primary/80"
            case "approved": return "border-green-950 bg-green-950  hover:bg-green-950"
            case "denied": return "border-red-950 bg-red-950  hover:bg-red-950"
            default: return "border-white bg-neutral-800  hover:bg-neutral-900"
        }
    }

    const handleApproveDeny = (action) => {
        setOpenApproveDeny(action)
    }

    useEffect(() => {
        if (!price) setPrice(0)
    }, [price])

    useEffect(() => {
        if (name) setError('')
    }, [name])

    useEffect(() => {
        if (requiredRequest) {
            setComments('')
            setTags([])
            setError('')
            setName(requiredRequest?.name || '')
            setPrice(parseFloat(requiredRequest?.price).toLocaleString() || 0)
            setStatus(requiredRequest?.status || null)
            setMaxRooms(requiredRequest?.maxRooms || 2)
            setMaxParticipants(requiredRequest?.maxOccupants || 1)
            setPreviewUrl(requiredRequest?.pictureUrl || null)
            setSelectedValue(buildingTypes.find(type => type.name === requiredRequest?.buildingType) || null)
        }
    }, [requiredRequest])
    
    return (
        <>
        <form onSubmit={handleSubmit} className='flex flex-col w-full pt-10 gap-5'>
            <div className='w-full flex items-center justify-center gap-10 mb-5'>
                <div className=' relative h-56 w-56 rounded-xl bg-neutral-800 flex items-center justify-center gap-2 text-sm font-bold cursor-pointer transition-all ease-in-out duration-300 hover:bg-neutral-900'>
                    {previewUrl ? (
                        <img src={previewUrl} className='h-36 w-36' />
                    ) : (
                        <span>Add Building Image </span>
                    )}
                    <input disabled={!!requiredRequest} type='file' accept='image/avif, image/webp' onChange={handleImageChange}
                    className='absolute z-10 top-0 left-0 w-full h-full opacity-0 cursor-pointer' />
                </div>
                
                <div className='relative flex flex-col gap-2 border border-neutral-800 rounded-xl w-[50%] h-56 justify-center px-10 '>
                    {requiredRequest?.comments && requiredRequest?.supervisor ? (
                        <div className='w-full h-[60%] pb-4 text-neutral-400'>
                            <div className='text-xs'>Supervisor's Comments:</div>
                            <div className='text-xs'>{'> ' + requiredRequest?.comments}</div>
                            <div className='text-xs capitalize mt-2'>Signed, <span className='text-white font-semibold'>{requiredRequest?.supervisor?.username}</span></div>
                        </div>
                    ) : (
                        <>
                        <div className='text-xs'>Hello <span className='capitalize font-bold'>{isASupervisor ? 'Supervisor' : 'Architect'} {loggedInUser.username},</span>{isASupervisor ? null : " these are your supervisors' requirements:"}</div>
                        {!isASupervisor ? (
                            <div>
                                {imageRequirements.map((requirement, index) => (
                                    <div className={`text-xs ${(error && requirement.name === error) ? 'text-red-400' : 'text-neutral-400'}`} key={index}>
                                        {'> '}{requirement.text} {requirement.maxNumber ? <span className='text-white font-medium'>{selectedValue ? selectedValue.maxRooms : requirement.maxNumber}</span> : <></>} 
                                        {requirement.maxUsers ? <span className='text-white font-medium'>{selectedValue ? selectedValue.maxRooms * 15 : requirement.maxUsers}</span> : <></>} 
                                        {requirement.link ? ( <span> Click <a className='text-white font-medium' target='_blank' href={requirement.link}>here</a> {requirement.linkAction}</span>) : null}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className='w-full h-[50%]'>
                                <div className={`text-xs text-neutral-400`}>
                                    {'> '}Please approve or deny <span className='capitalize font-bold text-white'>{requiredRequest.architect.username}'s</span> design request
                                </div>
                                <div className={`text-xs text-neutral-400`}>
                                    {'> '}The agreed fee will be paid to <span className='capitalize font-bold text-white'>{requiredRequest.architect.username}</span> from your business' account, if approved.
                                </div>
                                <div className={`text-xs text-neutral-400`}>
                                    {'> '}Judge <span className='capitalize font-bold text-white'>{requiredRequest.architect.username}'s</span> building design at your discretion.
                                </div>
                                <div className={`text-xs text-neutral-400`}>
                                    {'> '}If you feel <span className='capitalize font-bold text-white'>{requiredRequest.architect.username}</span> has a good reason for not following the set requirements, you may approve this request.
                                </div>
                                <div className={`text-xs text-neutral-400`}>
                                    {'> '}Ensure the request's location is in sync with your city's location.
                                </div>
                            </div>
                        )}
                        </>
                    )}
                    {(isASupervisor && status === "pending") ? (
                        <div className='h-12 w-full absolute bottom-0 right-0 flex items-center justify-end gap-4'>
                            <button type='button' disabled={isDenying} onClick={(e) => {
                                e.stopPropagation()
                                handleApproveDeny("deny")}} className='font-special font-semibold flex items-center justify-center
                            bg-red-950 hover:bg-red-900 h-full w-[150px] text-xs text-white rounded-lg
                            transition-all ease-in-out duration-300'>
                            {isDenying ? (
                            <span className='loader'></span>
                            ) : 'DENY'}
                            </button>
                            <button type='button' disabled={isApproving} onClick={(e) => {
                                e.stopPropagation()
                                handleApproveDeny("approve")}} className='font-special font-semibold flex items-center justify-center
                            bg-green-950 hover:bg-green-900 h-full w-[150px] text-xs text-white rounded-lg
                            transition-all ease-in-out duration-300'>
                            {isApproving ? (
                            <span className='loader'></span>
                            ) : 'APPROVE'}
                            </button>
                        </div>
                    ) : (
                    <button type='submit' disabled={isBuildingDesignCreating || status}
                    className={`absolute bottom-0 right-0 font-semibold
                    ${status ? 'font-special' : 'cursor-pointer'}
                    border flex items-center justify-center ${getButtonColour(status)}
                    transition-all ease-in-out duration-300 
                    h-12 w-[150px] text-xs text-white rounded-lg`}>
                        {isBuildingDesignCreating ? (
                            <span className='loader'></span>
                        ) : getButtonDisplay(status)}</button>
                    )}
                </div>
            </div>
            
            <div className='w-full h-20 flex items-center bg-black justify-center gap-[72px]'>
                <DropdownSelector buildingTypes={allBuildingTypes} openDropdown={openDropdown} searchInput={searchInput} selectedValue={selectedValue}
                setOpenDropDown={setOpenDropDown} setSearchInput={setSearchInput} setSelectedValue={setSelectedValue}
                error={error} setError={setError} disabled={!!requiredRequest} />

                <input disabled={!!requiredRequest} className={`rounded-lg w-[400px] border ${error === "name" ? 'border-red-400' : 'border-neutral-800'} h-14 bg-black outline-none px-4
                placeholder:text-sm placeholder:text-white placeholder:font-medium text-sm text-white font-semibold`}
                type='text' value={name} onChange={(e) => setName(e.target.value)}
                placeholder='Enter a name for this Building...' />
                
                
            </div>

            <div className='w-full h-20 flex items-center bg-black justify-between'>
                <MaxSetter disabled={!!requiredRequest} buttonText={'Max Occupants'} value={maxParticipants}  valueChanger={handleMaxParticipantChange} />

                <MaxSetter disabled={!!requiredRequest} buttonText={'Max Rooms'} value={maxRooms}  valueChanger={handleMaxRoomChange}
                color={'bg-cyan-950'} />

                <MaxSetter disabled={!!requiredRequest} buttonText={'Price {₱}'} value={price}  valueChanger={handlePriceChange}
                color={'bg-[#2B103D]'} />
            </div>

            {isASupervisor && (
                <div className='w-full h-20 flex items-center bg-black justify-center gap-2'>
                    <FaLocationDot className='text-white h-6 w-6' />
                    <div className='text-sm font-semibold'>{requiredRequest.location.name} City, {requiredRequest.location.country.name}, {requiredRequest.location.continent.name}</div>
                </div>
            )}
        </form>
        {openApproveDeny && (
            <ApproveDenyBuildingTab mode={openApproveDeny} setMode={setOpenApproveDeny} handleSubmit={handleApproveDenyReuest}
            comments={comments} setComments={setComments} tags={tags} setTags={setTags} isApproving={isApproving} isDenying={isDenying} />
        )}
        </>
    )
}

export default CreateBuildingRequest
