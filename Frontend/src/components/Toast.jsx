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
    <div onClick={onClose} className={`opacity-100 z-[99999999999] m-0 backdrop-filter backdrop-blur-lg border-none sm:border-l-2 sm:border-b-0 relative sm:min-w-52 w-full flex justify-left items-center gap-3 p-6 text-md rounded-b-lg sm:rounded-lg shadow-lg text-white ${getBackgroundColor(type)} animate-fade-in-out`}>
      <span className={`font-bold flex items-center gap-2 text-sm tracking-normal font-heading ${getButtonColor(type)}`}>{getIcon()} {message}</span>
      <IoIosCloseCircle onClick={onClose} className={`font-bold text-xl absolute top-1 right-1 cursor-pointer transition-transform transform hover:scale-110 ${getButtonColor(type)}`} />
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
