import bcrypt from 'bcrypt'
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
            ruangan: true,
          },
        },
      },
    })

    // Hapus password sebelum dikirim ke response
    const pegawaiWithoutPassword = pegawai.map((p) => {
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

    // 🔒 Hash password sebelum simpan
    const hashedPassword = await bcrypt.hash(data.password, 10)

    const pegawai = await db.pegawai.create({
      data: {
        namaLengkap: data.namaLengkap,
        jenisKelamin: data.jenisKelamin,
        nomorTelp: data.nomorTelp,
        username: data.username,
        password: hashedPassword, // simpan hasil hash
        role: data.role,
        status: data.status || 'Aktif',
        tanggalMasuk: new Date(data.tanggalMasuk),
        suratKontrak: data.suratKontrak,
        kantorId: data.kantorId,
      },
      include: {
        kantor: true,
      },
    })

    const { password, ...pegawaiData } = pegawai
    return NextResponse.json({
      message: 'Pegawai berhasil ditambahkan',
      pegawai: pegawaiData,
    })
  } catch (error) {
    console.error('Create pegawai error:', error)
    return NextResponse.json(
      { error: 'Gagal menambah pegawai' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'ID pegawai tidak ditemukan' }, { status: 400 })
    }

    // Hapus inspeksi yang berkaitan
    await db.inspeksi.deleteMany({ where: { inspectorId: id } })

    // Jika ada relasi lain (misal jadwal)
    await db.jadwal.deleteMany({ where: { pegawaiId: id } })

    // Baru hapus pegawai
    await db.pegawai.delete({ where: { id } })

    return NextResponse.json({ message: 'Pegawai berhasil dihapus' })
  } catch (error) {
    console.error('Delete pegawai error:', error)
    return NextResponse.json({ error: 'Gagal menghapus pegawai' }, { status: 500 })
  }
}
