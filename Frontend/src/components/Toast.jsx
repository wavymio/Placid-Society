import React from 'react'
import { FaCheckCircle, FaExclamationCircle, FaInfoCircle } from 'react-icons/fa'
import { IoIosCloseCircle } from "react-icons/io"

const Toast = ({ type, message, onClose }) => {
  const getIcon = () => {
    switch (type) {
      case 'success':
        return <FaCheckCircle className="text-white" />
      case 'error':
        return <FaExclamationCircle className="text-red200" />
      default:
        return <FaInfoCircle className="text-white-500" />
    }
  }

  return (
    <div onClick={onClose} className={`opacity-100 z-[99999999999] m-0 backdrop-filter backdrop-blur-lg border-none sm:border-l-2 sm:border-b-0 
    absolute top-0 left-0 w-full flex justify-center items-center h-[7vh] text-md shadow-lg ${getBackgroundColor(type)} animate-fade-in-out`}>
      <span className={`font-bold flex items-center gap-2 text-xs tracking-normal font-heading ${getButtonColor(type)}`}>{getIcon()} {message ?? "Server Down. Try again later"}</span>
      {/* <IoIosCloseCircle onClick={onClose} className={`font-bold text-xl absolute top-1 right-1 cursor-pointer transition-transform transform hover:scale-110 ${getButtonColor(type)}`} /> */}
    </div>
  )
}

const getBackgroundColor = (type) => {
  switch (type) {
    case 'success':
      return 'bg-neutral-900 border-white'
    case 'error':
      return 'bg-neutral-900 border-red-200'
    default:
      return 'bg-neutral-900 border-blue-500'
  }
}

const getButtonColor = (type) => {
  switch (type) {
    case 'success':
      return 'text-white'
    case 'error':
      return 'text-red-200'
    default:
      return 'text-blue-500'
  }
}

export default Toast
