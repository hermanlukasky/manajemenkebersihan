import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import bcrypt from 'bcrypt'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> } // <- ubah di sini
) {
  try {
    const { id } = await params // <- tambahkan await

    const pegawai = await db.pegawai.findUnique({
      where: { id },
      include: {
        kantor: true,
        jadwalAssigned: {
          include: { ruangan: true }
        }
      }
    })

    if (!pegawai) {
      return NextResponse.json({ error: 'Pegawai tidak ditemukan' }, { status: 404 })
    }

    const { password, ...pegawaiData } = pegawai
    return NextResponse.json(pegawaiData)
  } catch (error) {
    console.error('Get pegawai by ID error:', error)
    return NextResponse.json({ error: 'Gagal mengambil data pegawai' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> } // <- ubah di sini
) {
  try {
    const { id } = await params // <- tambahkan await
    const data = await request.json()

    if (!id) {
      return NextResponse.json({ error: 'ID pegawai tidak ditemukan' }, { status: 400 })
    }

    const existing = await db.pegawai.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Pegawai tidak ditemukan' }, { status: 404 })
    }

    let updateData: any = {
      namaLengkap: data.namaLengkap,
      jenisKelamin: data.jenisKelamin,
      nomorTelp: data.nomorTelp,
      username: data.username,
      role: data.role,
      status: data.status,
      tanggalMasuk: data.tanggalMasuk ? new Date(data.tanggalMasuk) : existing.tanggalMasuk,
      suratKontrak: data.suratKontrak,
      kantorId: data.kantorId
    }

    if (data.password && data.password.trim() !== '') {
      updateData.password = await bcrypt.hash(data.password, 10)
    }

    const pegawai = await db.pegawai.update({
      where: { id },
      data: updateData,
      include: { kantor: true }
    })

    const { password, ...pegawaiData } = pegawai

    return NextResponse.json({
      message: 'Pegawai berhasil diperbarui',
      pegawai: pegawaiData
    })
  } catch (error) {
    console.error('Update pegawai error:', error)
    return NextResponse.json({ error: 'Gagal memperbarui pegawai' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> } // <- ubah di sini
) {
  try {
    const { id } = await params // <- tambahkan await

    await db.jadwal.deleteMany({ where: { pegawaiId: id } })
    await db.inspeksi.deleteMany({ where: { inspectorId: id } })
    await db.pegawai.delete({ where: { id } })

    return NextResponse.json({ message: 'Pegawai berhasil dihapus' })
  } catch (error) {
    console.error('Delete pegawai error:', error)
    return NextResponse.json({ error: 'Gagal menghapus pegawai' }, { status: 500 })
  }
}
