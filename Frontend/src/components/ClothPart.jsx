import React from 'react'

const ClothPart = ({s, p}) => {
    return (
        <div style={{
            width: "100%",
            height: "100%",
            backgroundImage: `url(${p})`,
            backgroundSize: s,
            backgroundRepeat: "no-repeat",
            backgroundPosition: "top center",
        }}></div>
    )
}

export default ClothPart
