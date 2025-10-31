import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const kantor = await db.kantor.findMany({
      include: {
        pegawai: {
          select: {
            id: true,
            namaLengkap: true,
            role: true,
            status: true
          }
        },
        ruangan: true,
        jadwal: true
      }
    })

    return NextResponse.json(kantor)
  } catch (error) {
    console.error('Get kantor error:', error)
    return NextResponse.json(
      { error: 'Gagal mengambil data kantor' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()

    const kantor = await db.kantor.create({
      data: {
        nama: data.nama,
        alamat: data.alamat,
        lokasiMap: data.lokasiMap,
        trackingGeo: data.trackingGeo || false
      }
    })

    return NextResponse.json({
      message: 'Kantor berhasil ditambahkan',
      kantor
    })
  } catch (error) {
    console.error('Create kantor error:', error)
    return NextResponse.json(
      { error: 'Gagal menambah kantor' },
      { status: 500 }
    )
  }
}