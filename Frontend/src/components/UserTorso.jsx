import React from 'react'
import ClothPart from './ClothPart'
const getActionStyle = {
    "hitLeft": 'rotateZ(150deg)',
    "hitRight": 'rotateZ(-150deg)'
}

const UserTorso = ({ myCoords, isFullySubmerged, timeFilter, action, heldItem, heldItemRef, show="both", gender }) => {
    const bothLeft = ["both", "left"].includes(show)
    const bothRight = ["both", "right"].includes(show)

    return (
        <div className='overflow-visible relative'
        style={{
            height: gender === "male" ? "38.5%" : "30%",
            opacity: (myCoords.on !== "water" || !isFullySubmerged) ? 100 :  0.05,
            width: "100%",
            filter: `brightness(${1 - timeFilter})`,
            zIndex: 20,
        }}>
            {/* TORSO */}
            <div className='absolute overflow-hidden'
            style={{
                height: "100%",
                width: "100%",
                top: 0,
                left: 0,
                zIndex: action ? 3 : 20,
                background: myCoords.userStyleId.skin,
                ...(gender === "male" ? { 
                    clipPath: `polygon(0% 0%, 100% 0%, ${100 - myCoords.userStyleId.musc}% 100%, ${0 + myCoords.userStyleId.musc}% 100%)`,
                    WebkitClipPath: `polygon(0% 0%, 100% 0%, ${100 - myCoords.userStyleId.musc}% 100%, ${0 + myCoords.userStyleId.musc}% 100%)`,
                } : {
                    clipPath: `
                        polygon(
                            20% 0%,
                            80% 0%,
                            ${100 - (myCoords.userStyleId.curve)}% 50%,
                            ${100 - myCoords.userStyleId.musc}% 100%,
                            ${0 + myCoords.userStyleId.musc}% 100%,
                            ${0 + (myCoords.userStyleId.curve)}% 50%
                        )
                    `,
                    WebkitClipPath: `
                        polygon(
                            20% 0%,
                            80% 0%,
                            ${100 - (myCoords.userStyleId.curve)}% 50%,
                            ${100 - myCoords.userStyleId.musc}% 100%,
                            ${0 + myCoords.userStyleId.musc}% 100%,
                            ${0 + (myCoords.userStyleId.curve)}% 50%
                        )
                    `,
                }),
                // clipPath: `polygon(0% 0%, 100% 0%, ${100 - 30}% 100%, ${0 + 30}% 100%)`,
                // WebkitClipPath: `polygon(0% 0%, 100% 0%, ${100 - 30}% 100%, ${0 + 30}% 100%)`,
                borderTopLeftRadius: "0.5rem",
                borderTopRightRadius: "0.5rem",
            }}>
                {/* SHIRT BODY */}
                {myCoords.userStyleId.clothes.top?.torso && (
                    <ClothPart s={myCoords.userStyleId.clothes.top.torso.s} p={myCoords.userStyleId.clothes.top.torso.p} />
                )}
            </div>

            {/* LEFT HAND */}
            <div className='rounded-t-lg'
            style={{
                height: "100%",
                position: "absolute",
                backgroundColor: bothLeft ? myCoords.userStyleId.skin : '',
                zIndex: 5,
                ...(gender ==="male" ? {
                        width: "20%",
                        top: "15%",
                        left: "4%",
                        transform: 'rotateZ(15deg)',
                    } : {
                        width: "13%",
                        top: "10%",
                        left: "20%",
                        transform: 'rotateZ(35deg)',
                    }),
                transformOrigin: "top center"
            }}>
                {bothLeft && (
                    <>
                    {/* SLEEVE */}
                    {myCoords.userStyleId.clothes.top?.lh && (
                        <ClothPart s={myCoords.userStyleId.clothes.top.lh.s} p={myCoords.userStyleId.clothes.top.lh.p} />
                    )}
                    </>
                )}
            </div>

            {/* RIGHT HAND */}
            <div className='rounded-t-lg transition-transform duration-200'
            style={{
                height: "100%",
                position: "absolute",
                backgroundColor: bothRight ?  myCoords.userStyleId.skin : '',
                zIndex: 5,
                ...(gender === "male" ? {
                        width: "20%",
                        top: "15%",
                        right: "4%",
                    } : {
                        width: "13%",
                        top: "10%",
                        right: "20%",
                }),
                transform: `${action ? getActionStyle[action] : gender === "male" ? 'rotateZ(-15deg)' : 'rotateZ(-35deg)'} 
                ${(myCoords.facing !== "r" && heldItem?.grp !== "animal") ? 'rotateY(180deg)' : ''}`,
                transformOrigin: "top center"
            }}>
                {bothRight && (
                    <>
                    {/* SLEEVE */}
                    {myCoords.userStyleId.clothes.top?.rh && (
                        <ClothPart s={myCoords.userStyleId.clothes.top.rh.s} p={myCoords.userStyleId.clothes.top.rh.p} />
                    )}
                    {(heldItem && !heldItem?.userStyleId && heldItemRef) && (
                        <img src={heldItemRef.states[heldItem.s].purl} className="max-w-none object-contain" style={{
                            height: `${heldItemRef.states[heldItem.s].size[0]}px`,
                            width: `${heldItemRef.states[heldItem.s].size[1]}px`,
                            position: 'absolute',
                            top: `${heldItemRef.heldPos.t}px`,
                            left: `${heldItemRef.heldPos.l}px`,
                            right: `${heldItemRef.heldPos.r}px`,
                            bottom: `${heldItemRef.heldPos.b}px`,
                            transform: `${heldItemRef.heldPos.transform ?? ''} ${(myCoords.facing === "r" && heldItem.grp === "animal") ? 'rotateY(180deg)' : ''}`,
                            transformOrigin: "bottom center"
                        }} />
                    )}
                    </>
                )}
            </div>
        </div>
    )
}

export default UserTorso
