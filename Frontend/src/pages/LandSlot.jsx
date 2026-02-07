// import { useNavigate, useParams } from 'react-router-dom'
// import { useTimeFilter } from '../hooks/timeFilter'
// import React, { useEffect, useMemo, useRef, useState } from 'react'
// import { useAuth } from '../contexts/AuthContext'
// import AnimalLayer from '../components/AnimalEntity'


// const LandSlot = ({ cityId, landId, layer, scale, plot, viewport, layerIdx, setLayerIdx }) => {
//     const navigate = useNavigate()
//     const { loggedInUser } = useAuth()
//     // const { cityId, landId } = useParams()
//     const [ theCity, setTheCity ] = useState(null)
//     const timeFilter = useTimeFilter(theCity?.timeZoneOffset ?? 0)  
//     const containerRef = useRef(null)
//     const transformRef = useRef(null)
//     const baseLayerRef = useRef(null)
//     const landPlotRef = useRef(null)
//     const myUserRef = useRef(null)

//     const [landDetails, setLandDetails] = useState({ layer })
//     const [myPosition, setMyPosition] = useState({y: 0.00, x: 0.00})
//     const [isMoving, setIsMoving] = useState(false)
//     // const [handItem, setHandItem] = useState('gun')
//     // console.log(`LAND SLOT ${landId} RERENDERED`)

//     const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms))
    
//     const visibleLayerData = useMemo(() => {
//         // if (!landDetails.layer) console.log("NO LAYER AVAILABLE")
//         if (!landDetails.layer) return null
//         const layer = landDetails.layer

//         const visibleAnimals = layer.animals?.filter(animal =>
//         isItemVisible(
//             animal, plot.x, plot.y, viewport, scale,
//             animalTypes[animal.t]?.size,
//             animalTypes[animal.t]?.size
//         )) || []

//         const visiblePlants = layer.plants?.filter(plant =>
//         isItemVisible(
//             plant, plot.x, plot.y, viewport, scale,
//             plantTypes[plant.t]?.states[plant.s].size[0],
//             plantTypes[plant.t]?.states[plant.s].size[1]
//         )) || []

//         const visibleAirAnimals = layer.airAnimals?.filter(airAnimal =>
//         isItemVisible(
//             airAnimal, plot.x, plot.y, viewport, scale,
//             animalTypes[airAnimal.t]?.size,
//             animalTypes[airAnimal.t]?.size
//         )) || []
        
//         const visibleNaturalResources = layer.naturalResource?.filter(nr =>
//         isItemVisible(
//             nr, plot.x, plot.y, viewport, scale,
//             naturalResourceTypes[nr.t]?.size[0],
//             naturalResourceTypes[nr.t]?.size[1]
//         )) || []

//         return {
//             visibleAnimals,
//             visiblePlants,
//             visibleAirAnimals,
//             visibleNaturalResources
//         }
//     }, [landDetails.layer, viewport.x, viewport.y, viewport.width, viewport.height, scale])
    
//     useEffect(() => {
//         if (cityId && landId) {
//             const requiredCity = cities.find(city => city._id === cityId)
//             if (requiredCity) {
//                 setTheCity(requiredCity)

//                 const landDetails = {
//                     // layer: [
//                     // {
//                     //     name: "A1",
//                     //     plants: t.plants,
//                     //     naturalResources: [{
//                     //         name: "gold",
//                     //         pictureUrl: goldRock4,
//                     //         quantity: 500
//                     //     }],               
//                     // }, {
//                     //     name: "A2",
//                     //     plants: [],
//                     //     airAnimals: [{
//                     //         name: "yellow bird",
//                     //         pictureUrl: yellowBird,
//                     //         quantity: 10,
//                     //         size: 10
//                     //     }],
//                     //     animals: []
//                     // }, {
//                     //     name: "A3",
//                     //     plants: t.plants,
//                     //     airAnimals: [{
//                     //         name: "yellow bird",
//                     //         pictureUrl: yellowBird,
//                     //         quantity: 10,
//                     //         size: 10
//                     //     }]
//                     // }, {
//                     //     name: "A4",
//                     //     plants: [
//                     //         { t: "autumnRedTree", s:"grown", p: [30, 300] },
//                     //         { t: "autumnRedTree", s:"grown", p: [360, 0] },
//                     //         { t: "autumnRedTree", s:"grown", p: [300, 380] },
//                     //         { t: "greenTree", s:"grown", p: [160, 120] },
//                     //         { t: "greenTree", s:"grown", p: [460, 180] },
//                     //         { t: "autumnOrangeTree", s:"grown", p: [360, 320] },
//                     //     ],
//                     //     airAnimals: [{
//                     //         name: "yellow bird",
//                     //         pictureUrl: yellowBird,
//                     //         quantity: 10,
//                     //         size: 10
//                     //     }],
//                     //     aesthetics: [],
//                     //     rooms: [
//                     //         { t: "rusticKitchen", p: [200, 150]},
//                     //         { t: "rusticSmokeHouse", p: [400, 70]}
//                     //     ]
//                     // }, {
//                     //     name: "A5",
//                     //     plants: [
//                     //         { t: "greenTree", s:"grown", p: [0, 0] },
//                     //         { t: "greenTree", s:"grown", p: [390, 50] },
//                     //         { t: "pineTree", s:"grown", p: [128, 240] },
//                     //         { t: "greenTree", s:"grown", p: [140, 380] },
//                     //         { t: "greenTree", s:"grown", p: [160, 120] },
//                     //         { t: "pineTree", s:"grown", p: [360, 260] },
//                     //     ],
//                     //     airAnimals: [{
//                     //         name: "yellow bird",
//                     //         pictureUrl: yellowBird,
//                     //         quantity: 10,
//                     //         size: 10
//                     //     }],
//                     //     aesthetics: [],
//                     //     rooms: [
//                     //         { t: "rusticWoodShed", p: [60, 40]},
//                     //         { t: "rusticBarn", p: [200, 150]},
//                     //         { t: "rusticToolShed", p: [20, 310]},
//                     //         { t: "rusticAnimalShed", p: [400, 340]},
//                     //     ],
//                     // }, {
//                     //     name: "A6",
//                     //     plants: [
//                     //         { t: "greenTree", s:"grown", p: [0, 0] },
//                     //         { t: "greenTree", s:"grown", p: [0, 380] },
//                     //         { t: "greenTree", s:"grown", p: [160, 120] },
//                     //         { t: "pineTree", s:"grown", p: [360, 260] },
//                     //         { t: "pineTree", s:"grown", p: [320, 290] },
//                     //     ],
//                     //     building: {
//                     //         type: 'Farm House',
//                     //         pictureUrl: medevialFarmHouse,
//                     //         position: [160, 140],
//                     //         height: 200,
//                     //         width: 200
//                     //     },
//                     //     aesthetics: [
//                     //         {
//                     //             name: "Farm Signpost",
//                     //             position: [500, 0],
//                     //             type: "misc",
//                     //             pictureUrl: farmSignPost,
//                     //             height: 50,
//                     //             width: 50
//                     //         }
//                     //     ],
//                     //     airAnimals: [{
//                     //         name: "yellow bird",
//                     //         pictureUrl: yellowBird,
//                     //         quantity: 10,
//                     //         size: 10
//                     //     }]
//                     // }, {
//                     //     name: "A7",
//                     //     plants: t.plants,
//                     //     airAnimals: [{
//                     //         name: "yellow bird",
//                     //         pictureUrl: yellowBird,
//                     //         quantity: 10,
//                     //         size: 10
//                     //     }]
//                     // }, {
//                     //     name: "A8",
//                     //     plants: [
//                     //         { t: "greenTree", s:"grown", p: [0, 0] },
//                     //         { t: "greenTree", s:"grown", p: [390, 50] },
//                     //         { t: "greenTree", s:"grown", p: [280, 190] },
//                     //         { t: "greenTree", s:"grown", p: [240, 170] },
//                     //         { t: "greenTree", s:"grown", p: [200, 370] },
//                     //     ],
//                     //     naturalResources: [{
//                     //         name: "gold",
//                     //         pictureUrl: goldRock4,
//                     //         quantity: 1500
//                     //     }],
//                     //     airAnimals: [{
//                     //         name: "yellow bird",
//                     //         pictureUrl: yellowBird,
//                     //         quantity: 10,
//                     //         size: 10
//                     //     }],
//                     //     animals: [
//                     //         {t: "whiteSheep", p: [80, 30]},
//                     //         {t: "whiteSheep", p: [110, 50]},
//                     //         {t: "whiteSheep", p: [180, 30]},
//                     //         {t: "whiteSheep", p: [90, 90]},
//                     //         {t: "whiteSheep", p: [50, 90]},
//                     //         {t: "whiteSheep", p: [150, 130]},
//                     //         {t: "whiteSheep", p: [90, 120]},
                            
//                     //         {t: "brownWhiteCow", p: [50, 280]},
//                     //         {t: "brownWhiteCow", p: [70, 350]},
//                     //         {t: "brownWhiteCow", p: [150, 380]},
//                     //         {t: "brownWhiteCow", p: [70, 410]},
//                     //         {t: "brownWhiteCow", p: [50, 220]},
//                     //         {t: "brownWhiteCow", p: [180, 290]},
//                     //         {t: "brownWhiteCow", p: [190, 330]},

//                     //         {t: "brownWhiteGoat", p: [400, 10]},
//                     //         {t: "brownWhiteGoat", p: [360, 100]},
//                     //         {t: "brownWhiteGoat", p: [410, 140]},
//                     //         {t: "brownWhiteGoat", p: [360, 180]},
//                     //         {t: "brownWhiteGoat", p: [460, 30]},
//                     //         {t: "brownWhiteGoat", p: [360, 50]},
//                     //         {t: "brownWhiteGoat", p: [450, 180]},

//                     //         {t: "brownHorse", p: [450, 240]},
//                     //         {t: "brownHorse", p: [530, 240]},
//                     //         {t: "brownHorse", p: [500, 290]},
//                     //         {t: "brownHorse", p: [400, 390]},
//                     //         {t: "brownHorse", p: [490, 180]},
//                     //         {t: "brownHorse", p: [530, 150]},
//                     //         {t: "brownHorse", p: [450, 70]},
//                     //     ],
//                     //     aesthetics: []
//                     // }, {
//                     //     name: "A9",
//                     //     plants: t.plants
//                     // }]
//                 }
    
//                 // setLandDetails(landDetails)
//             }
//         }
//     }, [cityId, landId, cities])

//     useEffect(() => {
//         console.log("LAYER CHANGED TO: ", layerIdx)
//         setLandDetails({ layer })
//     }, [layer])

//     // useEffect(() => {
//     //     if (layer && cityId && landId) {
//     //         setLandDetails({ layer })
//     //     }
//     // }, [layer, cityId, landId])

//     // useEffect(() => {
//     //     console.log("My Current Position: ", myPosition)
//     // }, [myPosition])

//     const grassColors = [
//         // "#7BB661", // Spring Green
//         // "#6FAA3F", // Fresh Meadow
//         // "#4F9D2F", // Classic Grass Green
//         "#3C8031", // Deep Lawn
//         "#2D6B2A", // Shady Patch
//         "#6B8E23", // Olive Grass
//         // "#9CAF88", // Dry Summer Grass
//         // "#B4A76C", // Yellowing Grass
//         "#4B5D2A"  // Mossy Ground
//     ]


//     return (
//         <div ref={landPlotRef} className="relative" style={{ height: plot.height, width: plot.width }}
//         // onClick={(e) => {
//         //     e.stopPropagation()
//         //     setLayerIdx(prev => {
//         //         const maxLayer = plot.layers.length - 1
//         //         console.log("Current Layer: ", prev + 1)
//         //         console.log("MAX Layer", maxLayer)
//         //         const result = prev === maxLayer ? 0 : prev + 1
//         //         return result
//         //     })
//         // }}
//         >
//             <div
//             ref={myUserRef}
//                 data-user-id={loggedInUser?._id}
//                 onClick={(e) => {
//                     e.stopPropagation()
//                     const containerRect = landPlotRef?.current.getBoundingClientRect();
//                     const containerX = window.scrollX + containerRect.left
//                     const containerY = window.scrollY + containerRect.top

//                     const elementRect = myUserRef.current.getBoundingClientRect();
//                     const absoluteX = scrollX + elementRect.left
//                     const absoluteY = scrollY + elementRect.top
                    
//                     const relativeX = ((absoluteX - containerX)/scale).toFixed(2);
//                     const relativeY = ((absoluteY - containerY)/scale).toFixed(2);
                
//                     console.log("User position relative to container:", {
//                         x: relativeX,
//                         y: relativeY,
//                     });
//                     console.log("My Position: ", myPosition)
//                 }}
//                 style={{
//                     position: 'absolute',
//                     left: `${myPosition.x}px`,
//                     top: `${myPosition.y}px`,
//                     // filter: `
//                     //     brightness(${1 - timeFilter})
//                     //     saturate(${1 - timeFilter * 0.5})
//                     // `,
//                     transform: 'skewX(30deg)',
//                     transition: `all ${300}ms ease-in-out`,
//                     zIndex: 10
//                 }}
//                 className='h-8 w-8 rounded-full p-[2px] border border-white cursor-pointer
//                 '
//             >
//                 <div className='w-full h-full rounded-full'>
//                     <img src={loggedInUser.profilePicture}
//                     className='h-full w-full object-contain rounded-full' />
//                 </div>
                
//             </div>
//             {(!visibleLayerData || Object.keys(visibleLayerData).length === 0) ? (
//                 <div className="w-full h-full relative inline-block align-top">
//                 </div>
//             ) : (
//                 <>
//                     {/* Air Layer */}
//                     {/* Z Index: 20 */}
//                     {/* <div className='w-full h-full absolute z-20 overflow-visible'>
//                         <AirAnimalLayer animalTypes={animalTypes} visibleAirAnimals={visibleLayerData.visibleAirAnimals} 
//                         timeFilter={timeFilter} layerIdx={layerIdx} />
//                     </div> */}

//                     {/* Plants Ainimals and Building Layer */}
//                     {/* Z Index: 10 */}
//                     <div
//                     className="w-full h-full absolute z-10 overflow-visible"
//                     // style={{pointerEvents: 'none'}}
//                     >
//                         {/* Z Index: 10 - 0 */}
//                         {/* <LandPlotNodes moveToNode={moveToNode} /> */}

//                         {/* Z Index: 10 - 1 - 300 */}
//                         {/* {slot.building && slot.building && (
//                             <div className='w-full h-full absolute top-0 left-0'
//                             onClick={handItem ? getHider : enterRoom}
//                             style={{
//                                 top: slot.building?.position[1],
//                                 left: slot.building?.position[0],
//                                 // filter: `brightness(${1 - timeFilter})`,
//                                 height: `${slot.building?.height}px`,
//                                 width: `${slot.building?.width}px`,
//                                 zIndex: slot.building?.position[1] + 1 + slot.building?.height
//                             }}>                                                   
//                                 <img className='absolute object-contain scale-y-[1.2] scale-x-[1.2]'
//                                 src={medevialFarmHouse}
//                                 />
//                             </div>
//                         )} */}

//                         {/* Z Index: 10 - 1 - 300 */}
//                         {/* {slot.aesthetics && slot.aesthetics?.map((aesthetic, asIdx) => (
//                             <div key={`${asIdx}`} 
//                             onClick={handItem ? getHider : moveToNode}
//                             className='cursor-pointer group absolute'
//                             style={{
//                                 top: aesthetic.position[1],
//                                 left: aesthetic.position[0],
//                                 zIndex: aesthetic.position[1] + 1 + (aesthetic.type === "plant" ? 100 : aesthetic.height),
//                                 height: aesthetic.type === "plant" ? "100px" : `${aesthetic.height}px`,
//                                 width: aesthetic.type === "plant" ? "100px" : `${aesthetic.width}px`,
//                             }}>
//                             <img
                                
//                                 src={aesthetic.type === "plant" ? aesthetic.grownPictureUrl : aesthetic.pictureUrl}
//                                 alt={aesthetic.name}
//                                 className={`w-full h-full object-contain transition-transform duration-500 ease-in-out
//                                 ${handItem ? null : 'group-hover:scale-110 group-hover:scale-y-[1.3] group-hover:scale-x-[1.3]'} 
//                                 scale-y-[1.2] scale-x-[1.19]`}
//                                 style={{
//                                     pointerEvents: 'none',
//                                     // filter: `
//                                     //     brightness(${1 - timeFilter})
//                                     //     saturate(${1 - timeFilter * 0.5})
//                                     // `,
//                                 }}
//                             />
//                             </div>
//                         ))} */}

//                         {/* Z Index: 10 - 1 - 300 */}
//                         {/* {slot.rooms && slot.rooms?.map((room, roomIdx) => {
//                             return (
//                                 <div className='w-full h-full ml-3 mt-3 absolute top-0 left-0 z-30 flex items-center
//                                 justify-center group cursor-pointer'
//                                 onClick={handItem ? getHider : enterRoom}
//                                 key={roomIdx}
//                                 title={room.name}
//                                 style={{
//                                     top: room.p?.[1],
//                                     left: room.p?.[0],
//                                     zIndex: room.p?.[1] + 1 + roomTypes[room.t].size,
//                                     height: `${roomTypes[room.t].size}px`,
//                                     width: `${roomTypes[room.t].size}px`
//                                 }}>
//                                     <img className='object-contain h-full w-full transition-transform duration-500 ease-in-out
//                                     group-hover:scale-x-[1.5] group-hover:scale-y-[1.3] scale-y-[1.2] scale-x-[1.4]'
//                                     src={roomTypes[room.t].pictureUrl}
//                                     // style={{
//                                     //     filter: `brightness(${1 - timeFilter})`,
//                                     // }}
//                                     />
//                                 </div>
//                             )
//                         })} */}

//                         {/* <PlantLayer  plantTypes={plantTypes} visiblePlants={visibleLayerData.visiblePlants} timeFilter={timeFilter}
//                         moveToNode={moveToNode} getHider={getHider} handItem={handItem} layerIdx={layerIdx} />

//                         {(plot.waterPatch && layerIdx > 0) && (
//                             <AnimalLayer animalTypes={animalTypes} animals={visibleLayerData.visibleAnimals} 
//                             timeFilter={timeFilter} layerIdx={layerIdx} />
//                         )} */}

//                         {visibleLayerData.visibleNaturalResources && visibleLayerData.visibleNaturalResources
//                         .map((naturalResource, nrIdx) => (
//                             <div key={`${naturalResource.t}-${naturalResource.p[0]}-${naturalResource.p[1]}`} 
//                             className={`cursor-pointer group absolute overflow-hidden hover:scale-y-[1.05] hover:scale-x-[1.05]`}
//                             // onClick={handItem ? getHider : moveToNode}
//                             onClick={(e) => {
//                                 e.stopPropagation()
//                                 console.log("NR clicked")
//                             }}
//                             style={{
//                                 top: naturalResource.p[1],
//                                 left: naturalResource.p[0],
//                                 zIndex: naturalResource.p[1] + 1 + naturalResourceTypes[naturalResource.t]?.size[0],
//                                 height: naturalResourceTypes[naturalResource.t]?.size[0],
//                                 width: naturalResourceTypes[naturalResource.t]?.size[1],
//                                 pointerEvents: "auto",
//                                 filter: `brightness(${1 - ((layerIdx/10) + 0.45)})`,
//                             }}>
//                                 <img
//                                     // onClick={(e) => {
//                                     //     e.stopPropagation()
//                                     //     console.log("PLANT CLICKED: ", plantTypes[plant.t]?.name)
//                                     // }}
//                                     src={naturalResourceTypes[naturalResource.t]?.purl}
//                                     alt={naturalResourceTypes[naturalResource.t]?.name}
//                                     className={`w-full h-full object-contain transition-transform duration-500 ease-in-out
//                                     ${handItem ? null : 'group-hover:scale-110 group-hover:scale-y-[1.3] group-hover:scale-x-[1.3]'} 
//                                     `}
//                                     style={{
//                                         pointerEvents: "auto",
//                                         transform: 'skewX(30deg)'
//                                     }}
//                                 />
//                             </div>
//                         ))}

//                     </div>

//                     {/* Water top */}
//                     {/* Z Index: 10 */}
//                     {(plot.waterPatch && layerIdx === 0) && (
//                         <div className='w-full h-full absolute overflow-visible'
//                         style={{ 
//                             zIndex: 15,
//                             // background: `${grassStyles[2]}, rgba(33, 148, 183, ${1 - timeFilter})`
//                         }}></div>
//                     )}

//                     {/* The base layer */}
//                     {/* Z Index: 1 */}
//                     <div ref={baseLayerRef} 
//                     className="w-full h-full absolute overflow-visible z-[1]">
//                         {(plot.waterPatch && layerIdx === 0) && (
//                             <AnimalLayer animalTypes={animalTypes} animals={visibleLayerData.visibleAnimals} 
//                             timeFilter={timeFilter} layerIdx={layerIdx} />
//                         )}
//                     </div>
//                 </>
//                 )
//             }
//         </div>
//     )
// }

// export default LandSlot
