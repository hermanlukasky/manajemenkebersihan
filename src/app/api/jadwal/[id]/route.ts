import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id
    const data = await request.json()

    const jadwal = await db.jadwal.update({
      where: { id },
      data: {
        namaTugas: data.namaTugas,
        ruanganId: data.ruanganId,
        hariTanggal: new Date(data.hariTanggal),
        jamMulai: data.jamMulai,
        jamSelesai: data.jamSelesai,
        pegawaiId: data.pegawaiId,
        kantorId: data.kantorId
      },
      include: {
        pegawai: {
          select: {
            id: true,
            namaLengkap: true,
            username: true
          }
        },
        ruangan: true,
        kantor: true
      }
    })

    return NextResponse.json({
      message: 'Jadwal berhasil diperbarui',
      jadwal
    })

  } catch (error) {
    console.error('Update jadwal error:', error)
    return NextResponse.json(
      { error: 'Gagal memperbarui jadwal' },
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

    // Hapus laporan yang terkait dengan jadwal ini
    await db.laporan.deleteMany({
      where: { jadwalId: id }
    })

    // Hapus jadwal
    await db.jadwal.delete({
      where: { id }
    })

    return NextResponse.json({
      message: 'Jadwal berhasil dihapus'
    })

  } catch (error) {
    console.error('Delete jadwal error:', error)
    return NextResponse.json(
      { error: 'Gagal menghapus jadwal' },
      { status: 500 }
    )
  }
}