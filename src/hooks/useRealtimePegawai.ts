'use client'

import { useEffect } from 'react'
import { supabase } from '@/lib/supabase-client'

export function useRealtimePegawai(pegawaiId: string) {
  useEffect(() => {
    if (!pegawaiId) return

    const channel = supabase
      .channel(`pegawai-${pegawaiId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'laporan', filter: `pegawai_id=eq.${pegawaiId}` },
        (payload) => {
          console.log('Update realtime untuk pegawai:', payload)
          alert(`Notifikasi baru untuk pegawai ID ${pegawaiId}!`)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [pegawaiId])
}