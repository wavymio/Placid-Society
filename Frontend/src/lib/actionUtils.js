import { isIntersecting } from "./plotUtils"
import { betterHash, seededRandom, updateCount } from "./cityUtils"

// ==========================
// Helper Functions
// ==========================
export const reEvaluateEnergy = (lastGeneratedTime, energy, maxEnergy, respawnTime) => {
  const currTime = Date.now()
  if (energy === maxEnergy) return { energy, lgn: currTime }
  const tDiff = currTime - (lastGeneratedTime ?? 0)
  const energyGenerated = Math.floor(tDiff/respawnTime)
  if (energyGenerated === 0) return { energy, lgn: lastGeneratedTime }
  const newEnergy = Math.min(energy + energyGenerated, 100)
  const newLgnTime = lastGeneratedTime + (energyGenerated * respawnTime)
  return { energy: newEnergy, lgn: newLgnTime } 
}

export const ref = {
    "plant": [["fruit", "good"], ["leaf", "good"], ["object", "new"]],
    "animal": [["food", "good"], ["object", "new"], ["food", "good"]],
    "airAnimal": [["food", "good"], ["object", "new"], ["food", "good"]],
    "object": [["object", "new"], ["object", "new"], ["object", "new"]],
        // naturalResource: naturalResourceTypes,
        // food: foodTypes,
        // fruit: foodTypes,
        // leaf: foodTypes,
        // resource: objectTypes,
        // element: objectTypes,
        // earthly: earthlyTypes
}

const sRef = {
    "plant": "young",
    "animal": "young",
    "airAnimal": "young",
    "object": "new",
    "food": "good",
    "fruit": "good",
    "leaf": "good",
    "resource": "new",
    "earthly": "new"
}

const destroyEntity = (entity, myCoords, layerCacheRef, layerIdx) => {
  const state = entity.t.states[entity.s]
  const hasPrimary = updateCount((state.primary?.max ?? 0), (entity.primary?.count?? 0), entity.t.resourceGrowth, entity.primary?.lastGenerated)
  const hasSecondary = updateCount((state.secondary?.max ?? 0), (entity.secondary?.count?? 0), entity.t.resourceGrowth, entity.secondary?.lastGenerated)
  const hasResource = state.resource?.max ?? 0
  const sharedFields = { dna: null, energy: 100, deadAt: null, lastHitAt: null }
  
  const newPrimary = !!hasPrimary ? { ...sharedFields, id: crypto.randomUUID(), p: [myCoords.x, myCoords.y], s: sRef[state.primary.grp], t: state.primary.name, grp: state.primary.grp,
  ...(hasPrimary > 1 ? { q: hasPrimary } : {}), type: "primary" } : null
  const newSecondary = !!hasSecondary ? { ...sharedFields, id: crypto.randomUUID(), p: [myCoords.x+10, myCoords.y+10], s: sRef[state.secondary.grp], t: state.secondary.name, grp: state.secondary.grp,
  ...(hasSecondary > 1 ? { q: hasSecondary } : {}), type: "secondary" } : null
  const newResource = !!hasResource ? { ...sharedFields, id: crypto.randomUUID(), p: [myCoords.x+20, myCoords.y+20], s: sRef[state.resource.grp], t: state.resource.name, grp: state.resource.grp,
  ...(hasResource > 1 ? { q: hasResource } : {}), type: "resource" } : null

  const toBeAdded = [ ...(newPrimary ? [newPrimary] : []), ...(newSecondary ? [newSecondary] : []), ...(newResource ? [newResource] : []) ]
  return toBeAdded
}

const keepEntityInPlot = (plots, myCoords, eh, ew) => {
  const myPlot = plots.find(plot => plot.id === myCoords.plotId)
  const plotXMargins = [ (myPlot.leftOffset ? -140 : 0), myPlot.bcw ]
  const plotYMargins = [ (myPlot.topOffset ? -120 : 0), myPlot.bch ]
  let newX = myCoords.x
  let newY = myCoords.y
  if (newX - ew < plotXMargins[0]) newX = plotXMargins[0] + ew
  if (newY - eh < plotYMargins[0]) newY = plotYMargins[0] + eh

  console.log({ newX, newY })
  return [newX, newY]
}

const swallowEntities = (usersInView, layerCacheRef, layerIdx, myCoords, holeCoords) => {
  if (!usersInView?.current) return
  const myPlot = layerCacheRef.current.get(myCoords.plotId)
  const myLayer = myPlot.layers[layerIdx]
  const layerBelow = myPlot.layers[layerIdx + 1]
  
  // user swallowing
  const users = usersInView.current
  for (const u of users.values()) {
    if (u.plotId !== myCoords.plotId || u.layerIdx !== layerIdx) continue
    const { height, width } = u.userStyleId
    if (isIntersecting(holeCoords, u.x, u.y, height, width)) users.set(u._id, { ...u, layerIdx: layerIdx + 1 })
  }

  // remove the entities
  const toBeKept = []
  const toBeRemoved = []
  myLayer.entities.map(e => {
    const height = groupEntityMap[e.grp][e.t]?.states[e.s].size[0]
    const width = groupEntityMap[e.grp][e.t]?.states[e.s].size[1]
    if (e._id === holeCoords._id) toBeKept.push(e) 
    else if (isIntersecting(holeCoords, e.p[0], e.p[1], height, width)) toBeRemoved.push(e)
    else toBeKept.push(e)
  })
  myPlot.layers[layerIdx] = { ...myLayer, entities: toBeKept }
  myPlot.layers[layerIdx + 1] = { ...layerBelow, entities: [...layerBelow.entities, ...toBeRemoved]}
}

// ==========================
// Entity placement/removal
// ==========================

const handlePick = async ({ action, entity, myCoords, setInspect, setInspectTabMode, sendAction, myCity, emissionView, layerCacheRef }) => {
    if (!entity) return
    if (entity.q && entity.q > 1 && entity.grp !== "earthly") {
      setInspect(entity)
      setInspectTabMode("pick")
      return
    }
    const cityId = myCity?._id
    if (!myCoords || !emissionView.current || !cityId) return

    let modEnt 
    let newAction
    let droppingEarthlyData = null
    let otherUserDed

    if (myCoords.holding?._id === entity._id) return
    if (myCoords.holding?.grp === "earthly") { 
      const myEarthly = layerCacheRef.current.get(myCoords.plotId).layers[myCoords.layerIdx].earthlies[myCoords.on].find(eth => eth.t === myCoords.holding?.t)
      if (myEarthly) droppingEarthlyData = myEarthly
    }

    if (entity.userStyleId) {
      newAction = "pickUser"
      modEnt = entity
      if (entity.holding?.grp === "earthly") {
        const ouEarthly = layerCacheRef.current.get(entity.plotId).layers[entity.layerIdx].earthlies[entity.on].find(eth => eth.t === entity.holding?.t)
        if (ouEarthly) otherUserDed = ouEarthly
      }
    } else if (entity.grp === "earthly") {
      if (myCoords.holding?.t === entity.t.name) return
      newAction = "pickEarthly"
      modEnt = { ...entity, t: entity.t.name, p: [0,0], dna: myCoords._id, lastHitAt: null, energy: 100 }
    } else {
      newAction = action
      modEnt = { ...entity, t: entity.t.name, dna: myCoords._id, p: [0,0] }
    }
    const savePayload = { action: newAction, myCoords, entity: modEnt, cityId, emissionView: emissionView.current, droppingEarthlyData, otherUserDed  }
    // console.log(savePayload)
    const data = await sendAction(savePayload)
}

const handleDrop = async ({ action, entity, myCoords, setInspect, setInspectTabMode, sendAction, myCity, emissionView, layerCacheRef }) => {
  if (!entity) return
  if (entity.q && entity.q > 1 && entity.grp !== "earthly") {
    setInspect(entity)
    setInspectTabMode("drop")
    return
  }

  const cityId = myCity?._id
  if (!myCoords || !emissionView.current || !cityId) return

  let modEnt 
  let newAction
  if (entity.userStyleId) { 
    newAction = "dropUser"
  } else if (entity.grp === "earthly") {
    newAction = "dropEarthly"
    let droppingEarthlyData = null
    const myEarthly = layerCacheRef.current.get(myCoords.plotId).layers[myCoords.layerIdx].earthlies[myCoords.on].find(eth => eth.t === myCoords.holding?.t)
    if (myEarthly) droppingEarthlyData = myEarthly
    modEnt = { droppingEarthlyData }
  } else {
    newAction = action
    modEnt = { ...entity, p: [myCoords.x, myCoords.y], dna: myCoords._id, t: entity.t.name }
  }
  
  const savePayload = { action: newAction, myCoords, entity: modEnt??entity, cityId, emissionView: emissionView.current  }
  // console.log(savePayload)
  const data = await sendAction(savePayload)
}

const handleEscape = async ({ action, entity, myCoords, sendAction, myCity, emissionView }) => {
    if (!myCoords || !myCoords?.held || !entity || !myCity || !emissionView.current) return
    const cityId = myCity._id
    const savePayload = { action: "escape", myCoords, entity, cityId, emissionView: emissionView.current  }
    // console.log(savePayload)
    const data = await sendAction(savePayload)
}

const handleInspect = ({ action, entity, inspect, setInspect }) => {
  setInspect(entity)
}

const handleHit = async ({ action, myCoords, entity, layerCacheRef, layerIdx, plotMargins, holdingDamage, holdingWeight, sendAction, myCity, emissionView }) => {
  const cityId = myCity?._id
  const myStats = myCoords?.userStyleId?.stats
  const isUser = entity.userStyleId
  const isAnimal = entity.grp === "animal"
  const defenderStats = isUser ? entity.userStyleId?.stats : { energy: entity.energy, endurance: (entity.t?.states?.[entity.s]?.endurance ?? 0) }
  if (!cityId || !myStats || myStats?.energy <= 0 || !defenderStats 
  || (isUser && defenderStats?.health <= 0) || (!isUser && defenderStats.energy <= 0)) return

  const animation = myCoords.facing !== "r" ? "hitLeft" : "hitRight"
  // setAction(animation)

  // calculate attacker damage
  const attackerDamage = myStats.damage
  const attackerEnergy = myStats.energy
  const totalDamage = attackerDamage + holdingDamage
  const actualDamage = Math.max(0, Math.round((attackerEnergy/100) * totalDamage))
  
  // calculate  attacker energy cost
  const myWeight = myCoords.userStyleId.height + myCoords.userStyleId.width
  const energyCost = Math.round(((myWeight + (holdingWeight ?? 0))/myWeight) * 5)
  const threshold = 100
  const totalEnergyCost = Math.round(energyCost * (threshold/(threshold + myStats.endurance)))
  const actualEnergyCost = totalEnergyCost === 0 ? 1 : totalEnergyCost
  const energy = Math.max(myStats.energy - actualEnergyCost, 0)
  const endurance = energy === 0 ? myStats.endurance + 1 : myStats.endurance
  const attackerModifiedStats = { energy, lgn: myStats.energy === 100 ? Date.now() : myStats.lgn, endurance }

  const defenderTolerance = isUser ? defenderStats.immunity : defenderStats.endurance
  const totalHealthCost = Math.round(actualDamage * (threshold/(threshold + defenderTolerance)))
  const actualHealthCost = totalHealthCost === 0 ? 1 : totalHealthCost
  const health = Math.max((isUser ? defenderStats.health : defenderStats.energy) - actualHealthCost, 0)
  
  let payload
  let defenderModifiedStats

  if (isUser) {  
    defenderModifiedStats = { health }
    payload = { animation, action: "hitUser", myCoords, entity, frontendLgn: attackerModifiedStats.lgn, actualEnergyCost, actualHealthCost, cityId, emissionView: emissionView.current }
  } else {
    if (health > 0) {
      let modEnt
      if (isAnimal && ["sleep", "rest"].includes(entity.ins)) {
        const seed = `${entity.t.name}-${entity.dl}`
        const rng = seededRandom(betterHash(seed))
        const stride = entity.stride
  
        const xSteps = Math.floor(rng() * 10)
        const ySteps = 10 - xSteps
        console.log({ xSteps, ySteps })

        const baseX = entity.base[0]
        const baseY = entity.base[1]

        const totalX = stride * xSteps
        const totalY = stride * ySteps

        const boundR = plotMargins.r
        const boundB = plotMargins.b

        const xAdd = baseX + totalX <= boundR
        const xNew = xAdd ? baseX + totalX : baseX - totalX

        const yAdd = baseY + totalY <= boundB
        const yNew = yAdd ? baseY + totalY : baseY - totalY

        const newBase = [xNew, yNew]
        modEnt = { ...entity, t: entity.t.name, energy: health, base: newBase, ins: "escape" }
      } else modEnt = { ...entity, t: entity.t.name, energy: health }
      payload = { animation, action: "hitEntity", myCoords, entity: modEnt, frontendLgn: attackerModifiedStats.lgn, actualEnergyCost, cityId, emissionView: emissionView.current  }
    } else {
      const entityProducts = destroyEntity(entity, myCoords, layerCacheRef, layerIdx) 
      payload = { animation, action: "hitDestroyEntity", entity, entityProducts,  myCoords, frontendLgn: attackerModifiedStats.lgn, actualEnergyCost, cityId, emissionView: emissionView.current }
    }
  }

  // console.log({ payload })
  const data = await sendAction(payload)
}

// const handleDig = ({ action, entity, myCoords, layerCacheRef, layerIdx, setMyCoords, setSelectedEntity, plots, usersInView, setAction}) => {
//   setAction(myCoords.facing !== "r" ? "hitLeft" : "hitRight")
//   const diggingHole = entity.t.name === "hole"
//   const newEnergy = diggingHole ? Math.min(1000, entity.energy+100) : 30
//   const coordsForPlacement = { x: diggingHole ? entity.p[0] : myCoords.x, y: diggingHole ? entity.p[1] : myCoords.y, plotId: myCoords.plotId }
//   const newPos = keepEntityInPlot(plots, coordsForPlacement, newEnergy, newEnergy)
//   const hole = diggingHole ? { ...entity, energy: newEnergy, p: newPos } : { id: crypto.randomUUID(), grp: "element", energy: newEnergy, lastHitAt: Date.now(), dna: myCoords._id, 
//   p: newPos, t: {name: "hole"}, s: "new", createdAt: Date.now() }
//   const holeCoords = { x: hole.p[0], y: hole.p[1], width: hole.energy, height: hole.energy, id: hole._id }
  
//   swallowEntities(usersInView, layerCacheRef, layerIdx, myCoords, holeCoords)

//   placeEntity(hole, layerCacheRef, myCoords, layerIdx, diggingHole ? "update" : null)
//   if (diggingHole) setSelectedEntity([hole])
//   setMyCoords(prev => ({ ...prev }))
// }

const handlePlant = async ({ entity, myCoords, myCity, emissionView, sendAction }) => {
  const cityId = myCity?._id
  if (!cityId || !entity || !myCoords) return
  const tree = entity.t.tree
  const ref = groupEntityMap.plant[tree]
  const state = ref?.states?.["young"]
  if (!tree || !ref || !state) return 

  const currTime = Date.now()
  const newPlant = { grp: "plant", energy: 100, lastHitAt: currTime, dna: myCoords._id, 
  p: [myCoords.x, myCoords.y], t: tree, s: "young", createdAt: currTime, deadAt: null,
  ...( state.primary ? {primary: { count: 0, lastGenerated: currTime }} : {}), 
  ...( state.secondary ? {secondary: { count: 0, lastGenerated: currTime }} : {}) } 
  
  const savePayload = { action: "plant", myCoords, entity: newPlant, cityId, emissionView: emissionView.current  }
  // console.log(savePayload)
  const data = await sendAction(savePayload)
}

const handleRide = async ({ entity, myCoords, myCity, emissionView, sendAction }) => {
  const cityId = myCity?._id
  if (!cityId || !entity || entity?.rider || !myCoords) return
  const myStats = myCoords?.userStyleId?.stats
  if (myStats.energy <= 0 || myStats.health <= 0) return
  const { _id, userStyleId } = myCoords
  const newEntity = { ...entity, t: entity.t.name, ins: "ride-rest", insTime: Date.now(), dna: myCoords._id }
  const savePayload = { action: "ride", myCoords, entity: newEntity, cityId, emissionView: emissionView.current  }
  // console.log(savePayload)
  const data = await sendAction(savePayload)
}

const handleAnimalRideIns = async({ action, entity, myCoords, myCity, emissionView, sendAction }) => {
  if (entity.ins === action) return
  const cityId = myCity?._id
  if (!cityId || !entity || entity?.rider || !myCoords) return
  const myStats = myCoords?.userStyleId?.stats
  if ( myStats.health <= 0) return
  const newEntity = { ...entity, ins: action, insTime: Date.now() }
  const savePayload = { action, myCoords, entity: newEntity, cityId, emissionView: emissionView.current  }
  // return console.log(savePayload)
  const data = await sendAction(savePayload)
}

const handleAlight = async ({ entity, myCoords, myCity, emissionView, sendAction }) => {
  const cityId = myCity?._id
  if (!cityId || !entity || entity?.rider || !myCoords) return
  const myStats = myCoords?.userStyleId?.stats
  if (myStats.energy <= 0 || myStats.health <= 0) return
  const { _id, userStyleId } = myCoords
  const newP = [myCoords.x, myCoords.y]
  const newEntity = { ...entity, ins: "escape", insTime: Date.now(), base: newP, p: newP }
  const savePayload = { action: "alight", myCoords, entity: newEntity, cityId, emissionView: emissionView.current  }
  // console.log(savePayload)
  const data = await sendAction(savePayload)
}

const handleEat = async ({ entity, myCoords, myCity, emissionView, sendAction }) => {
  const cityId = myCity?._id
  if (!cityId || !entity || entity.energy <= 0 || !myCoords) return
  const myStats = myCoords?.userStyleId?.stats
  if (myStats.energy <= 0 || myStats.health <= 0) return

  const newEntity = { ...entity, t: entity.t.name }
  const ref = entity.t
  const nutrient = ref.states[entity.s].nutrient
  const bite = ref.bite
  const savePayload = { action: "eat", myCoords, entity: newEntity, bite, nutrient, cityId, emissionView: emissionView.current  }
  // console.log(savePayload)
  const data = await sendAction(savePayload)
}


// Actions Map
export const makeActionsMap = ({ myCoords, setMyCoords, layerCacheRef, layerIdx, usersInView, userActions, emitUserMovement, setActionTab, ridingEntityRef,
  inspect, setInspect, setSelectedEntity, setInspectTabMode, setAction, plots, sendAction, myCity, emissionView, holdingDamage, holdingWeight, plotMargins, groupEntityMap }) => ({
    collect: (action, entity) => handlePick({ action, entity, myCoords, setInspect, setInspectTabMode, sendAction, myCity, emissionView, layerCacheRef }),
    pick: (action, entity) => handlePick({ action, entity, myCoords, setInspect, setInspectTabMode, sendAction, myCity, emissionView, layerCacheRef}),
    drop: (action, entity) => handleDrop({ action, entity, myCoords, setInspect, setInspectTabMode, sendAction, myCity, emissionView, layerCacheRef }),
    escape: (action, entity) => handleEscape({ action, entity, myCoords, sendAction, myCity, emissionView, }),
    inspect: (action, entity) => handleInspect({ action, entity, inspect, setInspect }),
    hit: (action, entity) => handleHit({ action, myCoords, entity, layerCacheRef, layerIdx, plotMargins, holdingDamage, holdingWeight, sendAction, myCity, emissionView  }),
    dig: (action, entity) => handleDig({ action, entity, myCoords, layerCacheRef, layerIdx, setMyCoords, setSelectedEntity, plots, usersInView, setAction }),
    plant: (action, entity) => handlePlant({ entity, myCoords, myCity, emissionView, sendAction }),
    ride: (action, entity) => handleRide({ entity, myCoords, myCity, emissionView, sendAction }),
    "ride-walk": (action, entity) => handleAnimalRideIns({ action, entity, myCoords, myCity, emissionView, sendAction }),
    "ride-run": (action, entity) => handleAnimalRideIns({ action, entity, myCoords, myCity, emissionView, sendAction }),
    "ride-rest": (action, entity) => handleAnimalRideIns({ action, entity, myCoords, myCity, emissionView, sendAction }),
    alight: (action, entity) => handleAlight({ entity, myCoords, myCity, emissionView, sendAction }),
    eat: (action, entity) => handleEat({ entity, myCoords, myCity, emissionView, sendAction }),
})
