'use client'

import { useEffect } from 'react'
import { supabase } from '@/lib/supabase-client'

export function useRealtimePegawai(pegawaiId: string) {
  useEffect(() => {
    const laporanChannel = supabase
      .channel('laporan-updated')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'laporan',
          filter: `pegawai_id=eq.${pegawaiId}`,
        },
        (payload) => {
          console.log('Laporan Anda diverifikasi:', payload.new)
          alert(`Laporan Anda telah diverifikasi! ✅`)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(laporanChannel)
    }
  }, [pegawaiId])
}
