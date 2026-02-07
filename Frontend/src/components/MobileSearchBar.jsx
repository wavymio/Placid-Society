import React, { useState } from 'react'
import { FaSearch } from "react-icons/fa"
import SearchBar from './SearchBar'


const MobileSearchBar = () => {
    const [clicked, setClicked] = useState(false)

    return (
        <div>
            <div onClick={() => setClicked(!clicked)} className='h-7 w-7 xs:h-10 xs:w-10 md:h-auto md:w-auto bg-neutral-800 rounded-lg flex items-center justify-center hover:bg-neutral-900 transition-colors duration-300  ease-in-out cursor-pointer p-1'>
                <FaSearch />
            </div> 
            
            {clicked && (
                <div>
                    <SearchBar />
                </div>
            )}
        </div>
    )
}

export default MobileSearchBar
