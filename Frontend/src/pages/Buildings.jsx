import { useAuth } from '../contexts/AuthContext'
import React, { useEffect, useState } from 'react'
import { useApproveBuildingDesign, useCreateMyBuildingDesign, useDenyBuildingDesign, useGetMyBuildingRequests } from '../api/MyBuildingApi'
import { FaGear } from 'react-icons/fa6'
import CreateBuildingRequest from '../components/CreateBuildingRequest'
import RoomSettingsPanel from '../components/RoomSettingsPanel'
import LoadingTab from '../components/LoadingTab'

const Buildings = () => {
    // 
    const { buildingRequestsData, didBuildingRequestsFail, isBuildingRequestsLoading, isBuildingRequestsFetching } = useGetMyBuildingRequests()
    // For Create Request
    const { loggedInUser } = useAuth()
    const currentCityRoles = null 
    const { createBuildingDesign, isBuildingDesignCreating } = useCreateMyBuildingDesign()
    const { approveBuildingDesign, isApproveBuildingDesignLoading } = useApproveBuildingDesign()
    const { denyBuildingDesign, isDenyBuildingDesignLoading} = useDenyBuildingDesign()

    // For Navigation
    const [openRoomSettingsBar, setOpenRoomSettingsBar] = useState(false)
    const toggleRoomSettingsBar = () => {
        setOpenRoomSettingsBar(!openRoomSettingsBar)
    }

    const [page, setPage] = useState(0)
    const [requiredRequest, setRequiredRequest] = useState(null)
    const [neededTab, setNeededTab] = useState(null)

    const [isASupervisor, setIsASuperVisor] = useState(new Set(currentCityRoles?.buildingSupervisors || []).has(loggedInUser._id || ''))

    useEffect(() => {
        if (buildingRequestsData && !isBuildingRequestsFetching && !isBuildingRequestsLoading) {
            setPage(0)
            setOpenRoomSettingsBar(true)
        }
    }, [buildingRequestsData])

    useEffect(() => {
        if (isBuildingRequestsFetching && !isBuildingRequestsLoading) {
            setPage(0)
            setOpenRoomSettingsBar(true)
            setNeededTab("requests")
        }
    }, [isBuildingRequestsFetching, isBuildingRequestsLoading])

    useEffect(() => {
        console.log("CURRENT CITY ROLES: ", currentCityRoles)
        setIsASuperVisor((new Set(currentCityRoles?.buildingSupervisors || []).has(loggedInUser._id || '')))
    }, [currentCityRoles])

    if (isBuildingRequestsLoading) {
        return (
            <LoadingTab />
        )
    }
   
    return (
        <>
        <RoomSettingsPanel mode={"building"} setPage={setPage} page={page} neededTab={neededTab} setNeededTab={setNeededTab}
        buildingRequestsData={buildingRequestsData} setRequiredRequest={setRequiredRequest}
        toggleRoomSettingsBar={toggleRoomSettingsBar} openRoomSettingsBar={openRoomSettingsBar} loggedInUser={loggedInUser} />
         <div onClick={toggleRoomSettingsBar} className='h-12 w-12 left-1 top-1/2 sm:left-0 sm:h-16 sm:w-16 animate-spin cursor-pointer flex items-center justify-center rounded-full  absolute z-10 transition-transform duration-300 ease-in-out hover:scale-105 bg-transparent backdrop-filter backdrop-blur-lg shadow-lg'>
            <FaGear
                className='h-[16px] w-[16px] sm:h-[20px] sm:w-[20px]'
            />
        </div>
        {loggedInUser && (
            <>
            {page === 1 && (
                <CreateBuildingRequest loggedInUser={loggedInUser} createBuildingDesign={createBuildingDesign}
                isBuildingDesignCreating={isBuildingDesignCreating} setPage={setPage} />
            )}
            {(page === 2 && requiredRequest) && (
                <CreateBuildingRequest loggedInUser={loggedInUser} requiredRequest={requiredRequest} isASupervisor={isASupervisor}
                denyDesign={denyBuildingDesign} isDenying={isDenyBuildingDesignLoading}
                approveDesign={approveBuildingDesign} isApproving={isApproveBuildingDesignLoading} />
            )}
            </>
        )}
        </>
    )
}

export default Buildings
