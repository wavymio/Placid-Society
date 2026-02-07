import React, { useEffect, useState } from 'react'
import { IoMdArrowDropdown } from 'react-icons/io'
import EnergyBar from './EnergyBar'
import { reEvaluateEnergy } from '../lib/actionUtils'
import { updateCount } from '../lib/cityUtils'

const UserBar = ({ width, userRef, myCoords, setMyCoords, usersInView, iAmBeingHeld, riding }) => {
    // const newCount = updateCount(100, myCoords.userStyleId.stats.energy, 30000, myCoords.userStyleId.stats.lgn)
    // const [energy, setEnergy] = useState(updateCount(100, myCoords.userStyleId.stats.energy, 30000, myCoords.userStyleId.stats.lgn))
    // if (myCoords._id === "69303bdb4a8a636e0437aea2") console.log(myCoords, riding)
    useEffect(() => {
        if (myCoords.userStyleId.stats.energy >= 100) return 
        const interval = setInterval(() => {
            let myStats = myCoords.userStyleId.stats
            const {energy, lgn} = reEvaluateEnergy(myStats.lgn, myStats.energy, 100, 30000)
            if (energy === 100) {
                clearInterval(interval)
                return
            }
            if (energy === myStats.energy) return
            myStats = { ...myStats, energy, lgn }
            
            if (userRef?.current) {
                // console.log("my energy is regenerating...")
                setMyCoords(prev => ({ ...prev, userStyleId: { ...prev.userStyleId, stats: myStats } }))
            } else {
                // console.log("another user's energy is regenerating...")
                usersInView.current.set(myCoords._id, { ...myCoords, userStyleId: { ...myCoords.userStyleId, stats: myStats } })
            }
        }, 10000)

        return () => clearInterval(interval)
    }, [myCoords?.userStyleId.stats.energy])

    return (
        <div className='flex flex-col items-center w-20 overflow-visible' 
        style={{ position: 'absolute', top: `${-58}px`, left: `${width/2 - 40}px`,
        zIndex: 300000, transition: 'top 0.19s ease, left 0.19s ease'}} >
            <IoMdArrowDropdown className={(userRef?.current || iAmBeingHeld) ? `text-orange-500` : `text-yellow-300`} style={{ height: '20px', width: '20px',  }} />
            <div className='w-20 mb-1 text-xs flex justify-center capitalize font-semibold overflow-visible'>{myCoords.userStyleId.userId.username}</div>
            {/* <EnergyBar max={100} quantity={newCount} hideNumbers={true}  */}
            <EnergyBar max={100} quantity={myCoords?.userStyleId.stats.energy} hideNumbers={true} 
            className={'relative rounded-none'} style={{ height:'5px', width: '50px' }} />
            <EnergyBar max={100} quantity={myCoords.userStyleId.stats.health} hideNumbers={true} 
            className={'relative rounded-none'} style={{ height:'5px', width: '50px' }} />
        </div>
    )
}

export default UserBar
