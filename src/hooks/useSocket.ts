'use client'

/**
 * Dummy useSocket hook
 * --------------------------------------------------------
 * Versi ini tidak membuat koneksi WebSocket agar tetap
 * kompatibel di lingkungan serverless seperti Vercel.
 * Semua fungsi (emit, on, off) tetap disediakan agar
 * komponen lain seperti NotificationSystem tidak error.
 * --------------------------------------------------------
 */

export const useSocket = (role?: string, userId?: string) => {
  if (typeof window !== 'undefined') {
    console.warn(
      '⚠️ Realtime socket nonaktif di Vercel. Semua event hanya dicetak di console.'
    )
  }

  return {
    socket: null,

    /**
     * Emit event ke server (dummy)
     */
    emit: (event: string, data: any) => {
      console.log(`[useSocket.emit] Event: ${event}`, data)
    },

    /**
     * Daftarkan listener event (dummy)
     */
    on: (event: string, callback: (data: any) => void) => {
      console.log(`[useSocket.on] Listen event: ${event}`)
      // Tidak menjalankan callback di dummy mode
    },

    /**
     * Hapus listener event (dummy)
     */
    off: (event: string, callback?: (data: any) => void) => {
      console.log(`[useSocket.off] Unsubscribe event: ${event}`)
    },
  }
}
