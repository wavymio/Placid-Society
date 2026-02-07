import React from 'react'
import { Badge } from './ui/badge'
import { IoIosArrowDown } from 'react-icons/io'
import { IoClose } from 'react-icons/io5'

const DropdownSelector = ({ buildingTypes, setOpenDropDown, openDropdown, searchInput, disabled, setSearchInput, selectedValue, setSelectedValue, error, setError }) => {
    const filteredBuildingTypes = buildingTypes.filter(building =>
        building.name.toLowerCase().includes(searchInput.toLowerCase())
    )

    return (
        <div className='relative w-[400px] h-14'>
            <div onClick={disabled ? () => null : !openDropdown ? () => setOpenDropDown(true) : () => null} 
            className={`border ${error === "buildingType" ? 'border-red-400' : 'border-neutral-800'} h-full w-[400px] rounded-lg cursor-pointer flex items-center text-white
            font-medium text-sm ${openDropdown ? 'pl-4' : 'px-4'} justify-between`}>
                {openDropdown ? (
                    <>
                    <input type="text" value={searchInput} onChange={(e) => setSearchInput(e.target.value)}
                    placeholder='Search for a building type...'
                    className='h-full w-[86%] text-sm bg-black outline-none pr-4 placeholder:text-sm placeholder:text-neutral-500' />
                    <button type='button' onClick={() => {
                        setSearchInput('')
                        setOpenDropDown(false)
                    }} className='bg-neutral-800 flex items-center justify-center h-full w-[14%] 
                    rounded-r-lg hover:bg-neutral-900 transition-all ease-in-out duration-500'>
                        <IoClose  className='h-4 w-4' />
                    </button>
                    </>
                ) : (
                    <>
                    {selectedValue ? <span className='flex items-center gap-4'>{selectedValue.name} 
                        <Badge  className={'h-8 text-white'}>Max Rooms | {selectedValue.maxRooms}</Badge>
                    </span> : "Select your Building Type"}
                    <span>
                        <IoIosArrowDown className={`h-4 w-4 font-extrabold ${openDropdown ? 'rotate-180' : 'rotate-0'}
                        transition-all ease-in-out duration-300`} />
                    </span>
                    </>
                )}
            </div>
            {openDropdown && (
                <div className='absolute top-16 w-full h-[240px]  rounded-lg overflow-y-auto border bg-black z-10 border-neutral-800'>
                    <div className='sticky bg-black top-0 w-full h-2'></div>
                    {filteredBuildingTypes.length > 0 ? filteredBuildingTypes.map((building, index) => (
                        <div key={index} onClick={() => {
                            setSelectedValue(building)
                            setOpenDropDown(false)
                            setError('')
                        }}
                        className={`h-14 w-full
                        transition-all ease-in-out duration-300 bg-black hover:bg-neutral-800 text-white text-sm font-medium
                        flex items-center px-4 gap-4 cursor-pointer`}>
                            {building.name}<Badge  className={'h-8 text-white'}>Max Rooms | {building.maxRooms}</Badge>
                        </div>
                    )) : (
                        <div className='w-[80%]] h-[90%] text-xs text-white font-semibold flex items-center
                        justify-center'>No Matching Results</div>
                    )}
                    <div className='sticky bg-black bottom-0 w-full h-2'></div>
                </div>
            )}
        </div>
    )
}

export default DropdownSelector
