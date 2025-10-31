import { useRealtimePegawai } from '@/hooks/useRealtimePegawai'
import { useSession } from 'next-auth/react'

export default function DashboardPegawai() {
  const { data: session } = useSession()
  const pegawaiId = session?.user?.id

  if (pegawaiId) useRealtimePegawai(pegawaiId)

  return <div>Dashboard Pegawai</div>
}
