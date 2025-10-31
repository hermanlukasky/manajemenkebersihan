import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const allPegawai = await db.pegawai.findMany({
      include: {
        kantor: true
      }
    })

    const adminUser = await db.pegawai.findFirst({
      where: {
        username: 'admin',
        role: 'Admin',
        status: 'Aktif'
      }
    })

    const budiUser = await db.pegawai.findFirst({
      where: {
        username: 'budi',
        role: 'Pegawai',
        status: 'Aktif'
      }
    })

    // Debug laporan
    const allLaporan = await db.laporan.findMany({
      include: {
        jadwal: {
          include: {
            pegawai: true,
            ruangan: true,
            kantor: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    const laporanPerKantor = await db.laporan.count({
      where: {
        jadwal: {
          kantorId: 'cmhabir740000jzc9rytw3nm1'
        }
      }
    })

    return NextResponse.json({
      totalPegawai: allPegawai.length,
      allPegawai: allPegawai.map(p => ({
        id: p.id,
        namaLengkap: p.namaLengkap,
        username: p.username,
        role: p.role,
        status: p.status,
        password: p.password
      })),
      adminUser: adminUser ? {
        id: adminUser.id,
        namaLengkap: adminUser.namaLengkap,
        username: adminUser.username,
        role: adminUser.role,
        status: adminUser.status,
        password: adminUser.password
      } : null,
      budiUser: budiUser ? {
        id: budiUser.id,
        namaLengkap: budiUser.namaLengkap,
        username: budiUser.username,
        role: budiUser.role,
        status: budiUser.status,
        password: budiUser.password
      } : null,
      laporanDebug: {
        totalLaporan: allLaporan.length,
        laporanPerKantor,
        allLaporan: allLaporan.map(l => ({
          id: l.id,
          status: l.status,
          tanggal: l.createdAt,
          kantorId: l.jadwal?.kantorId,
          namaTugas: l.jadwal?.namaTugas,
          pegawai: l.jadwal?.pegawai?.namaLengkap,
          ruangan: l.jadwal?.ruangan?.nama,
          kantorNama: l.jadwal?.kantor?.nama
        }))
      }
    })
  } catch (error) {
    console.error('Debug error:', error)
    return NextResponse.json(
      { error: 'Debug error', details: error },
      { status: 500 }
    )
  }
}