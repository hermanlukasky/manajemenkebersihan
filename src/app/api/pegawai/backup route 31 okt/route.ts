import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const kantorId = searchParams.get('kantorId')
    const status = searchParams.get('status')
    const username = searchParams.get('username')

    const where: any = {}
    if (kantorId) where.kantorId = kantorId
    if (status) where.status = status
    if (username) where.username = username

    const pegawai = await db.pegawai.findMany({
      where,
      include: {
        kantor: true,
        jadwalAssigned: {
          include: {
            ruangan: true
          }
        }
      }
    })

    // Remove password from response
    const pegawaiWithoutPassword = pegawai.map(p => {
      const { password, ...pegawaiData } = p
      return pegawaiData
    })

    return NextResponse.json(pegawaiWithoutPassword)
  } catch (error) {
    console.error('Get pegawai error:', error)
    return NextResponse.json(
      { error: 'Gagal mengambil data pegawai' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()

    const pegawai = await db.pegawai.create({
      data: {
        namaLengkap: data.namaLengkap,
        jenisKelamin: data.jenisKelamin,
        nomorTelp: data.nomorTelp,
        username: data.username,
        password: data.password, // In production, hash this password
        role: data.role,
        status: data.status || 'Aktif',
        tanggalMasuk: new Date(data.tanggalMasuk),
        suratKontrak: data.suratKontrak,
        kantorId: data.kantorId
      },
      include: {
        kantor: true
      }
    })

    // Remove password from response
    const { password, ...pegawaiData } = pegawai

    return NextResponse.json({
      message: 'Pegawai berhasil ditambahkan',
      pegawai: pegawaiData
    })
  } catch (error) {
    console.error('Create pegawai error:', error)
    return NextResponse.json(
      { error: 'Gagal menambah pegawai' },
      { status: 500 }
    )
  }
}