import { shallowObjectEqual } from '../lib/cityUtils'
import React, { useEffect, useRef, useState } from 'react'
import EnergyBar from './EnergyBar'
import UserHead from './UserHead'
import UserTorso from './UserTorso'
import UserLegs from './UserLegs'
import UserBar from './UserBar'
import UserWrapper from './UserWrapper'

const innerTopRef = { 
    male: [0, 0.23, 0.385],
    female: [0, 0.2, 0.3]
}

const AnimalEntity = React.memo(({ entity, animalTypes, timeFilter, closest=false, setSelectedEntity,
    setMyCoords, usersInView, riderIsMe, groupEntityMap }) => {
    // console.log("Animal </> ...")
    const facing = entity.f
    const delay = `${entity.dl}s`
    const mainRider = entity.mainRider
    const mainRiderGender = mainRider?.userStyleId.gender ?? null
    const animal = animalTypes[entity.t]
    const animalStateObj = animal?.states[entity.s]
    const ridingPos = mainRider ? animalStateObj.riding[facing] : null
    const animalFacingObj = animalStateObj.purl[["l", "r"].includes(facing) ? "x" : facing]
    const width = animalFacingObj?.s[1] ?? animalStateObj.size[1]
    const height = animalFacingObj?.s[0] ?? animalStateObj.size[0]
    const left = entity.p[0] - width
    const top = entity.p[1] - height
    // const newCount = updateCount(100, entity.energy, 30000, entity.lastHitAt)

    useEffect(() => {
        if (closest) {
            const entire = [{...entity, t: animal}]
            setSelectedEntity(entire)
            console.log({ closest: entire })
        }
    }, [entity.p[0], entity.p[1], closest, entity.ins])

    return (
        <div className=''
        key={entity._id || entity.id}
        style={{
            position: 'absolute',
            top,
            left,
            zIndex: entity.p[1] - height + height,
            transformOrigin: '50% 100%',
            transition: "left 1.01s linear, top 1.01s linear",
        }}
        >
            {(closest && !riderIsMe) && (
                <EnergyBar max={100} quantity={entity.energy} hideNumbers={true}
                className={'absolute text-[7px] z-[999] rounded-sm'} 
                style={{ left: `${0}px`, top: `${-10}px`, zIndex: 1,
                transform: 'skewX(30deg)', height:'4.5px', width: '40px' }} />
            )}
            {mainRider && (
                <>
                <UserWrapper riderHeight={mainRider.userStyleId.height} riderWidth={mainRider.userStyleId.width}
                top={facing === "a" ? -27: ridingPos.top} left={facing === "a" ? 3 : ridingPos.left} 
                zIndex={["l", "r"].includes(facing) ? 10 : facing === "b" ? 10 : 10}
                innerTop={innerTopRef[mainRiderGender][0]}>
                    <>
                        <UserBar myCoords={mainRider} userRef={riderIsMe ? {current: true} : null} riding={true}
                        width={mainRider.userStyleId.width} setMyCoords={setMyCoords} usersInView={usersInView} />
                        <UserHead myCoords={mainRider} timeFilter={timeFilter} gender={mainRiderGender}/>
                    </>
                </UserWrapper>
                
                <UserWrapper riderHeight={mainRider.userStyleId.height} riderWidth={mainRider.userStyleId.width}
                top={facing === "a" ? -27: ridingPos.top} left={facing === "a" ? 3 : ridingPos.left} 
                zIndex={["l", "r"].includes(facing) ? 10 : facing === "b" ? 0 : 10}
                innerTop={Math.round(innerTopRef[mainRiderGender][1] * mainRider.userStyleId.height)}>
                    <UserTorso action={mainRider.animation} heldItem={mainRider.holding ?? null} isFullySubmerged={false} gender={mainRiderGender}
                    heldItemRef={mainRider.holding?.t ? groupEntityMap[mainRider.holding?.grp]?.[mainRider.holding?.t] : null} myCoords={mainRider} timeFilter={timeFilter} show={facing === "l" ? "right" : facing === "r" ? "left" : "both"} />
                </UserWrapper>
                
                <UserWrapper riderHeight={mainRider.userStyleId.height} riderWidth={mainRider.userStyleId.width}
                top={facing === "a" ? -27: ridingPos.top} left={facing === "a" ? 3 : ridingPos.left} 
                zIndex={["l", "r"].includes(facing) ? 10 : facing === "b" ? 10 : 10}
                innerTop={Math.round(innerTopRef[mainRiderGender][1] * mainRider.userStyleId.height) + Math.round(innerTopRef[mainRiderGender][2] * mainRider.userStyleId.height)}>
                    <UserLegs myCoords={mainRider} timeFilter={timeFilter} show={["l", "b", "t"].includes(facing) ? "right" : "left"}
                    gender={mainRiderGender} />
                </UserWrapper>
                </>
            )}
            <div 
                data-land-animal-name={animal?.name}
                onClick={() => console.log("quack")}
                className="relative"
                style={{
                zIndex: 1,
                width: `${width}px`,
                height: `${height}px`,
                animation: `${animal?.animation} ${delay}` || 'none',
                // filter: `brightness(${1 - timeFilter})` 
                }}
            >
                <img loading="eager"
                src={animalFacingObj?.p ?? animal?.states[entity.s].purl}
                alt={animal?.name}
                className="w-full h-full object-contain"
                style={{ transform: `${facing === "r" ? 'skewX(30deg) rotateY(180deg)' : 'skewX(30deg)'}`, 
                filter: (closest && !riderIsMe) ? 'hue-rotate(-15deg)' : '',  }}
                
                />
            </div>
        </div>
    )
})

export default React.memo(
    AnimalEntity,
    (prev, next) => {
        return (
            prev.animalTypes === next.animalTypes &&
            prev.timeFilter === next.timeFilter &&
            prev.closest === next.closest &&
            prev.setSelectedEntity === next.setSelectedEntity  &&
            prev.setMyCoords === next.setMyCoords  &&
            prev.usersInView === next.usersInView  &&
            prev.riderIsMe === next.riderIsMe  &&
            prev.entity.base[0] === next.entity.base[0]  &&
            prev.entity.base[1] === next.entity.base[1]  &&
            prev.entity.createdAt === next.entity.createdAt  &&
            prev.entity.deadAt === next.entity.deadAt  &&
            prev.entity.dl === next.entity.dl  &&
            prev.entity.dna === next.entity.dna  &&
            prev.entity.energy === next.entity.energy  &&
            prev.entity.f === next.entity.f  &&
            prev.entity.grp === next.entity.grp  &&
            prev.entity.ins === next.entity.ins  &&
            prev.entity.insTime === next.entity.insTime  &&
            prev.entity.lastHitAt === next.entity.lastHitAt  &&
            prev.entity.p[0] === next.entity.p[0]  &&
            prev.entity.p[1] === next.entity.p[1]  &&
            shallowObjectEqual(prev.entity.primary, next.entity.primary)  &&
            shallowObjectEqual(prev.entity.secondary, next.entity.secondary)  &&
            prev.entity.s === next.entity.s  &&
            prev.entity.stride === next.entity.stride  &&
            prev.entity.t.name === next.entity.t.name  &&
            prev.entity._id === next.entity._id  &&
            prev.entity.mainRider?._id === next.entity.mainRider?._id
        )
    }
)
