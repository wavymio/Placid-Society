import React, { useEffect, useState } from 'react'
import { IoClose, IoPricetags } from 'react-icons/io5'

const BuildingTag = ({ outerIndex, tags, setTags }) => {
    const [tagName, setTagName] = useState(tags[outerIndex])

    const removeTag = () => {
        setTags(prev => prev.filter((name, index) => index !== outerIndex))
    }

    useEffect(() => {
        setTags(prev => prev.map((name, index) => {
            if (index === outerIndex) {
                return tagName
            } else {
                return name
            }
        }))
    }, [tagName])

    useEffect(() => {
        setTagName(tags[outerIndex])
    }, [tags])

    return (
        <div className='flex items-center h-10 rounded-xl'>
            <div className='h-full w-10 rounded-l-xl bg-primary flex items-center justify-center'><IoPricetags className='h-3 w-3' /></div>
            <input value={tagName} onChange={(e) => setTagName(e.target.value)}
            type="text" className={`w-32 border-x-none border-y-1 border-y-neutral-900 border-x-none h-full bg-black outline-none text-xs
            placeholder:text-xs placeholder:text-neutral-700 flex items-center px-2`} placeholder='Tag Name' />
            <button onClick={removeTag}
            className='h-full w-10 rounded-r-xl bg-neutral-900 flex items-center justify-center cursor-pointer
            transition-all ease-in-out duration-300 hover:bg-neutral-800'><IoClose className='h-4 w-4' /></button>
        </div>
    )
}

export default BuildingTag
