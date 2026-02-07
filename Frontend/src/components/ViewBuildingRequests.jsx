import React, { useState } from 'react'
import TabChanger from './TabChanger'
import { Badge } from './ui/badge'

const ViewBuildingRequests = ({ buildingRequestsData, setRequiredRequest, closeComponent, setPage }) => {
    const [tab, setTab] = useState("pending")
    
    const changeTabs = (tabName) => {
        setTab(tabName)
    }

    const filteredRequests = tab === "pending" ? buildingRequestsData.filter(request => request.status === "pending") : buildingRequestsData.filter(request => request.status !== "pending").sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
    
    return (
        <div className='px-2 xs:px-8 py-8 w-[260px] xs:w-[350px] sm:w-[470px] md:w-[550px] lg:w-[600px] min-h-[250px] max-h-[300px] sm:min-h-[310px] sm:max-h-[400px] relative bg-black border border-neutral-900 rounded-2xl flex flex-col gap-5 items-center'>
            <TabChanger changeTabs={changeTabs} source={"building-requests"} tab={tab} />
            <div className='w-full flex flex-col overflow-y-scroll gap-4 h-[200px]'>
            {filteredRequests.map((request, index) => (
                <div key={request._id} onClick={() => {
                    setRequiredRequest(request)
                    setPage(2)
                    closeComponent()
                }}
                className='w-full h-14 bg-neutral-950 hover:bg-neutral-900 transition-all ease-in-out duration-300 
                cursor-pointer flex-shrink-0 text-white flex items-center gap-3 rounded-l-full'>
                    <div className='h-full w-16 rounded-full bg-neutral-950 flex items-center justify-center'>
                        <img src={request.pictureUrl} alt="" className='h-8 w-8' />
                    </div>
                    <div className='text-xs font-semibold'>{request.name || "No Name Attached"}</div>
                    <Badge className={`p-[10px] ${request.status === "denied" ? "bg-red-950 hover:bg-red-950" : request.status === "approved" ? "bg-green-950 hover:bg-green-950" : null}`}>
                        {request.status === "denied" ? "Denied" : request.status === "approved" ? "Approved" : "Pending"}
                    </Badge>
                </div>
            ))}
            </div>
        </div>
    )
}

export default ViewBuildingRequests
