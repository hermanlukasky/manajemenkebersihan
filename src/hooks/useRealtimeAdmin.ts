'use client'

import { useEffect } from 'react'
import { supabase } from '@/lib/supabase-client'

export function useRealtimeAdmin() {
  useEffect(() => {
    const laporanChannel = supabase
      .channel('laporan-insert')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'laporan' },
        (payload) => {
          console.log('Laporan baru:', payload.new)
          alert(`Laporan baru dari ${payload.new.namaPegawai}`)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(laporanChannel)
    }
  }, [])
}
