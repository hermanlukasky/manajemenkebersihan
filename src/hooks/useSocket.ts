'use client'

import { useEffect, useRef } from 'react'
import { io, Socket } from 'socket.io-client'
import { API_CONFIG } from '@/lib/api-config'

export const useSocket = (role?: string, userId?: string) => {
  const socketRef = useRef<Socket | null>(null)

  useEffect(() => {
    // Get WebSocket URL from API_CONFIG
    const wsUrl = API_CONFIG.getWebSocketUrl()
    
    // Initialize socket connection
    socketRef.current = io(wsUrl, {
      transports: ['websocket', 'polling'],
    })

    const socket = socketRef.current

    // Connection events
    socket.on('connect', () => {
      console.log('Connected to server via WebSocket')
      
      // Join room based on role
      if (role) {
        socket.emit('join-room', role)
      }
      
      // Join personal room for specific notifications
      if (userId && role === 'pegawai') {
        socket.emit('join-room', `pegawai-${userId}`)
      }
    })

    socket.on('disconnect', () => {
      console.log('Disconnected from server')
    })

    socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error)
      console.log('WebSocket URL:', wsUrl)
    })

    // Cleanup on unmount
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect()
        socketRef.current = null
      }
    }
  }, [role, userId])

  // Return socket instance and helper functions
  return {
    socket: socketRef.current,
    emit: (event: string, data: any) => {
      if (socketRef.current) {
        socketRef.current.emit(event, data)
      }
    },
    on: (event: string, callback: (data: any) => void) => {
      if (socketRef.current) {
        socketRef.current.on(event, callback)
      }
    },
    off: (event: string, callback?: (data: any) => void) => {
      if (socketRef.current) {
        socketRef.current.off(event, callback)
      }
    }
  }
}