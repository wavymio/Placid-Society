export const handleOtherUserJoinEffect = (data, { usersInView }) => {
    // console.log("A user joined: ", data)
    if (usersInView.has(data._id)) return
    usersInView.set(data._id, data)
}

export const handleOtherUserMoveEffect = (data, { usersInView }) => {
    // console.log("A user moved: ", data)
    const { modifiedStats, ...payload } = data
    const theUser = usersInView.get(payload._id)
    if (theUser) {
        const theUserStats = theUser.userStyleId.stats
        const newUserCoords = { ...theUser, ...payload, userStyleId: { ...theUser.userStyleId, stats: { ...theUserStats, ...modifiedStats } } }
        return usersInView.set(payload._id, newUserCoords)
    }
}

export const handlePlotCreatedEffect = (data, { updatedFilteredPlots, layerCacheRef, finalPlots, setFilteredPlots, 
handleFetch, origin}) => {
    // console.log("Someone initialised a plot: ", data)
    // console.log("Current plots I can see: ", updatedFilteredPlots.fetchFilteredPlots)
    handleFetch(origin)
    const currentView = updatedFilteredPlots.fetchFilteredPlots
    layerCacheRef.current.set(data.id, { layers: data.layers })
    finalPlots[data.id - 1].modified = true
    if (currentView.includes(data.id)) {
        setFilteredPlots(prev => {
            return prev.map((plot) => {
                return plot.id === data.id ? { ...plot, modified: true, ...(layerCacheRef.current.get(plot.id)) } : plot
            })
        })
    }
}

export const handleCollectEffect = (data, { layerCacheRef, setMyCoords, myCoords, setSelectedEntity, usersInView=null, setInspect=null }) => {
    const { adding, updating, holding, otherUsersData } = data
    const userIsNotMe = otherUsersData._id !== myCoords._id
    const plotId = userIsNotMe ? otherUsersData.plotId : myCoords.plotId
    const layerIdx = userIsNotMe ? otherUsersData.layerIdx : myCoords.layerIdx
    const on = userIsNotMe ? otherUsersData.on : myCoords.on

    const myPlot = layerCacheRef.current.get(plotId)
    if (!myPlot) return

    const myLayer = myPlot.layers[layerIdx]

    if (adding?.userStyleId) {}
    const updatedLayer = {
        ...myLayer,
        entities: [ ...myLayer.entities.filter(e => e._id !== updating._id), updating, 
            ...((adding && !adding.userStyleId && adding.grp!=="earthly") ? [adding] : []),
        ],
        earthlies: (adding && adding.grp === "earthly") ? {
                        ...myLayer.earthlies, [on]: myLayer.earthlies[on].map(earthly => {
                            if (earthly.t === adding.t) return { ...earthly, q: adding.q }
                            else return earthly
                        })
                    } : myLayer.earthlies
    }
    myPlot.layers[layerIdx] = updatedLayer
    
    if (userIsNotMe) {
        setSelectedEntity(prev => (prev[0]._id === updating._id) ? [{ ...updating, t: prev[0].t }] : prev)
        setInspect(prev => (prev?._id === updating._id) ? { ...updating, t: prev.t } : prev)
        const theUser = usersInView.get(otherUsersData._id)
        if (theUser) return usersInView.set(otherUsersData._id, { ...theUser, holding })
    } else {
        setSelectedEntity(prev => [{ ...updating, t: prev[0].t }])
        setMyCoords(prev => ({ ...prev, holding }))
    }
}

export const handlePickEffect = (data, { layerCacheRef, myCoords, setMyCoords, usersInView=null, setCloseInspect, setInspect, 
setSelectedEntity, inspect }) => {
    const { adding, holding, updating, otherUsersData, mode, newUserStyle } = data
    if (!holding && !mode) return console.log("holding what?")
    const userIsNotMe = otherUsersData._id !== myCoords._id

    if (!mode) {
        const plotId = userIsNotMe ? otherUsersData.plotId : myCoords.plotId
        const layerIdx = userIsNotMe ? otherUsersData.layerIdx : myCoords.layerIdx
        const on = userIsNotMe ? otherUsersData.on : myCoords.on

        const myPlot = layerCacheRef.current.get(plotId)
        if (!myPlot) return

        const myLayer = myPlot.layers[layerIdx]

        if (adding?.userStyleId) {
            const theUser = usersInView.get(adding._id)
            if (theUser) usersInView.set(adding._id, { ...theUser, holding: null, held: null })
        }
        const updatedLayer = {
            ...myLayer,
            entities: [ ...myLayer.entities.filter(e => e._id !== holding._id && e._id !== updating?._id), 
                        ...((adding && !adding.userStyleId && adding.grp!=="earthly") ? [adding] : []),
                        ...(updating ? [updating] : []) ],
            earthlies: (adding && adding.grp === "earthly") ? {
                            ...myLayer.earthlies, [on]: myLayer.earthlies[on].map(earthly => {
                                if (earthly.t === adding.t) return { ...earthly, q: adding.q }
                                else return earthly
                            })
                        } : myLayer.earthlies
        }
        myPlot.layers[layerIdx] = updatedLayer
        console.log({updatedLayer})

        if ((!updating && holding._id === inspect?._id) || (updating && !updating.q && updating._id === inspect?._id)) {
            setCloseInspect(true)
        } else {
            setInspect(prev => {
                if (updating && prev?._id === updating?._id) {
                    return { ...updating, t: prev.t }
                }
                return prev
            })
        }
    }
    

    setSelectedEntity(prev => {
        if (updating && prev[0]?._id === updating?._id) {
            return [{ ...updating, t: prev[0].t }]
        }
        if (!updating && holding?._id === prev[0]?._id) {
            return []
        }
        return prev
    })

    console.log({ newUserStyle })
    if (userIsNotMe) {
        const theUser = usersInView.get(otherUsersData._id)
        if (theUser) return usersInView.set(otherUsersData._id, { ...theUser, holding, ...(mode ? { userStyleId: newUserStyle } : {}) })
    } else {        
        setMyCoords(prev => ({ ...prev, holding, ...(mode ? { userStyleId: newUserStyle } : {}) }))
    }
}

export const handleDropEffect = (data, { layerCacheRef, myCoords, setMyCoords, usersInView=null, setCloseInspect, setInspect } ) => {
    const { adding, holding, entityMultiple, otherUsersData } = data
    const userIsNotMe = otherUsersData._id !== myCoords._id
    const plotId = userIsNotMe ? otherUsersData.plotId : myCoords.plotId
    const layerIdx = userIsNotMe ? otherUsersData.layerIdx : myCoords.layerIdx

    const myPlot = layerCacheRef.current.get(plotId)
    if (!myPlot) return

    const myLayer = myPlot.layers[layerIdx]
    const updatedLayer = {
        ...myLayer,
        entities: [ ...myLayer.entities, adding ]
    }
    myPlot.layers[layerIdx] = updatedLayer

    if (userIsNotMe) {
        const theUser = usersInView.get(otherUsersData._id)
        if (theUser) return usersInView.set(otherUsersData._id, { ...theUser, holding })
    } else {
        setMyCoords(prev => ({ ...prev, holding }))
        if (entityMultiple) {
            if (holding  && holding.q && holding.q > 1) setInspect(prev => ({ ...holding, t: prev.t })) 
            else {
                setCloseInspect(true)
            }
        }
    }
}

export const handlePickEarthlyEffect = (data, { layerCacheRef, myCoords, setMyCoords, usersInView=null }) => {
    const { adding, holding, updating, otherUsersData } = data
    const userIsNotMe = otherUsersData._id !== myCoords._id
    const plotId = userIsNotMe ? otherUsersData.plotId : myCoords.plotId
    const layerIdx = userIsNotMe ? otherUsersData.layerIdx : myCoords.layerIdx
    const on = userIsNotMe ? otherUsersData.on : myCoords.on
    const myPlot = layerCacheRef.current.get(plotId)
    if (!myPlot) return
    
    const myLayer = myPlot.layers[layerIdx]
    
    if (adding?.userStyleId) {
        const theUser = usersInView.get(adding._id)
        if (theUser) usersInView.set(adding._id, { ...theUser, holding: null, held: null })
    }
    const updatedLayer = {
        ...myLayer,
        entities: [ ...myLayer.entities, 
                    ...((adding && !adding.userStyleId && adding.grp!=="earthly") ? [adding] : []),
                  ],
        earthlies:  {
                    ...myLayer.earthlies, [on]: myLayer.earthlies[on].map(earthly => {
                        if ((adding && adding.grp === "earthly") && earthly.t === adding?.t) return { ...earthly, q: adding.q }
                        if (updating && earthly.t === updating.t) return { ...earthly, q: updating.q }
                        else return earthly
                    })
                }
    }
    myPlot.layers[layerIdx] = updatedLayer

    if (userIsNotMe) {
        const theUser = usersInView.get(otherUsersData._id)
        if (theUser) return usersInView.set(otherUsersData._id, { ...theUser, holding })
    } else {        
        setMyCoords(prev => ({ ...prev, holding }))
    }
}

export const handleDropEarthlyEffect = (data, { layerCacheRef, myCoords, setMyCoords, usersInView=null }) => {
    const { adding, holding, otherUsersData } = data
    const userIsNotMe = otherUsersData._id !== myCoords._id
    const plotId = userIsNotMe ? otherUsersData.plotId : myCoords.plotId
    const layerIdx = userIsNotMe ? otherUsersData.layerIdx : myCoords.layerIdx
    const on = userIsNotMe ? otherUsersData.on : myCoords.on
    const myPlot = layerCacheRef.current.get(plotId)
    if (!myPlot) return
    
    const myLayer = myPlot.layers[layerIdx]

    if (adding) {
        const updatedLayer = {
            ...myLayer,
            earthlies:  {
                        ...myLayer.earthlies, [on]: myLayer.earthlies[on].map(earthly => {
                            if (earthly.t === adding.t) return { ...earthly, q: adding.q }
                            else return earthly
                        })
                    }
        }
        myPlot.layers[layerIdx] = updatedLayer
    }

    if (userIsNotMe) {
        const theUser = usersInView.get(otherUsersData._id)
        if (theUser) return usersInView.set(otherUsersData._id, { ...theUser, holding })
    } else {        
        setMyCoords(prev => ({ ...prev, holding }))
    }
}

export const handlePickUserEffect = (data, { layerCacheRef, myCoords, setMyCoords, usersInView=null }) => {
    const { adding, otherUserAdding, holding, otherUserHolding, otherUsersData } = data
    const userIsNotMe = otherUsersData._id !== myCoords._id
    const plotId = userIsNotMe ? otherUsersData.plotId : myCoords.plotId
    const layerIdx = userIsNotMe ? otherUsersData.layerIdx : myCoords.layerIdx
    const on = userIsNotMe ? otherUsersData.on : myCoords.on
    const myPlot = layerCacheRef.current.get(plotId)
    if (!myPlot) return
    
    const myLayer = myPlot.layers[layerIdx]
    
    const usersForLoop = []
    if (adding?.userStyleId) usersForLoop.push(adding._id)
    if (otherUserAdding?.userStyleId) usersForLoop.push(otherUserAdding._id)
    for (let x = 0; x < usersForLoop.length; x++) {
        const userId = usersForLoop[x]
        const theUser = usersInView.get(userId)
        if (theUser) usersInView.set(userId, { ...theUser, holding: null, held: null })
    }

    const updatedLayer = {
        ...myLayer,
        entities: [ ...myLayer.entities, 
                    ...((adding && !adding.userStyleId && adding.grp!=="earthly") ? [adding] : []),
                    ...((otherUserAdding && !otherUserAdding.userStyleId && otherUserAdding.grp!=="earthly") ? [otherUserAdding] : []),
                  ],
        earthlies:  {
                    ...myLayer.earthlies, [on]: myLayer.earthlies[on].map(earthly => {
                        if ((otherUserAdding && otherUserAdding.grp === "earthly") && earthly.t === otherUserAdding?.t) return { ...earthly, q: otherUserAdding.q }
                        if ((adding && adding.grp === "earthly") && earthly.t === adding?.t) return { ...earthly, q: adding.q }
                        else return earthly
                    })
                }
    }
    myPlot.layers[layerIdx] = updatedLayer

    if (myCoords._id === holding._id) {
        setMyCoords(prev => ({ ...prev, ...otherUserHolding }))
    } else {
        const thePickedUser = usersInView.get(holding._id)
        if (thePickedUser) usersInView.set(holding._id, { ...thePickedUser, ...otherUserHolding })
    }

    if (userIsNotMe) {
        const theUser = usersInView.get(otherUsersData._id)
        if (theUser) return usersInView.set(otherUsersData._id, { ...theUser, holding })
    } else {        
        setMyCoords(prev => ({ ...prev, holding }))
    }
}

export const handleDropUserEffect = (data, { layerCacheRef, myCoords, setMyCoords, usersInView=null }) => {
    const { adding, holding, otherUsersData } = data
    const userIsNotMe = otherUsersData._id !== myCoords._id

    if (myCoords._id === adding._id) {
        setMyCoords(prev => ({ ...prev, held: null }))
    } else {
        const thePickedUser = usersInView.get(adding._id)
        if (thePickedUser) usersInView.set(adding._id, { ...thePickedUser, held: null })
    }

    if (userIsNotMe) {
        const theUser = usersInView.get(otherUsersData._id)
        if (theUser) return usersInView.set(otherUsersData._id, { ...theUser, holding })
    } else {        
        setMyCoords(prev => ({ ...prev, holding }))
    }
}

export const handleEscapedUserEffect = (data, { layerCacheRef, myCoords, setMyCoords, usersInView=null }) => {
    const { adding, holder, otherUsersData } = data
    const userIsNotMe = otherUsersData._id !== myCoords._id

    if (userIsNotMe) {
        const theEscapedUser = usersInView.get(adding._id)
        if (theEscapedUser) usersInView.set(adding._id, { ...theEscapedUser, held: null })
    } else {
        setMyCoords(prev => ({ ...prev, held: null }))
    }

    if (holder === myCoords._id) {
        setMyCoords(prev => ({ ...prev, holding: null }))
    } else {        
        const theUser = usersInView.get(holder)
        if (theUser) return usersInView.set(holder, { ...theUser, holding: null })
    }
}

export const handleHitUserEffect = (data, { layerCacheRef, myCoords, setMyCoords, usersInView=null }) => {
    const { attacker, defender } = data
    if (!attacker || !defender) return
    const attackerIsMe = myCoords._id === attacker._id
    const defenderIsMe = myCoords._id === defender._id

    if (attackerIsMe) setMyCoords(prev => ({ ...prev, animation: attacker.animation, userStyleId: { ...prev.userStyleId, stats: attacker.stats } }))
    else { 
        const theUser = usersInView.get(attacker._id)
        if (theUser) usersInView.set(attacker._id, { ...theUser, animation: attacker.animation, userStyleId: { ...theUser.userStyleId, stats: attacker.stats } })
    }

    if (defenderIsMe) setMyCoords(prev => ({ ...prev, userStyleId: { ...prev.userStyleId, stats: defender.stats } }))
    else { 
        const theUser = usersInView.get(defender._id)
        if (theUser) usersInView.set(defender._id, { ...theUser, userStyleId: { ...theUser.userStyleId, stats: defender.stats } })
    }
}

export const handleHitEntityEffect = (data, { layerCacheRef, myCoords, setMyCoords, usersInView=null, setCloseInspect, setInspect, 
setSelectedEntity, inspect }) => {
    const { otherUsersData, animation, mainRider } = data
    let updating = data.updating
    const { stats } = otherUsersData
    if (!updating || !stats) return console.log("updating what?")
    const userIsNotMe = otherUsersData._id !== myCoords._id
    const plotId = userIsNotMe ? otherUsersData.plotId : myCoords.plotId
    const layerIdx = userIsNotMe ? otherUsersData.layerIdx : myCoords.layerIdx

    const myPlot = layerCacheRef.current.get(plotId)
    if (!myPlot) return

    const myLayer = myPlot.layers[layerIdx]

    if (!mainRider) {
        let theAnimal
        if (updating.grp === "animal") {
            theAnimal = myLayer.entities.find(e => e._id === updating._id)
            if (!theAnimal) return
            const animalRoaming = ["roam", "escape"].includes(theAnimal.ins)
            updating = animalRoaming ? { ...theAnimal, energy: updating.energy } : updating
        }

        const updatedLayer = {
            ...myLayer,
            entities: [ ...myLayer.entities.filter(e => e._id !== updating._id), updating ],
        }
        myPlot.layers[layerIdx] = updatedLayer
    } else {
        const riderIsNotMe = mainRider._id !== myCoords._id
        if (riderIsNotMe) {
            const theUser = usersInView.get(mainRider._id)
            if (theUser) usersInView.set(mainRider._id, { ...theUser, riding: updating })
        } else {
            setMyCoords(prev => ({ ...prev, riding: updating }))
        }
    }    

    setSelectedEntity(prev => {
        if (prev[0]?._id === updating._id) {
            // console.log("New selected entity: ", { ...updating, t: prev[0].t, ...(mainRider ? { mainRider } : {}) })
            return [{ ...updating, t: prev[0].t, ...(mainRider ? { mainRider } : {}) }]
        }
        return prev
    })

    if (((!updating.primary || !updating.secondary) && !updating.q && updating._id === inspect?._id)) {
        setCloseInspect(true)
    } else {
        setInspect(prev => {
            if (prev?._id === updating._id) {
                return { ...updating, t: prev.t }
            }
            return prev
        })
    }

    if (userIsNotMe) {
        const theUser = usersInView.get(otherUsersData._id)
        if (theUser) usersInView.set(otherUsersData._id, { ...theUser, animation, userStyleId: { ...theUser.userStyleId, stats } })
    } else {
        setMyCoords(prev => ({ ...prev, animation, userStyleId: { ...prev.userStyleId, stats } }))
    }
}

export const handleHitDestroyEffect = (data, { layerCacheRef, myCoords, setMyCoords, usersInView=null, setCloseInspect, setInspect, 
setSelectedEntity, inspect }) => { 
    const { adding, removing, otherUsersData, animation, mainRider } = data
    const { stats } = otherUsersData
    if ((!removing && !mainRider) || !stats) return console.log("removing what?")
    const userIsNotMe = otherUsersData._id !== myCoords._id
    const plotId = userIsNotMe ? otherUsersData.plotId : myCoords.plotId
    const layerIdx = userIsNotMe ? otherUsersData.layerIdx : myCoords.layerIdx

    const myPlot = layerCacheRef.current.get(plotId)
    if (!myPlot) return

    const myLayer = myPlot.layers[layerIdx]

    const updatedLayer = {
        ...myLayer,
        entities: [ 
            ...(mainRider ? myLayer.entities : myLayer.entities.filter(e => e._id !== removing?._id)), 
            ...(adding && adding?.length > 0 ? adding : []) 
        ],
    }
    myPlot.layers[layerIdx] = updatedLayer

    setSelectedEntity(prev => {
        if (prev[0]?._id === (removing?._id ?? mainRider.riding._id)) {
            return []
        }
        return prev
    })

    if (((removing?._id ?? mainRider.riding._id) === inspect?._id)) {
        setCloseInspect(true)
    }

    if (mainRider) {
        const riderIsNotMe = mainRider._id !== myCoords._id
        if (riderIsNotMe) {
            const theUser = usersInView.get(mainRider._id)
            if (theUser) usersInView.set(mainRider._id, { ...theUser, riding: null })
        } else {
            setMyCoords(prev => ({ ...prev, riding: null }))
        }
    }

    if (userIsNotMe) {
        const theUser = usersInView.get(otherUsersData._id)
        if (theUser) usersInView.set(otherUsersData._id, { ...theUser, animation, userStyleId: { ...theUser.userStyleId, stats } })
    } else {
        setMyCoords(prev => ({ ...prev, animation, userStyleId: { ...prev.userStyleId, stats } }))
    }
}

export const handleRideEffect = (data, { layerCacheRef, myCoords, setMyCoords, usersInView=null, setCloseInspect, setInspect, 
setSelectedEntity, inspect, setRidingAction, ridingEntityRef }) => { 
    const { removing, otherUsersData } = data
    if (!removing) return console.log("updating what?")
    const userIsNotMe = otherUsersData._id !== myCoords._id
    const plotId = userIsNotMe ? otherUsersData.plotId : myCoords.plotId
    const layerIdx = userIsNotMe ? otherUsersData.layerIdx : myCoords.layerIdx

    const myPlot = layerCacheRef.current.get(plotId)
    if (!myPlot) return

    const myLayer = myPlot.layers[layerIdx]

    const updatedLayer = {
        ...myLayer,
        entities: [ ...myLayer.entities.filter(e => e._id !== removing._id) ],
    }
    myPlot.layers[layerIdx] = updatedLayer

    setSelectedEntity(prev => {
        if (prev[0]?._id === removing._id) {
            return []
        }
        return prev
    })

    if (removing._id === inspect?._id) {
        setCloseInspect(true)
    }

    if (userIsNotMe) {
        const theUser = usersInView.get(otherUsersData._id)
        if (theUser) usersInView.set(otherUsersData._id, { ...theUser, riding: removing, x: removing.p[0], y: removing.p[1], facing: removing.f })
    } else {
        setRidingAction(removing.ins)
        ridingEntityRef.current = removing
        setMyCoords(prev => ({ ...prev, riding: removing, x: removing.p[0], y: removing.p[1], facing: removing.f }))
    }
}

export const handleRideInsEffect = (data, { layerCacheRef, myCoords, setMyCoords, usersInView=null, setCloseInspect, setInspect, 
setSelectedEntity, inspect, setRidingAction, ridingEntityRef }) => { 
    const { updating, otherUsersData } = data
    if (!updating) return console.log("updating what?")
    const userIsNotMe = otherUsersData._id !== myCoords._id
    const plotId = userIsNotMe ? otherUsersData.plotId : myCoords.plotId

    const myPlot = layerCacheRef.current.get(plotId)
    if (!myPlot) return


    setSelectedEntity(prev => {
        if (prev[0]?._id === updating._id) {
            return [{ ...prev, t: prev[0].t, ...updating }]
        }
        return prev
    })

    if (userIsNotMe) {
        const theUser = usersInView.get(otherUsersData._id)
        if (theUser) usersInView.set(otherUsersData._id, { ...theUser, riding: {...theUser.riding, ...updating} })
    } else {
        setRidingAction(updating.ins)
        ridingEntityRef.current = { ...ridingEntityRef.current, ...updating }
        setMyCoords(prev => ({ ...prev, riding: {...prev.riding, ...updating} }))
    }
}

export const handleAlightEffect = (data, { layerCacheRef, myCoords, setMyCoords, usersInView=null, setCloseInspect, setInspect, 
setSelectedEntity, inspect, setRidingAction, ridingEntityRef }) => { 
    const { adding, otherUsersData } = data
    if (!adding) return console.log("updating what?")
    const userIsNotMe = otherUsersData._id !== myCoords._id
    const plotId = userIsNotMe ? otherUsersData.plotId : myCoords.plotId
    const layerIdx = userIsNotMe ? otherUsersData.layerIdx : myCoords.layerIdx

    const myPlot = layerCacheRef.current.get(plotId)
    if (!myPlot) return

    const myLayer = myPlot.layers[layerIdx]

    const updatedLayer = {
        ...myLayer,
        entities: [ ...myLayer.entities, adding ],
    }
    myPlot.layers[layerIdx] = updatedLayer
    setSelectedEntity(prev => {
        if (prev[0]?._id === adding._id) {
            return [{ ...adding, t: prev[0].t }]
        }
        return prev
    })

    if (adding._id === inspect?._id) {
        setCloseInspect(true)
    }

    if (userIsNotMe) {
        const theUser = usersInView.get(otherUsersData._id)
        if (theUser) usersInView.set(otherUsersData._id, { ...theUser, riding: null })
    } else {
        setRidingAction(null)
        ridingEntityRef.current = null
        setMyCoords(prev => ({ ...prev, riding: null }))
    }
}