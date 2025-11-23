'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { io, Socket } from 'socket.io-client'
import { useAuthStore } from '@/lib/stores/auth-store'

interface WebSocketContextType {
  socket: Socket | null
  connected: boolean
  emit: (event: string, data?: any) => void
  on: (event: string, callback: (data: any) => void) => void
  off: (event: string, callback?: (data: any) => void) => void
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined)

export function useWebSocket() {
  const context = useContext(WebSocketContext)
  if (!context) {
    throw new Error('useWebSocket must be used within a WebSocketProvider')
  }
  return context
}

interface WebSocketProviderProps {
  children: ReactNode
}

export function WebSocketProvider({ children }: WebSocketProviderProps) {
  const [socket, setSocket] = useState<Socket | null>(null)
  const [connected, setConnected] = useState(false)
  const { user, token } = useAuthStore()

  useEffect(() => {
    // WebSockets are not supported on Vercel Serverless. 
    // Disabling connection to prevent errors.
    console.log('WebSockets disabled for Vercel deployment')
    setConnected(false)
    return

    /* 
    if (!token) {
      // Disconnect socket if no token
      if (socket) {
        socket.disconnect()
        setSocket(null)
        setConnected(false)
      }
      return
    }

    const isProduction = process.env.NODE_ENV === 'production'
    // Fallback to hardcoded production URL if env var is missing
    const productionUrl = 'wss://scam-dunk-production.vercel.app'
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || (isProduction ? productionUrl : 'ws://localhost:3001')
    const newSocket = io(wsUrl, {
      auth: {
        token,
      },
      transports: ['websocket', 'polling'],
      autoConnect: true,
    })

    newSocket.on('connect', () => {
      console.log('WebSocket connected')
      setConnected(true)
    })

    newSocket.on('disconnect', () => {
      console.log('WebSocket disconnected')
      setConnected(false)
    })

    newSocket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error)
      setConnected(false)
    })

    setSocket(newSocket)

    return () => {
      newSocket.disconnect()
    }
    */
  }, [token])

  const emit = (event: string, data?: any) => {
    if (socket && connected) {
      socket.emit(event, data)
    }
  }

  const on = (event: string, callback: (data: any) => void) => {
    if (socket) {
      socket.on(event, callback)
    }
  }

  const off = (event: string, callback?: (data: any) => void) => {
    if (socket) {
      socket.off(event, callback)
    }
  }

  const value = {
    socket,
    connected,
    emit,
    on,
    off,
  }

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  )
}