import React, { useEffect } from 'react'
import UserHead from './UserHead'
import UserTorso from './UserTorso'
import UserLegs from './UserLegs'
import UserBar from './UserBar'

const UserStyle = ({ myCoords, setMyCoords, usersInView, userRef, timeFilter, closest="false", setSelectedEntity=null, actionsMap=null, 
zIndex=null, left=null, top=null, isHoldingItem=false, myId=null, iAmBeingHeld=false, groupEntityMap }) => {    
    const userActions = { alone: ["chat", "profile", "hit", "pick"], held: ["drop"]}
    const userHeld = myCoords.held
    const heldItem = myCoords.holding
    const isHoldingUser = heldItem?.userStyleId
    const ref = heldItem ? groupEntityMap[heldItem.grp]?.[heldItem.t] : null
    const height = myCoords.userStyleId.height
    const width = myCoords.userStyleId.width
    const actualY = myCoords.y - height
    const actualX = myCoords.x - width
    const isFullySubmerged = myCoords.on === "water"  && (myCoords.x >= 40 &&  myCoords.x <= 1780) && (myCoords.y >= 40 &&  myCoords.y <= 1580)
    const barX = actualX+(actualY-(actualY-75))*(-0.577)
    const gender = myCoords.userStyleId.gender 
    

    useEffect(() => {
        if (closest && !userRef?.current) {
            const entity = [ myCoords ]
            setSelectedEntity(entity)
        }
    }, [closest])

    useEffect(() => {
        if (!myCoords.animation) return
        setTimeout(() => {
            if (userRef?.current) {
                setMyCoords(prev => {
                    const { animation, ...realPrev } = prev
                    return realPrev
                })
            } else {
                const { animation, ...realCoords } = myCoords
                usersInView.current.set(myCoords._id, { ...realCoords })
            }
        }, 200)
    }, [myCoords.animation])

    return (
        <>
        {((userRef?.current || iAmBeingHeld) && actionsMap && (heldItem || myCoords?.held)) && (() => {
            const heldActions = userHeld ? ["escape"] : (heldItem && isHoldingUser) ? userActions.held : (heldItem && !isHoldingUser) ? ref?.actions.held : []
            return (
                <div onMouseDown={(e) => e.preventDefault()} className='absolute h-[25px] w-[300px] z-[9999999] flex items-center justify-center gap-4' 
                style={{ top: `${actualY-75}px`, left: `${barX + (width/2 -150 +2)}px`,
                transition: 'top 0.5s ease, left 0.5s ease',
                transformOrigin: userHeld ? 'center' : 'top left', pointerEvents: 'auto',
                transform: `skewX(30deg) rotateX(20deg)` }}>
                    {heldActions && heldActions.map((action, aidx) => (
                        <div key={aidx} 
                        onClick={() => userHeld ? actionsMap[action]?.(action, userHeld) : actionsMap[action]?.(action, { ...heldItem, ...((heldItem && isHoldingUser)? {} : { t: ref }) })}
                        className='h-full w-auto cursor-pointer p-2 text-xs flex items-center justify-center bg-neutral-900 rounded-sm font-semibold'>
                        {action}</div>
                    ))}
                </div>
            )
        })()}
        {(heldItem && isHoldingUser) && (
            <UserStyle timeFilter={timeFilter} userRef={null} zIndex={actualY + height + 1} left={actualX+15} top={actualY} actionsMap={actionsMap}
            closest={false} setSelectedEntity={setSelectedEntity} usersInView={usersInView} isHoldingItem={true} iAmBeingHeld={isHoldingUser && heldItem?._id === myId }
            myCoords={{ ...myCoords, _id: heldItem._id, userStyleId: heldItem.userStyleId, held: myCoords._id, holding: null }}  />    
        )}
        <div ref={userRef}
        className="overflow-visible flex flex-col items-center"
        style={{
            position: 'absolute',
            transform: `skewX(30deg) rotateX(20deg) ${isHoldingItem ? 'rotateZ(-60deg)' : ''}`,
            transformOrigin: isHoldingItem ? 'center' : 'top left',
            zIndex: isHoldingItem ? zIndex : actualY + height,
            left: isHoldingItem ? left : `${actualX}px`,
            top: isHoldingItem? top : `${actualY}px`,
            transition: 'top 0.5s ease, left 0.5s ease',
            height: `${height}px`,
            width: `${width}px`,
        }}
        >
            <UserBar myCoords={myCoords} userRef={userRef} width={width} setMyCoords={setMyCoords} usersInView={usersInView} 
            iAmBeingHeld={iAmBeingHeld}/>

            <div style={{ animation: "breathe 2s ease-in-out infinite" }} className='w-full h-full overflow-visible flex flex-col items-center'>
                {/* HEAD CONTAINER */}
                <UserHead timeFilter={timeFilter} myCoords={myCoords} gender={gender} />
                
                {/* TORSO CONTAINER */}
                <UserTorso action={myCoords.animation} heldItem={heldItem} isFullySubmerged={isFullySubmerged}
                heldItemRef={ref} myCoords={myCoords} timeFilter={timeFilter} gender={gender} />

                {/* LEGS */}
                <UserLegs myCoords={myCoords} timeFilter={timeFilter} gender={gender} />
            </div>
        </div>
        </>
    )
}

export default UserStyle
