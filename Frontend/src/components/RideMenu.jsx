import React from 'react'
const actionsMap = {
    "rest": "ride-rest",
    "walk": "ride-walk",
    "run": "ride-run", 
    "alight": "alight"
}

const RideMenu = ({ rideAction, rideEntity, handleSelectAction }) => {
// console.log("Ride </> ...")
    return (
        <div onMouseDown={(e) => e.preventDefault()} className='absolute top-0 left-0 w-full h-[10%] z-[999] flex items-center justify-center gap-4'>
            {Object.keys(actionsMap).map((action, aidx) => {
                const actualAction = actionsMap[action]
                const isSelected = actualAction === rideAction
                return (
                    <div onClick={isSelected ? () => null : (e) => {
                        e.stopPropagation()
                        handleSelectAction({ action: actualAction, entity: rideEntity })
                    }}
                    key={aidx} className={`flex items-center justify-center w-[60px] h-[80%] text-xs text-white  
                    rounded-lg capitalize font-semibold border cursor-pointer 
                    ${isSelected ? 'bg-neutral-800 border-white' : 'bg-black border-neutral-800'} hover:bg-neutral-800 hover:border-white
                    transition-all ease-in-out duration-300`}>{action}</div>
                )
            })}
        </div>
    )
}

export default React.memo(RideMenu, (prev, next) => {
  return (
    prev.rideAction === next.rideAction &&
    prev.rideEntity?._id === next.rideEntity?._id &&
    prev.handleSelectAction === next.handleSelectAction
  )
})
