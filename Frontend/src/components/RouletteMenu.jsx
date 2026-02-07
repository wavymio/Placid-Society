import React, { useEffect, useState } from 'react'

const userActions = { alone: ["chat", "profile", "hit", "pick"], held: ["drop"]}
const slots = [
    { offset: -2, style: "invisible side", x: -40, y: -90, key: "slot-top-left", priority: 4 },
    { offset: -1, style: "side", x: -40, y: -90, key: "slot-top-right", priority: 2 },
    { offset: 0,  style: "center", x: -80, y: 0,  key: "slot-center", priority: 1 },
    { offset: 1,  style: "side", x: -40, y: 90,  key: "slot-bottom-right", priority: 3 },
    { offset: 2,  style: "invisible side", x: -40,  y: 90,  key: "slot-bottom-left", priority: 5 },
]
const shallowArrayEqual = (a = [], b = []) =>
a.length === b.length && a.every((v, i) => v === b[i])

const RouletteMenu = ({ selectedEntity, currentIdx, setCurrentIdx, onSelect, energy, health }) => {
    // console.log("Roulette </> ...")
    const isInvisible = !health || !energy
    const [actions, setActions] = useState([])
    const activeSlots = [...slots]
    .sort((a, b) => a.priority - b.priority)
    .slice(0, Math.min(actions.length, slots.length))

    const handleMoveUp = ({ e, action }) => {
        e.stopPropagation()
        setCurrentIdx(prev => prev === actions.length-1 ? 0 :  prev + 1)
        onSelect({ ...action })
    }
    const handleMoveDown = ({ e, action }) => {
        e.stopPropagation()
        setCurrentIdx(prev => prev === 0 ? actions.length-1 :  prev - 1)
        onSelect({ ...action })
    }

    useEffect(() => {
        if (selectedEntity) {
            setCurrentIdx(0)
            const actionsContructed = []
            selectedEntity.map((entity, eidx) => {
                const isUser = entity.userStyleId
                const aloneActions = isUser ? userActions.alone : entity.t.actions.alone
                const entityName = isUser ? entity.userStyleId.userId.username : entity.t.name
                aloneActions.map((action, aidx) => {
                    const theAction = { entity, entityName, action }
                    actionsContructed.push(theAction)
                })
            })
            setActions(actionsContructed)
        }
    }, [selectedEntity])

    return (
        <div onMouseDown={(e) => e.preventDefault()}  className={`${isInvisible ? 'invisible' : ''} absolute right-[-95px] bottom-[30px] z-[999] w-[200px] h-[200px] flex items-center justify-center`}>
            <div onClick={() => setCurrentIdx(prev => prev === 0 ? actions.length-1 :  prev - 1)} className='h-20 w-20 rounded-full opacity-50 bg-white cursor-pointer '></div>
            {actions && actions.map((action, aidx) => {
                const relativeOffset = (aidx - currentIdx + actions.length) % actions.length

                // map offsets -2,-1,0,1,2 to slots, ignore the rest
                const slot = activeSlots.find(s => 
                    (s.offset + actions.length) % actions.length === relativeOffset ||
                    s.offset === relativeOffset - actions.length
                )

                if (!slot) return null

                return (
                    <div
                    key={`${action.action}-${action.entityName}`}
                    onClick={(e) => slot.priority > 3 ? null : slot.priority === 2 ? handleMoveDown({ e, action }) : slot.priority === 3 ? handleMoveUp({ e, action }) : onSelect({ ...action })}
                    className={`roulette-action ${slot.style} cursor-pointer`}
                    style={{
                        transform: `translateX(${slot.x}px) translateY(${slot.y}px) `,
                    }}
                    >
                        <div className='flex items-center justify-center capitalize text-sm font-semibold'>{action.action}</div>
                        <div 
                        style={{
                            opacity: energy <= 5 ? energy / 100 : 1,
                            color:
                                energy <= 5
                                ? `rgba(255,255,255,${energy / 100})`
                                : 'rgba(255,255,255,1)',
                            transition: 'opacity 0.6s ease-out, color 0.6s ease-out'
                        }}
                        className='flex items-center justify-center capitalize text-[10px]'>{`${action.entityName}`}</div>
                    </div>
                )})}
        </div>
    
  )
}

// export default RouletteMenu
export default React.memo(
    RouletteMenu,
    (prev, next) => {
        return (
        prev.currentIdx === next.currentIdx &&
        prev.energy === next.energy &&
        prev.health === next.health &&
        prev.onSelect === next.onSelect &&
        shallowArrayEqual(prev.selectedEntity, next.selectedEntity)
        )
    }
)
