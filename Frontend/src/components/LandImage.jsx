import React from 'react'

const LandImage = React.memo(({ src }) => {
    return (
        <img src={src} loading="lazy" className='h-[50%] w-[50%]' />
    )
})

export default LandImage
