'use client'

import { useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

/**
 * Hook realtime untuk admin
 * Mendeteksi setiap INSERT ke tabel 'laporan'
 */
export function useRealtimeAdmin() {
  useEffect(() => {
    console.log('📡 Subscribing to realtime laporan...')

    const laporanChannel = supabase
      .channel('laporan-insert')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'laporan' },
        (payload) => {
          console.log('🆕 Laporan baru:', payload.new)
          toast.info(`Laporan baru dari ${payload.new.namaPegawai}`)
        }
      )
      .subscribe((status) => {
        console.log('✅ Realtime status:', status)
      })

    // Bersihkan listener saat komponen dilepas
    return () => {
      console.log('❌ Unsubscribing laporan channel')
      supabase.removeChannel(laporanChannel)
    }
  }, [])
}
