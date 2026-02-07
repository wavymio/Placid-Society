// import toolShed from '../assets/tool shed.png'
// import animalShed from '../assets/animal shed.png'
// import woodShed from '../assets/wood shed.png'
// import smokeHouse from '../assets/smoke house.png'
// import barn from '../assets/barn.png'
// import kitchen from '../assets/kitchen.png'


// export const roomTypes = {
//     "rusticKitchen": {
//         type: "rustic smoke house",
//         group: "kitchen",
//         pictureUrl: kitchen,
//         size: 150,
//     },
//     "rusticSmokeHouse": {
//         type: "rustic smoke house",
//         group: "smoke house",
//         pictureUrl: smokeHouse,
//         size: 100,
//     },
//     "rusticWoodShed": {
//         type: "rustic wood shed",
//         group: "wood shed",
//         pictureUrl: woodShed,
//         size: 80
//     }, 
//     "rusticBarn": {
//         type: "rustic barn",
//         group: "barn",
//         pictureUrl: barn,
//         size: 170
//     },
//     "rusticToolShed": {
//         type: "rustic tool shed",
//         group: "tool shed",
//         pictureUrl: toolShed,
//         size: 120,
//     }, 
//     "rusticAnimalShed": {
//         type: "rustic animal shed",
//         group: "animal shed",
//         pictureUrl: animalShed,
//         size: 130,
//     }, 

// }  

export function isItemVisible(itemX, itemY, plotX, plotY, viewport, scale, itemHeight, itemWidth) {
    const tanSkew = Math.tan(-30 * Math.PI / 180)
    const skewedPlotX = plotX + tanSkew * (itemY - itemHeight)

    const itemLeft = (skewedPlotX + (itemX - itemWidth)) * scale
    const itemTop = (plotY + (itemY - itemHeight)) * scale
    const itemRight = (skewedPlotX + itemX) * scale
    const itemBottom = (plotY + itemY) * scale

    const viewportLeft = viewport.x
    const viewportTop = viewport.y
    const viewportRight = viewport.x + (viewport.width/2)
    const viewportBottom = viewport.y + (viewport.height/2)
    
    const lXBuffer = 0
    const rXBuffer = 0
    const yBuffer = 0

    const horizontallyVisible =
        itemRight >= viewportLeft - lXBuffer &&
        itemLeft <= viewportRight + rXBuffer;

    const verticallyVisible =
        itemBottom >= viewportTop - yBuffer &&
        itemTop <= viewportBottom + yBuffer;

    return horizontallyVisible && verticallyVisible;
}