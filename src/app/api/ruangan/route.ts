import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const kantorId = searchParams.get('kantorId')
    const status = searchParams.get('status')

    const where: any = {}
    if (kantorId) where.kantorId = kantorId
    if (status) where.status = status

    const ruangan = await db.ruangan.findMany({
      where,
      include: {
        kantor: true
      }
    })

    return NextResponse.json(ruangan)
  } catch (error) {
    console.error('Get ruangan error:', error)
    return NextResponse.json(
      { error: 'Gagal mengambil data ruangan' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()

    const ruangan = await db.ruangan.create({
      data: {
        nama: data.nama,
        tipeArea: data.tipeArea,
        deskripsi: data.deskripsi,
        tingkatLantai: data.tingkatLantai,
        status: data.status || 'Aktif',
        customChecklist: data.customChecklist,
        kantorId: data.kantorId
      },
      include: {
        kantor: true
      }
    })

    return NextResponse.json({
      message: 'Ruangan berhasil ditambahkan',
      ruangan
    })
  } catch (error) {
    console.error('Create ruangan error:', error)
    return NextResponse.json(
      { error: 'Gagal menambah ruangan' },
      { status: 500 }
    )
  }
}