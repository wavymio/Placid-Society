import { arraysEqualUnordered, shallowObjectEqual } from '../lib/cityUtils'
import React, { useEffect } from 'react'

const birdMovements = [
    "fly-around-land",
    "perch",
    "fly-natural"
]

const hunterMovements = [
    "rectangularFlight",
    "triangularFlight",
    "snakeFlight"
]

const AirAnimalEntity = ({ isNight, entity, animalTypes, timeFilter, closest=false, setSelectedEntity }) => {
    // console.log("Air Animal </> ...")
    const airAnimal = animalTypes[entity.t]
    const height = airAnimal?.states[entity.s].size[0]
    const width = airAnimal?.states[entity.s].size[1]
    const actualY = entity.p[1] - height
    const actualX = entity.p[0] - width

    useEffect(() => {
        if (closest) {
            const entire = [{...entity, t:airAnimal}]
            setSelectedEntity(entire)
        }
    }, [closest])

    if ((!airAnimal?.night && !isNight) || (airAnimal?.night && isNight)) {
        // console.log("Re-rendering... ", `${entity.t}-${actualX}-${entity.p[1]}`)
        return (
            <div
                data-air-animal-name = {entity?.name}
                onClick={() => console.log("quack")}
                key={entity._id || entity.id}
                className={`relative`}
                style={{
                    width: `${width}px`,
                    height: `${height}px`,
                    top: actualY,
                    left: actualX,
                    filter: `brightness(${1 - timeFilter})`,
                    zIndex: ((airAnimal?.night && isNight) || (!airAnimal?.night && !isNight)) ? 30000000 : 0,
                    transform: airAnimal?.hunter ? 'skewX(30deg)' : `skewX(30deg) ${entity.fl ? '' : 'rotateY(180deg)'}`,
                    animation: // rotateX(30deg)
                    (airAnimal?.hunter && ((airAnimal?.night && isNight) || (!airAnimal?.night && !isNight))) ? 
                    `${hunterMovements[Math.floor(entity.rn)]} ${airAnimal?.speed}s linear infinite ${entity.dl}s`
                    : (!airAnimal?.hunter && ((airAnimal?.night && isNight) || (!airAnimal?.night && !isNight))) ? 
                    `${birdMovements[Math.floor(entity.rn)]} ${airAnimal?.speed}s linear infinite ${entity.dl}s`
                    : 'none',
                }}
            >
                <img loading="eager"
                    src={airAnimal?.states[entity.s].purl}
                    alt={airAnimal?.name}
                    className="w-full h-full object-contain group-hover:scale-110"
                    style={{
                        // filter: `brightness(${1})`,
                        filter: closest ? 'hue-rotate(-15deg)' : '',
                    }}
                />
            </div>
        )
    }
}

export default React.memo(
    AirAnimalEntity,
    (prev, next) => {
        return (
            prev.animalTypes === next.animalTypes &&
            prev.timeFilter === next.timeFilter &&
            prev.closest === next.closest &&
            prev.setSelectedEntity === next.setSelectedEntity  &&
            prev.isNight === next.isNight  &&
            prev.entity.base[0] === next.entity.base[0]  &&
            prev.entity.base[1] === next.entity.base[1]  &&
            prev.entity.createdAt === next.entity.createdAt  &&
            prev.entity.deadAt === next.entity.deadAt  &&
            prev.entity.dl === next.entity.dl  &&
            prev.entity.dna === next.entity.dna  &&
            prev.entity.energy === next.entity.energy  &&
            prev.entity.f === next.entity.f  &&
            prev.entity.grp === next.entity.grp  &&
            prev.entity.lastHitAt === next.entity.lastHitAt  &&
            prev.entity.p[0] === next.entity.p[0]  &&
            prev.entity.p[1] === next.entity.p[1]  &&
            shallowObjectEqual(prev.entity.primary, next.entity.primary)  &&
            shallowObjectEqual(prev.entity.secondary, next.entity.secondary)  &&
            prev.entity.rn === next.entity.rn  &&
            prev.entity.s === next.entity.s  &&
            prev.entity.stride === next.entity.stride  &&
            prev.entity.t.name === next.entity.t.name  &&
            prev.entity._id === next.entity._id
        )
    }
)
