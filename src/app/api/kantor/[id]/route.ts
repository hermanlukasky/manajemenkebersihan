import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id

    const kantor = await db.kantor.findUnique({
      where: { id },
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

    if (!kantor) {
      return NextResponse.json(
        { error: 'Kantor tidak ditemukan' },
        { status: 404 }
      )
    }

    return NextResponse.json(kantor)
  } catch (error) {
    console.error('Get kantor by ID error:', error)
    return NextResponse.json(
      { error: 'Gagal mengambil data kantor' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id
    const data = await request.json()

    const kantor = await db.kantor.update({
      where: { id },
      data: {
        nama: data.nama,
        alamat: data.alamat,
        lokasiMap: data.lokasiMap,
        trackingGeo: data.trackingGeo
      }
    })

    return NextResponse.json({
      message: 'Kantor berhasil diperbarui',
      kantor
    })

  } catch (error) {
    console.error('Update kantor error:', error)
    return NextResponse.json(
      { error: 'Gagal memperbarui kantor' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id

    // Check if there are related records
    const pegawaiCount = await db.pegawai.count({
      where: { kantorId: id }
    })

    const ruanganCount = await db.ruangan.count({
      where: { kantorId: id }
    })

    const jadwalCount = await db.jadwal.count({
      where: { kantorId: id }
    })

    if (pegawaiCount > 0 || ruanganCount > 0 || jadwalCount > 0) {
      return NextResponse.json(
        { 
          error: 'Tidak dapat menghapus kantor yang masih memiliki pegawai, ruangan, atau jadwal terkait. Hapus terlebih dahulu semua data terkait.',
          details: {
            pegawai: pegawaiCount,
            ruangan: ruanganCount,
            jadwal: jadwalCount
          }
        },
        { status: 400 }
      )
    }

    // Delete kantor
    await db.kantor.delete({
      where: { id }
    })

    return NextResponse.json({
      message: 'Kantor berhasil dihapus'
    })

  } catch (error) {
    console.error('Delete kantor error:', error)
    return NextResponse.json(
      { error: 'Gagal menghapus kantor' },
      { status: 500 }
    )
  }
}