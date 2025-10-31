import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { laporanId, kategori, point, maxPoint, catatan } = body

    if (!laporanId || !kategori || point === undefined || !maxPoint) {
      return NextResponse.json(
        { error: 'Laporan ID, kategori, point, dan max point wajib diisi' },
        { status: 400 }
      )
    }

    // Buat evaluasi baru
    const evaluasi = await db.evaluasi.create({
      data: {
        laporanId,
        kategori,
        point,
        maxPoint,
        catatan
      },
      include: {
        laporan: true
      }
    })

    // Hitung ulang total poin dan persentase laporan
    const allEvaluasi = await db.evaluasi.findMany({
      where: { laporanId }
    })

    const totalPoint = allEvaluasi.reduce((sum, e) => sum + e.point, 0)
    const maxTotalPoint = allEvaluasi.reduce((sum, e) => sum + e.maxPoint, 0)
    const persentase = maxTotalPoint > 0 ? (totalPoint / maxTotalPoint) * 100 : 0

    // Update laporan dengan total poin baru
    await db.laporan.update({
      where: { id: laporanId },
      data: {
        totalPoint,
        persentase
      }
    })

    return NextResponse.json(evaluasi)
  } catch (error) {
    console.error('Error creating evaluasi:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan saat membuat evaluasi' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const laporanId = searchParams.get('laporanId')
    const kategori = searchParams.get('kategori')

    let whereClause: any = {}

    if (laporanId) {
      whereClause.laporanId = laporanId
    }

    if (kategori) {
      whereClause.kategori = kategori
    }

    const evaluasi = await db.evaluasi.findMany({
      where: whereClause,
      include: {
        laporan: {
          include: {
            jadwal: {
              include: {
                pegawai: true,
                ruangan: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Hitung statistik evaluasi per kategori
    const statsByCategory = evaluasi.reduce((acc, e) => {
      if (!acc[e.kategori]) {
        acc[e.kategori] = {
          total: 0,
          point: 0,
          maxPoint: 0,
          count: 0
        }
      }
      acc[e.kategori].total += e.point
      acc[e.kategori].maxPoint += e.maxPoint
      acc[e.kategori].count += 1
      return acc
    }, {} as Record<string, any>)

    // Hitung rata-rata per kategori
    Object.keys(statsByCategory).forEach(kategori => {
      const stats = statsByCategory[kategori]
      stats.average = stats.maxPoint > 0 ? (stats.total / stats.maxPoint) * 100 : 0
    })

    return NextResponse.json({
      data: evaluasi,
      statsByCategory
    })
  } catch (error) {
    console.error('Error fetching evaluasi:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan saat mengambil data evaluasi' },
      { status: 500 }
    )
  }
}