import { shallowObjectEqual, updateCount } from '../lib/cityUtils'
import React, { useEffect, useMemo } from 'react'
import EnergyBar from './EnergyBar'

const PlantEntity = React.memo(({ entity, plantTypes, timeFilter, closest=false, setSelectedEntity }) => {
    // console.log("Plant </> ...")
    // const plant = plantTypes["cherry blossom tree"]
    const plant = plantTypes[entity.t]
    const height = plant?.states[entity.s].size[0]
    const width = plant?.states[entity.s].size[1]
    const [actualX, actualY] = useMemo(() => [entity.p[0] - width, entity.p[1] - height], [entity.p, width, height])
    // const newCount = updateCount(100, entity.energy, 30000, entity.lastHitAt)

    useEffect(() => {
        if (closest) {
            const entire = [{...entity, t: plant}]
            setSelectedEntity(entire)
        }
    }, [closest])

    return (
            <div key={entity._id || entity.id}
            className={`plant cursor-pointer group absolute overflow-hidden hover:scale-y-[1.05] hover:scale-x-[1.05]`}
            // transition-transform ease-in-out duration-200
            style={{
                top: actualY,
                left: actualX,
                zIndex: actualY + 1 + plant?.states[entity.s].size[0],
                height,
                width,
                // filter: `brightness(${1 - timeFilter})`,
                pointerEvents: 'none',
                // background: closest ? countryColour3 : '',
                transformOrigin: "bottom left",
                contain: "layout paint",
                transform: "translateZ(0)",
                willChange: "transform",
                
            }}>
                {closest && (
                    <EnergyBar max={100} quantity={entity.energy} hideNumbers={true}
                    className={'absolute text-[7px] z-[999] rounded-sm'} 
                    style={{ left: `${Math.floor((width/2) - ((width * 0.4)/2))}px`, top: `${Math.floor((height/2) - ((height * 0.05)/2))}px`, 
                    transform: 'skewX(30deg)', height:'5%', width: '40%' }} />
                )}
                <img loading="eager"
                    src={plant?.states[entity.s].purl}
                    alt={plant?.name}
                    className={`w-full h-full object-contain transition-transform duration-500 ease-in-out`}
                    style={{
                        // pointerEvents: "auto",
                        transform: 'skewX(30deg)',
                        filter: closest ? 'hue-rotate(-15deg)' : '',
                    }}
                />
            </div>
        )
    })

export default React.memo(
    PlantEntity,
    (prev, next) => {
        return (
            prev.plantTypes === next.plantTypes &&
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
            prev.entity.s === next.entity.s  &&
            prev.entity.t.name === next.entity.t.name  &&
            prev.entity._id === next.entity._id
        )
    }
)
