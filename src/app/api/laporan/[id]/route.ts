import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const laporan = await db.laporan.findUnique({
      where: { id: params.id },
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
      }
    })

    if (!laporan) {
      return NextResponse.json(
        { error: 'Laporan tidak ditemukan' },
        { status: 404 }
      )
    }

    return NextResponse.json(laporan)
  } catch (error) {
    console.error('Error fetching laporan:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan saat mengambil data laporan' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { status, komentar } = body

    const laporan = await db.laporan.update({
      where: { id: params.id },
      data: {
        status,
        komentar
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

    return NextResponse.json(laporan)
  } catch (error) {
    console.error('Error updating laporan:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan saat memperbarui laporan' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Hapus evaluasi terkait
    await db.evaluasi.deleteMany({
      where: { laporanId: params.id }
    })

    // Hapus inspeksi terkait
    await db.inspeksi.deleteMany({
      where: { laporanId: params.id }
    })

    // Hapus laporan
    await db.laporan.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ message: 'Laporan berhasil dihapus' })
  } catch (error) {
    console.error('Error deleting laporan:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan saat menghapus laporan' },
      { status: 500 }
    )
  }
}