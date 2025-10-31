import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { laporanId, rating, komentar, inspectorId } = body

    if (!laporanId || !rating || !inspectorId) {
      return NextResponse.json(
        { error: 'Laporan ID, rating, dan inspector ID wajib diisi' },
        { status: 400 }
      )
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: 'Rating harus antara 1-5' },
        { status: 400 }
      )
    }

    // Buat inspeksi baru
    const inspeksi = await db.inspeksi.create({
      data: {
        laporanId,
        rating,
        komentar,
        inspectorId,
        isVerified: true
      },
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
        },
        inspector: true
      }
    })

    // Update status laporan menjadi Verified
    await db.laporan.update({
      where: { id: laporanId },
      data: { 
        status: 'Verified',
        isNotified: true
      }
    })

    return NextResponse.json(inspeksi)
  } catch (error) {
    console.error('Error creating inspeksi:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan saat membuat inspeksi' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const laporanId = searchParams.get('laporanId')
    const inspectorId = searchParams.get('inspectorId')

    let whereClause: any = {}

    if (laporanId) {
      whereClause.laporanId = laporanId
    }

    if (inspectorId) {
      whereClause.inspectorId = inspectorId
    }

    const inspeksi = await db.inspeksi.findMany({
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
        },
        inspector: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(inspeksi)
  } catch (error) {
    console.error('Error fetching inspeksi:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan saat mengambil data inspeksi' },
      { status: 500 }
    )
  }
}