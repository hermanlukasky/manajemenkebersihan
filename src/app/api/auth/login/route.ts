import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json()

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username dan password harus diisi' },
        { status: 400 }
      )
    }

    const pegawai = await db.pegawai.findFirst({
      where: { username, status: 'Aktif' },
      include: { kantor: true },
    })

    if (!pegawai) {
      return NextResponse.json(
        { error: 'Username atau password salah' },
        { status: 401 }
      )
    }

    const isPasswordValid = await bcrypt.compare(password, pegawai.password)
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Username atau password salah' },
        { status: 401 }
      )
    }

    // Kirim kantorId secara eksplisit
    const { password: _, ...pegawaiData } = pegawai

    return NextResponse.json({
      message: 'Login berhasil',
      user: {
        id: pegawaiData.id,
        username: pegawaiData.username,
        namaLengkap: pegawaiData.namaLengkap,
        role: pegawaiData.role,
        status: pegawaiData.status,
        kantorId: pegawaiData.kantorId, // ✅ ambil dari tabel pegawai
        kantorNama: pegawaiData.kantor?.nama || null,
      },
    })
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}
