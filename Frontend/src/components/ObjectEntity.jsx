import { arraysEqualUnordered, shallowObjectEqual, updateCount } from '../lib/cityUtils'
import { countryColour, countryColour3 } from '../lib/mapUtils'
import React, { useEffect } from 'react'
import EnergyBar from './EnergyBar'

const ObjectEntity = ({ closest=false, entity, objectTypes, timeFilter, setSelectedEntity }) => {
    // console.log("Object </> ...")
    const object = objectTypes[entity.t]
    const isElement = entity.grp === "element"
    const height = isElement ? entity.energy : object?.states[entity.s].size[0]
    const width = isElement ? entity.energy : object?.states[entity.s].size[1]
    const actualY = entity.p[1] - height
    const actualX = entity.p[0] - width
    // const newCount = updateCount(100, entity.energy, 30000, entity.lastHitAt)

    useEffect(() => {
        if (closest) {
            const entire = [{...entity, t: object}]
            setSelectedEntity(entire)
        }
    }, [closest])

    return (
        <div key={entity._id || entity.id}
        className={`cursor-pointer group absolute hover:scale-y-[1.05] hover:scale-x-[1.05]
        transition-transform ease-in-out duration-0`}
        style={{
            top: actualY,
            left: actualX,
            zIndex: entity.t === "hole" ? 1 : actualY + 1 + height,
            height,
            width,
            // pointerEvents: "auto",
            filter: `brightness(${1 - timeFilter})`,
            pointerEvents: 'none',
            // background: closest ? countryColour3 : '',
            // transform: closest ? `scaleX(1.15) scaleY(1.15)` : ``
            transform: ``
            // transform: 'skewX(30deg)'
        }}>
            {closest && (
                <EnergyBar max={100} quantity={entity.energy} hideNumbers={true}
                className={'absolute text-[7px] z-[999] rounded-sm'} 
                style={{ left: `${width/2 - 20}px`, top: `${entity.t === "hole" ? height/2 - 2.25 : -10}px`, 
                height:'4.5px', width: '40px', transform: 'skewX(30deg)' }} />
            )}
            
            <img loading="eager"
                src={object?.states[entity.s].purl}
                alt={object?.name}
                className={`w-full h-full object-contain transition-transform duration-500 ease-in-out`}
                style={{
                    // pointerEvents: "auto",
                    transform: 'skewX(30deg)',
                    filter: closest ? 'sepia(1) saturate(3) hue-rotate(-10deg)' : '',
                }}
            />
        </div>
    )
}

// export default ObjectEntity
export default React.memo(
    ObjectEntity,
    (prev, next) => {
        return (
            prev.objectTypes === next.objectTypes &&
            prev.timeFilter === next.timeFilter &&
            prev.closest === next.closest &&
            prev.setSelectedEntity === next.setSelectedEntity  &&
            prev.entity.createdAt === next.entity.createdAt  &&
            prev.entity.deadAt === next.entity.deadAt  &&
            prev.entity.dna === next.entity.dna  &&
            prev.entity.energy === next.entity.energy  &&
            prev.entity.grp === next.entity.grp  &&
            prev.entity.lastHitAt === next.entity.lastHitAt  &&
            prev.entity.p[0] === next.entity.p[0]  &&
            prev.entity.p[1] === next.entity.p[1]  &&
            shallowObjectEqual(prev.entity.primary, next.entity.primary)  &&
            shallowObjectEqual(prev.entity.secondary, next.entity.secondary)  &&
            prev.entity.q === next.entity.q  &&
            prev.entity.s === next.entity.s  &&
            prev.entity.t.name === next.entity.t.name  &&
            prev.entity._id === next.entity._id
        )
    }
)

