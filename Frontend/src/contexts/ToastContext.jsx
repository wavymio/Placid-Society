import React, { createContext, useContext, useState } from 'react'
import Toast from '../components/Toast'

const ToastContext = createContext()

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([])

  const addToast = (type, message) => {
    const id = Date.now()
    setToasts(prevToasts => [...prevToasts, { id, type, message }])
    setTimeout(() => {
        removeToast(id)
    }, 5000)
  }

  const removeToast = (id) => {
    setToasts(toasts.filter(toast => toast.id !== id))
  }

  return (
    <ToastContext.Provider value={{addToast}}>
      {children}
      <div className="sm:w-auto p-0 w-full fixed z-50 top-0 right-0 sm:top-5 sm:right-5 flex flex-col gap-3">
        {toasts.map(toast => (
          <Toast
            key={toast.id}
            type={toast.type}
            message={toast.message}
            onClose={() => removeToast(toast.id)}
          />
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export const useToast = () => useContext(ToastContext)
