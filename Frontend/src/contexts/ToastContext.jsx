import React, { createContext, useContext, useEffect, useState } from 'react'
import Toast from '../components/Toast'

const ToastContext = createContext()

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState(null)

  const addToast = (type, message) => {
    setToasts(prevToasts => prevToasts?.message === message ? prevToasts : { type, message })
    setTimeout(() => {
        removeToast()
    }, 5000)
  }

  const removeToast = () => {
    setToasts(null)
  }

  return (
    <ToastContext.Provider value={{addToast}}>
      {children}
        {toasts && (
          <Toast
            type={toasts.type}
            message={toasts.message}
            onClose={() => removeToast()}
          />
        )}
    </ToastContext.Provider>
  )
}

export const useToast = () => useContext(ToastContext)
