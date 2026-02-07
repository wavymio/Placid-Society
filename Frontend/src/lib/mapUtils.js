export const scaleAndMovePath = (path, scaleFactor, dx, dy) => {
    return path.replace(/([ML])([0-9.-]+),([0-9.-]+)/g, (match, command, x, y) => {
      const newX = parseFloat(x) * scaleFactor + dx
      const newY = parseFloat(y) * scaleFactor + dy
      return `${command}${newX},${newY}`
    })
}

export const updateDimensions = (ref, setDimensions) => {
    if (ref.current) {
        return setDimensions({
            width: window.innerWidth,
            height: window.innerHeight,
        })
        // return setDimensions({
        //     width: ref.current.clientWidth,
        //     height: ref.current.clientHeight,
        // })
    }
    console.log("New Dimensions: ", {
        width: ref.current.clientWidth,
        height: ref.current.clientHeight,
    })
}

export const handleZoomStop = (setScale, navigate, location, transformRef, zoomType, continentScale=0) => {
    const {state: transformState} = transformRef
    const currentScale = transformState.scale
    setScale(currentScale)
    console.log("Current scale:", currentScale)
    if (zoomType === "countryZoomOut" && currentScale <= 0.9) {
        navigate(location)
    }

    if (zoomType === "continentZoomOut" && currentScale <= 0.8) {
        navigate(location)
    }

    if (zoomType === "continentZoomIn" && currentScale >= 3.5) {
        navigate(location)
    }

    if (zoomType === "worldZoomIn" && currentScale >= continentScale + 0.5) {
        navigate(location)
    }
}

export const countryColour = "rgba(255, 255, 255, 0.15)"
export const countryColour2 = "rgba(0, 0, 0, 0.15)"
export const countryColour3 = "rgba(255, 255, 255, 0.35)"