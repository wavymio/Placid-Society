import React from 'react'
import creamcottonshirt from '../assets/creamcottonshirt.png'
import brownfursleeve from '../assets/brownfursleeve.png'
import royalblacksleeve from '../assets/royalblacksleeve.png'
import royalblacktorso from '../assets/royalblacktorso.png'
import curlyblonde from '../assets/curlyblonde.png'
import longwavyblonde from '../assets/longwavyblonde.png'
import ClothPart from './ClothPart'
import UserStyle from './UserStyle'

const UserMarker = ({ myCoords, userRef, plot }) => {
    return (
        <UserStyle myCoords={myCoords} userRef={userRef} plot={plot} />
    )
}

// fire
// const UserMarker = ({ x, y, userRef, plot }) => {
//     return (
//         <div ref={userRef}
//         className="absolute w-[65px] h-[65px] rounded-full z-500 opacity-5"
            
//         style={{
//             position: 'absolute',
//             transform: 'skewX(30deg)',
//             zIndex: 3000000,
//             // zIndex: y + 1 + 25,
//             left: `${x}px`,
//             top: `${y}px`,
//             transition: 'top 0.19s ease, left 0.19s ease',
//             opacity: plot.waterPatch ? 0.05 : 100,
//             background: 'radial-gradient(circle, rgba(255, 200, 100, 0.5), transparent 100%)',
//             filter: 'blur(8px)',
//             mixBlendMode: 'screen'
//         }}
//         />
//     )
// }
export default UserMarker
