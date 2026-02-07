import React, { useEffect } from 'react'
import { IoClose, IoPricetags } from 'react-icons/io5'
import BuildingTag from './BuildingTag'

const ApproveDenyBuildingTab = ({ mode, setMode, handleSubmit, comments, setComments, tags, setTags, isApproving, isDenying }) => {

    return (
        <div className={`flex items-center justify-center h-screen w-full bg-transparent backdrop-filter backdrop-blur-lg shadow-lg z-20 fixed left-0 top-0  transition-all duration-700 ease-in-out`}>
            <form onSubmit={handleSubmit} className='-mt-10 xs:mt-0 w-[250px] xs:w-[350px] sm:w-[470px] md:w-[550px] lg:w-[600px] h-[350px] xs:h-[250px] sm:h-[300px] relative bg-black border border-neutral-900 rounded-t-md rounded-b-2xl px-8 py-8 flex flex-col gap-3 items-center'>
                <button disabled={(isDenying || isApproving)} type="button" onClick={() => setMode(null)} className='h-8 w-8 rounded-lg absolute top-2 right-2 bg-red-950 flex items-center justify-center
                transition-all ease-in-out duration-300 hover:bg-red-900 cursor-pointer hover:scale-105'>
                    <IoClose className='text-white' />
                </button>

                {mode === "deny" && (
                    <textarea value={comments} onChange={(e) => setComments(e.target.value)}
                    className='border border-neutral-800 text-sm text-white h-[60%] w-[85%] mt-6 bg-black
                    rounded-lg outline-none px-4 py-4 placeholder:text-sm placeholder:text-white'
                    placeholder='State the reasons for your decision...' ></textarea>
                )}

                {mode === "approve" && (
                    <>
                    {tags.map((tag, index) => (
                        <BuildingTag key={index} outerIndex={index} tags={tags} setTags={setTags} />
                    ))}
                    <button type="button" disabled={tags && tags.length > 2} 
                    className={`${(tags && tags.length > 2) ? 'cursor-not-allowed hover:bg-neutral-950 bg-neutral-950' : 'hover:bg-neutral-800 bg-neutral-900'} 
                    h-10 text-xs rounded-lg w-[100px] font-semibold flex items-center justify-center gap-2
                     transition-all ease-in-out duration-300`} onClick={((tags.length > 0 && tags.some(value => value === '')) || (tags.length > 2)) ? () => null : () => setTags(prev => [...prev, ''])}>
                    <IoPricetags /> Add Tag </button>
                    <div className='text-xs text-neutral-600'>Add at least one tag to proceed</div>
                    </>
                )}

                <button type='submit' disabled={(isDenying || isApproving) ||(mode === "deny" && !comments) || (mode === "approve" && tags.length === 0) ||
                    (mode === "approve" && ((tags && tags.length > 3) || (tags.length === 1) && tags.some(value => value === '')))
                }
                className={`absolute bottom-0 right-0 font-semibold font-special
                border-white ${((mode === "deny" && !comments) || (mode === "approve" && tags.length === 0) ||
                    (mode === "approve" && ((tags && tags.length > 3) || (tags.length === 1) && tags.some(value => value === '')))) ? "bg-neutral-900 cursor-not-allowed" : "bg-neutral-800"}
                hover:bg-neutral-900 border flex items-center justify-center 
                transition-all ease-in-out duration-300 
                h-12 w-[150px] text-xs text-white rounded-lg`}>
                    {(isDenying || isApproving) ? (
                    <span className='loader'></span>
                    ) : `${mode.toUpperCase()}`}
                </button>
            </form>
        </div>
    )
}

export default ApproveDenyBuildingTab
