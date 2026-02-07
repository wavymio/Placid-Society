import React from 'react'
import ClothPart from './ClothPart'

const UserLegs = ({ myCoords, timeFilter, show="both", gender }) => {
    const bothLeft = ["both", "left"].includes(show)
    const bothRight = ["both", "right"].includes(show)
    return (
        <div className='flex items-end relative'
        style={{
            height: gender ==="male" ? "38.5%" : "50%",
            width: "100%",
            opacity: myCoords.on === "water" ? 0.05 : 100,
            filter: `brightness(${1 - timeFilter})`,
            zIndex: 10
        }}>
            
                <div className={`flex-1 ${bothLeft ? 'border-r border-black' : ''} h-full`} style={{
                    background: bothLeft ? myCoords.userStyleId.skin : '',
                    ...(gender === "male" ? {
                        clipPath: `polygon(${0 + myCoords.userStyleId.musc * 2}% 0%, 100% 0%, 75% 100%, 40% 100%)`,
                        WebkitClipPath: `polygon(${0 + myCoords.userStyleId.musc * 2}% 0%, 100% 0%, 75% 100%, 40% 100%)`,
                    } : {
                        clipPath: `polygon(${0 + (myCoords.userStyleId.musc * 2)}% 0%, 100% 0%, 80% 100%, 50% 100%)`,
                        WebkitClipPath: `polygon(${0 + (myCoords.userStyleId.musc * 2)}% 0%, 100% 0%, 80% 100%, 50% 100%)`,  
                    })
                    // clipPath: `polygon(${0 + 30 * 2}% 0%, 100% 0%, 75% 100%, 40% 100%)`,
                    // WebkitClipPath: `polygon(${0 + 30 * 2}% 0%, 100% 0%, 75% 100%, 40% 100%)`,
                }}>
                    {bothLeft && (
                    <>
                        {/* TROUSERS/SHORTS */}
                        {myCoords.userStyleId.clothes.bottom?.ll && (
                            <ClothPart s={myCoords.userStyleId.clothes.bottom.ll.s} p={myCoords.userStyleId.clothes.bottom.ll.p} />
                        )}
                    </>
                    )}
                </div>
            
            
                <div className={`flex-1 ${bothRight ? 'border-r border-black' : ''} h-full `} style={{
                    background: bothRight ? myCoords.userStyleId.skin : '',
                    ...(gender === "male" ? {
                        clipPath: `polygon(0% 0%, ${100 - myCoords.userStyleId.musc * 2}% 0%, 60% 100%, 25% 100%)`,
                        WebkitClipPath: `polygon(0% 0%, ${100 - myCoords.userStyleId.musc * 2}% 0%, 60% 100%, 25% 100%)`,
                    } : {
                        clipPath: `polygon(0% 0%, ${100 - (myCoords.userStyleId.musc * 2)}% 0%, 50% 100%, 20% 100%)`,
                        WebkitClipPath: `polygon(0% 0%, ${100 - (myCoords.userStyleId.musc * 2)}% 0%, 65% 100%, 35% 100%)`,  
                    })
                    // clipPath: `polygon(0% 0%, ${100 - 30 * 2}% 0%, 60% 100%, 25% 100%)`,
                    // WebkitClipPath: `polygon(0% 0%, ${100 - 30 * 2}% 0%, 60% 100%, 25% 100%)`,
                }}>
                    {bothRight && (
                    <>
                        {/* TROUSERS/SHORTS */}
                        {myCoords.userStyleId.clothes.bottom?.rl && (
                            <ClothPart s={myCoords.userStyleId.clothes.bottom.rl.s} p={myCoords.userStyleId.clothes.bottom.rl.p} />
                        )}
                    </>
                    )}
                </div>
            
        </div>
    )
}

export default UserLegs
