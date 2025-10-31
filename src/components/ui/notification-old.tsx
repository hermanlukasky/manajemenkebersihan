'use client'

import { useState, useEffect } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Bell, X, CheckCircle, AlertCircle, Info } from 'lucide-react'
import { useSocket } from '@/hooks/useSocket'

interface Notification {
  id: string
  type: 'laporan_baru' | 'jadwal_update' | 'laporan_verified' | 'location_update'
  message: string
  data?: any
  timestamp: string
  read: boolean
}

export function NotificationSystem({ role, userId }: { role: string; userId?: string }) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const { socket, on } = useSocket(role, userId)

  useEffect(() => {
    if (!socket) return

    // Listen for notifications
    on('notification', (data: any) => {
      const newNotification: Notification = {
        id: Date.now().toString(),
        type: data.type,
        message: data.message,
        data: data.data,
        timestamp: data.timestamp,
        read: false
      }
      
      setNotifications(prev => [newNotification, ...prev])
    })

    on('laporan_verified', (data: any) => {
      const newNotification: Notification = {
        id: Date.now().toString(),
        type: 'laporan_verified',
        message: data.message,
        data: data.data,
        timestamp: data.timestamp,
        read: false
      }
      
      setNotifications(prev => [newNotification, ...prev])
    })

    on('jadwal_update', (data: any) => {
      const newNotification: Notification = {
        id: Date.now().toString(),
        type: 'jadwal_update',
        message: data.message,
        data: data.data,
        timestamp: data.timestamp,
        read: false
      }
      
      setNotifications(prev => [newNotification, ...prev])
    })
  }, [socket, on])

  const unreadCount = notifications.filter(n => !n.read).length

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    )
  }

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'laporan_baru':
        return <AlertCircle className="h-4 w-4 text-blue-500" />
      case 'laporan_verified':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'jadwal_update':
        return <Info className="h-4 w-4 text-yellow-500" />
      default:
        return <Bell className="h-4 w-4 text-gray-500" />
    }
  }

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 1) return 'Baru saja'
    if (diffInMinutes < 60) return `${diffInMinutes} menit lalu`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} jam lalu`
    return `${Math.floor(diffInMinutes / 1440)} hari lalu`
  }

  return (
    <div className="relative">
      {/* Notification Bell */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="relative"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <Badge 
            variant="destructive" 
            className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </Badge>
        )}
      </Button>

      {/* Notification Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Notifikasi</h3>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <Button variant="ghost" size="sm" onClick={markAllAsRead}>
                    Tandai semua dibaca
                  </Button>
                )}
                <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                <Bell className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                <p>Belum ada notifikasi</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                      !notification.read ? 'bg-blue-50' : ''
                    }`}
                    onClick={() => markAsRead(notification.id)}
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-1">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm ${!notification.read ? 'font-semibold' : ''}`}>
                          {notification.message}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {formatTime(notification.timestamp)}
                        </p>
                      </div>
                      {!notification.read && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}