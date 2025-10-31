import { NextRequest } from 'next/server'
import { Server } from 'socket.io'
import { setupSocket } from '@/lib/socket'

// Konfigurasi agar Next.js tidak mem-parsing body (harus false untuk WebSocket)
export const config = {
  api: {
    bodyParser: false,
  },
}

// Simpan server WebSocket di global agar tidak dibuat ulang
let io: Server | null = null

export async function GET(req: NextRequest) {
  if (!io) {
    console.log('🚀 Initializing Socket.IO server...')

    // Gunakan globalThis untuk mencegah multiple instance saat hot reload
    const httpServer: any = (globalThis as any).httpServer || (globalThis as any).server
    if (!httpServer) {
      console.error('❌ Tidak ada server HTTP aktif. Pastikan Next.js dijalankan lewat `npm run dev`.')
      return new Response('No HTTP server found', { status: 500 })
    }

    io = new Server(httpServer, {
      path: '/api/socketio',
      addTrailingSlash: false,
      cors: {
        origin: '*',
        methods: ['GET', 'POST'],
      },
    })

    setupSocket(io)
    ;(globalThis as any).io = io

    console.log('✅ Socket.IO server initialized on /api/socketio')
  }

  return new Response('WebSocket server is running ✅', { status: 200 })
}
