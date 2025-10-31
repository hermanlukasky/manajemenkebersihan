import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const pegawaiId = searchParams.get('pegawaiId')
    const pegawai = searchParams.get('pegawai') // username
    const kantorId = searchParams.get('kantorId')
    const tanggal = searchParams.get('tanggal')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    const where: any = {}
    
    // Filter by pegawai ID or username
    if (pegawaiId) {
      where.pegawaiId = pegawaiId
    } else if (pegawai) {
      // Find pegawai by username first
      const pegawaiData = await db.pegawai.findUnique({
        where: { username: pegawai },
        select: { id: true }
      })
      if (pegawaiData) {
        where.pegawaiId = pegawaiData.id
      }
    }
    
    if (kantorId) where.kantorId = kantorId
    
    // Filter by single date
    if (tanggal) {
      const date = new Date(tanggal)
      date.setHours(0, 0, 0, 0)
      const nextDate = new Date(date)
      nextDate.setDate(nextDate.getDate() + 1)
      
      where.hariTanggal = {
        gte: date,
        lt: nextDate
      }
    }
    
    // Filter by date range
    if (startDate && endDate) {
      where.hariTanggal = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      }
    }

    const jadwal = await db.jadwal.findMany({
      where,
      include: {
        pegawai: {
          select: {
            id: true,
            namaLengkap: true,
            username: true
          }
        },
        ruangan: true,
        kantor: true,
        laporan: true
      }
    })

    // Sort manually by date and time (24-hour format)
    const sortedJadwal = jadwal.sort((a, b) => {
      // First sort by date
      const dateA = new Date(a.hariTanggal)
      const dateB = new Date(b.hariTanggal)
      if (dateA.getTime() !== dateB.getTime()) {
        return dateA.getTime() - dateB.getTime()
      }
      
      // Then sort by time in 24-hour format
      const [hourA, minuteA] = a.jamMulai.split(':').map(Number)
      const [hourB, minuteB] = b.jamMulai.split(':').map(Number)
      
      const totalMinutesA = hourA * 60 + minuteA
      const totalMinutesB = hourB * 60 + minuteB
      
      return totalMinutesA - totalMinutesB
    })

    return NextResponse.json(sortedJadwal)
  } catch (error) {
    console.error('Get jadwal error:', error)
    return NextResponse.json(
      { error: 'Gagal mengambil data jadwal' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()

     // 🔍 Tambahkan baris ini
    console.log('🟦 Data diterima untuk jadwal:', data)

    // ✅ Cek apakah pegawai, ruangan, dan kantor valid
    const pegawai = await db.pegawai.findUnique({ where: { id: data.pegawaiId } })
    if (!pegawai) {
      return NextResponse.json({ error: 'Pegawai tidak ditemukan' }, { status: 400 })
    }

    const ruangan = await db.ruangan.findUnique({ where: { id: data.ruanganId } })
    if (!ruangan) {
      return NextResponse.json({ error: 'Ruangan tidak ditemukan' }, { status: 400 })
    }

    const kantor = await db.kantor.findUnique({ where: { id: data.kantorId } })
    if (!kantor) {
    console.error('❌ Kantor tidak ditemukan di DB untuk ID:', data.kantorId)
    return NextResponse.json({ error: 'Kantor tidak ditemukan' }, { status: 400 })
    }


    // ✅ Kalau semua valid → buat jadwal baru
    const jadwal = await db.jadwal.create({
      data: {
        namaTugas: data.namaTugas,
        ruanganId: data.ruanganId,
        hariTanggal: new Date(data.hariTanggal),
        jamMulai: data.jamMulai,
        jamSelesai: data.jamSelesai,
        pegawaiId: data.pegawaiId,
        kantorId: data.kantorId,
        status: data.status || 'Scheduled',
      },
      include: {
        pegawai: {
          select: {
            id: true,
            namaLengkap: true,
            username: true,
          },
        },
        ruangan: true,
        kantor: true,
      },
    })

    console.log('📦 Data diterima untuk buat jadwal:', data)

    return NextResponse.json({
      message: 'Jadwal berhasil ditambahkan',
      jadwal,
    })
  } catch (error) {
    console.error('Create jadwal error:', error)
    return NextResponse.json(
      { error: 'Gagal menambah jadwal' },
      { status: 500 },
    )
  }
}
