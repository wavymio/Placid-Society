import React from 'react'
import ReactDOM from 'react-dom/client'
import './global.css'
import AppRoutes from './AppRoutes'
import { BrowserRouter as Router } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from 'react-query'
import { ToastProvider } from './contexts/ToastContext'
import { AuthProvider } from './contexts/AuthContext'
import { SocketProvider } from './contexts/SocketContext'
import { LoadingProvider } from './contexts/LoadingContext'
import { PlayPauseProvider } from './contexts/PlayPauseContext'
import { RoomEventsProvider } from './contexts/RoomEventsContext'
import { CityProvider } from './contexts/CityContext'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false
    }
  }
})


ReactDOM.createRoot(document.getElementById('root')).render(
  // <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <AuthProvider>
          <SocketProvider>
            <CityProvider>
              <RoomEventsProvider>
                <LoadingProvider>
                  <PlayPauseProvider>
                    <Router>
                      <AppRoutes />
                    </Router>
                  </PlayPauseProvider>
                </LoadingProvider>
              </RoomEventsProvider>
            </CityProvider>
          </SocketProvider>
        </AuthProvider>
      </ToastProvider>
    </QueryClientProvider>
  // </React.StrictMode>,
)
