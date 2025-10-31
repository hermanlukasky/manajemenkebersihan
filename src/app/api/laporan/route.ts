import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const periode = searchParams.get('periode')
    const pegawaiId = searchParams.get('pegawaiId')
    const pegawai = searchParams.get('pegawai') // username
    const status = searchParams.get('status')
    const kantorId = searchParams.get('kantorId')

    let whereClause: any = {}

    // Filter berdasarkan periode
    if (periode) {
      const now = new Date()
      let startDate: Date

      switch (periode) {
        case 'hari-ini':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
          break
        case 'minggu-ini':
          const dayOfWeek = now.getDay()
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - dayOfWeek)
          break
        case 'bulan-ini':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1)
          break
        case 'tahun-ini':
          startDate = new Date(now.getFullYear(), 0, 1)
          break
        default:
          startDate = new Date(0)
      }

      whereClause.createdAt = {
        gte: startDate
      }
    }

    // Filter berdasarkan pegawai (ID atau username)
    if (pegawaiId) {
      whereClause.jadwal = {
        ...whereClause.jadwal,
        pegawaiId: pegawaiId
      }
    } else if (pegawai) {
      // Find pegawai by username first
      const pegawaiData = await db.pegawai.findUnique({
        where: { username: pegawai },
        select: { id: true }
      })
      if (pegawaiData) {
        whereClause.jadwal = {
          ...whereClause.jadwal,
          pegawaiId: pegawaiData.id
        }
      }
    }

    // Filter berdasarkan status
    if (status) {
      whereClause.status = status
    }

    // Filter berdasarkan kantor
    if (kantorId) {
      whereClause.jadwal = {
        ...whereClause.jadwal,
        kantorId: kantorId
      }
    }

    const laporan = await db.laporan.findMany({
      where: whereClause,
      include: {
        jadwal: {
          include: {
            pegawai: true,
            ruangan: true
          }
        },
        inspeksi: {
          include: {
            inspector: true
          }
        },
        evaluasi: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Hitung statistik
    const stats = {
      total: laporan.length,
      pending: laporan.filter(l => l.status === 'Pending').length,
      verified: laporan.filter(l => l.status === 'Verified').length,
      rejected: laporan.filter(l => l.status === 'Rejected').length,
      avgRating: laporan.reduce((acc, l) => {
        const avgInspeksi = l.inspeksi.length > 0 
          ? l.inspeksi.reduce((sum, i) => sum + i.rating, 0) / l.inspeksi.length 
          : 0
        return acc + avgInspeksi
      }, 0) / (laporan.length || 1)
    }

    return NextResponse.json({
      data: laporan,
      stats
    })
  } catch (error) {
    console.error('Error fetching laporan:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan saat mengambil data laporan' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { jadwalId, checklist, fotoMasalah, komentar } = body

    if (!jadwalId || !checklist) {
      return NextResponse.json(
        { error: 'Jadwal ID dan checklist wajib diisi' },
        { status: 400 }
      )
    }

    // Hitung total poin dan persentase dari checklist
    const checklistData = JSON.parse(checklist)
    let totalPoint = 0
    let maxPoint = 0

    checklistData.forEach((item: any) => {
      if (item.checked) {
        totalPoint += item.point || 1
      }
      maxPoint += item.point || 1
    })

    const persentase = maxPoint > 0 ? (totalPoint / maxPoint) * 100 : 0

    const laporan = await db.laporan.create({
      data: {
        jadwalId,
        checklist,
        fotoMasalah,
        komentar,
        totalPoint,
        persentase
      },
      include: {
        jadwal: {
          include: {
            pegawai: true,
            ruangan: true
          }
        }
      }
    })

    // Update status jadwal menjadi Completed
    await db.jadwal.update({
      where: { id: jadwalId },
      data: { status: 'Completed' }
    })

    return NextResponse.json(laporan)
  } catch (error) {
    console.error('Error creating laporan:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan saat membuat laporan' },
      { status: 500 }
    )
  }
}