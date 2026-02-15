import React from 'react'

const UserHead = ({ timeFilter, myCoords, gender }) => {
    return (
        <div className='relative overflow-visible'
        style={{
            ...(gender === "male" ? {
                height: "23%",
                width: "12px"
            } : {
                height: "20%",
                width: "10px",
            }),
            zIndex: 100,
            // filter: `brightness(${1 - timeFilter})`,
        }}>
            {/* HEAD */}
            <div className='rounded-full'
            style={{
                height: "100%",
                width: "100%",
                background: myCoords.userStyleId.skin,
            }} />

            {/* HAIR */}
            {myCoords.userStyleId.hair && (
                <img src={myCoords.userStyleId.hair.pUrl} className="max-w-none" loading="eager"
                style={{
                    height: myCoords.userStyleId.hair[myCoords.userStyleId.gender].h,
                    width: myCoords.userStyleId.hair[myCoords.userStyleId.gender].w,
                    position: "absolute",
                    top: myCoords.userStyleId.hair[myCoords.userStyleId.gender].t,
                    left: myCoords.userStyleId.hair[myCoords.userStyleId.gender].l,
                    zIndex: 10
                }}/>
            )}
        </div>
    )
}

export default UserHead
