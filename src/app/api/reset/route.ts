import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST() {
  try {
    // Delete all data in order of dependencies
    await db.inspeksi.deleteMany()
    await db.laporan.deleteMany()
    await db.jadwal.deleteMany()
    await db.pegawai.deleteMany()
    await db.ruangan.deleteMany()
    await db.kantor.deleteMany()

    // Create fresh data
    // Create Kantor
    const kantor = await db.kantor.create({
      data: {
        nama: 'Kantor Pusat',
        alamat: 'Jl. Sudirman No. 123, Jakarta Pusat',
        lokasiMap: '-6.2088, 106.8456',
        trackingGeo: true
      }
    })

    // Create Pegawai
    const adminUser = await db.pegawai.create({
      data: {
        namaLengkap: 'Administrator',
        jenisKelamin: 'Laki-laki',
        nomorTelp: '08123456789',
        username: 'admin',
        password: 'admin123',
        role: 'Admin',
        status: 'Aktif',
        tanggalMasuk: new Date('2023-01-01'),
        kantorId: kantor.id
      }
    })

    const pegawai1 = await db.pegawai.create({
      data: {
        namaLengkap: 'Budi Santoso',
        jenisKelamin: 'Laki-laki',
        nomorTelp: '08123456780',
        username: 'budi',
        password: 'pegawai123',
        role: 'Pegawai',
        status: 'Aktif',
        tanggalMasuk: new Date('2023-01-15'),
        kantorId: kantor.id
      }
    })

    const pegawai2 = await db.pegawai.create({
      data: {
        namaLengkap: 'Siti Nurhaliza',
        jenisKelamin: 'Perempuan',
        nomorTelp: '08123456781',
        username: 'siti',
        password: 'pegawai123',
        role: 'Pegawai',
        status: 'Aktif',
        tanggalMasuk: new Date('2023-02-01'),
        kantorId: kantor.id
      }
    })

    const pegawai3 = await db.pegawai.create({
      data: {
        namaLengkap: 'Ahmad Fauzi',
        jenisKelamin: 'Laki-laki',
        nomorTelp: '08123456782',
        username: 'ahmad',
        password: 'pegawai123',
        role: 'Pegawai',
        status: 'Aktif',
        tanggalMasuk: new Date('2023-03-01'),
        kantorId: kantor.id
      }
    })

    // Create Ruangan
    const ruangan1 = await db.ruangan.create({
      data: {
        nama: 'Ruang Meeting A',
        tipeArea: 'Meeting Room',
        deskripsi: 'Ruang meeting utama dengan kapasitas 20 orang',
        tingkatLantai: 2,
        status: 'Aktif',
        customChecklist: 'Sapu lantai,Lap meja,Bersihkan jendela,Buang sampah,Organisir peralatan',
        kantorId: kantor.id
      }
    })

    const ruangan2 = await db.ruangan.create({
      data: {
        nama: 'Lantai 1 - Koridor',
        tipeArea: 'Corridor',
        deskripsi: 'Koridor utama lantai 1',
        tingkatLantai: 1,
        status: 'Aktif',
        customChecklist: 'Sapu lantai,Pel lantai,Lap dinding,Bersihkan pintu',
        kantorId: kantor.id
      }
    })

    const ruangan3 = await db.ruangan.create({
      data: {
        nama: 'Pantry',
        tipeArea: 'Pantry',
        deskripsi: 'Area pantry dan kopi',
        tingkatLantai: 1,
        status: 'Aktif',
        customChecklist: 'Cuci meja,Bersihkan sink,Organisir alat makan,Buang sampah',
        kantorId: kantor.id
      }
    })

    // Create Jadwal untuk hari ini
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const jadwal1 = await db.jadwal.create({
      data: {
        namaTugas: 'Cleaning Ruang Meeting',
        ruanganId: ruangan1.id,
        hariTanggal: today,
        jamMulai: '08:00',
        jamSelesai: '10:00',
        pegawaiId: pegawai1.id,
        kantorId: kantor.id,
        status: 'Completed'
      }
    })

    const jadwal2 = await db.jadwal.create({
      data: {
        namaTugas: 'Cleaning Lantai 1',
        ruanganId: ruangan2.id,
        hariTanggal: today,
        jamMulai: '10:00',
        jamSelesai: '12:00',
        pegawaiId: pegawai2.id,
        kantorId: kantor.id,
        status: 'In Progress'
      }
    })

    const jadwal3 = await db.jadwal.create({
      data: {
        namaTugas: 'Cleaning Pantry',
        ruanganId: ruangan3.id,
        hariTanggal: today,
        jamMulai: '13:00',
        jamSelesai: '14:00',
        pegawaiId: pegawai3.id,
        kantorId: kantor.id,
        status: 'Scheduled'
      }
    })

    // Create Laporan sample
    const laporan1 = await db.laporan.create({
      data: {
        jadwalId: jadwal1.id,
        checklist: JSON.stringify([
          { item: 'Sapu lantai', completed: true, hasIssue: false },
          { item: 'Lap meja', completed: true, hasIssue: false },
          { item: 'Bersihkan jendela', completed: true, hasIssue: false },
          { item: 'Buang sampah', completed: true, hasIssue: false },
          { item: 'Organisir peralatan', completed: true, hasIssue: false }
        ]),
        status: 'Verified'
      }
    })

    // Create Inspeksi
    await db.inspeksi.create({
      data: {
        laporanId: laporan1.id,
        rating: 5,
        komentar: 'Pekerjaan sangat baik dan rapi',
        inspectorId: adminUser.id
      }
    })

    return NextResponse.json({
      message: 'Database berhasil di-reset dan data dummy dibuat ulang',
      data: {
        kantor,
        pegawai: [adminUser, pegawai1, pegawai2, pegawai3],
        ruangan: [ruangan1, ruangan2, ruangan3],
        jadwal: [jadwal1, jadwal2, jadwal3]
      }
    })

  } catch (error) {
    console.error('Reset error:', error)
    return NextResponse.json(
      { error: 'Gagal reset database' },
      { status: 500 }
    )
  }
}