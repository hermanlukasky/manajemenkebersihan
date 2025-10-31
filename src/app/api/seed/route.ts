import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST() {
  try {
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
        customChecklist: 'Sapu lantai secara menyeluruh, Pel lantai dengan desinfektan, Lap semua meja dan kursi, Bersihkan jendela dan kaca, Buang sampah di semua tempat sampah, Organisir ulang peralatan presentasi, Lap whiteboard, Atur ulang konfigurasi ruangan',
        kantorId: kantor.id
      }
    })

    const ruangan2 = await db.ruangan.create({
      data: {
        nama: 'Toilet Utama Lantai 1',
        tipeArea: 'Toilet',
        deskripsi: 'Toilet utama untuk pria dan wanita',
        tingkatLantai: 1,
        status: 'Aktif',
        customChecklist: 'Sapu dan lantai kering, Bersihkan closet dengan desinfektan, Lap wastafel dan cermin, Isi ulang tissue dan sabun, Bersihkan lantai dengan cairan pembersih, Periksa dan bersihkan saluran air, Semprot pengharum ruangan',
        kantorId: kantor.id
      }
    })

    const ruangan3 = await db.ruangan.create({
      data: {
        nama: 'Dapur Kantor',
        tipeArea: 'Dapur',
        deskripsi: 'Area dapur dan pantry karyawan',
        tingkatLantai: 1,
        status: 'Aktif',
        customChecklist: 'Bersihkan semua permukaan dapur, Lap kompor dan oven, Bersihkan kulkas dan microwave, Cuci semua peralatan makan, Organisir pantry, Periksa kebersihan tempat cuci piring, Buang sampah organik, Lap lantai dapur',
        kantorId: kantor.id
      }
    })

    const ruangan4 = await db.ruangan.create({
      data: {
        nama: 'Lobby Utama',
        tipeArea: 'Lobby',
        deskripsi: 'Area lobby resepsionis',
        tingkatLantai: 1,
        status: 'Aktif',
        customChecklist: 'Sapu lantai lobby, Pel lantai dengan pembersih khusus, Lap meja resepsionis, Bersihkan kaca pintu masuk, Rapikan majalah dan brosur, Periksa kebersihan tanaman hias, Buang sampah di lobby',
        kantorId: kantor.id
      }
    })

    const ruangan5 = await db.ruangan.create({
      data: {
        nama: 'Ruang Kerja Open Space',
        tipeArea: 'Office',
        deskripsi: 'Area kerja karyawan open space',
        tingkatLantai: 3,
        status: 'Aktif',
        customChecklist: '', // Kosong untuk menggunakan checklist default
        kantorId: kantor.id
      }
    })

    // Create Jadwal untuk hari ini
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const jadwal1 = await db.jadwal.create({
      data: {
        namaTugas: 'Cleaning Ruang Meeting A',
        ruanganId: ruangan1.id,
        hariTanggal: today,
        jamMulai: '08:00',
        jamSelesai: '10:00',
        pegawaiId: pegawai1.id,
        kantorId: kantor.id,
        status: 'Scheduled'
      }
    })

    const jadwal2 = await db.jadwal.create({
      data: {
        namaTugas: 'Cleaning Toilet Utama',
        ruanganId: ruangan2.id,
        hariTanggal: today,
        jamMulai: '10:00',
        jamSelesai: '12:00',
        pegawaiId: pegawai2.id,
        kantorId: kantor.id,
        status: 'Scheduled'
      }
    })

    const jadwal3 = await db.jadwal.create({
      data: {
        namaTugas: 'Cleaning Dapur Kantor',
        ruanganId: ruangan3.id,
        hariTanggal: today,
        jamMulai: '13:00',
        jamSelesai: '15:00',
        pegawaiId: pegawai3.id,
        kantorId: kantor.id,
        status: 'Scheduled'
      }
    })

    const jadwal4 = await db.jadwal.create({
      data: {
        namaTugas: 'Cleaning Lobby Utama',
        ruanganId: ruangan4.id,
        hariTanggal: today,
        jamMulai: '15:00',
        jamSelesai: '17:00',
        pegawaiId: pegawai1.id,
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
      message: 'Data dummy berhasil dibuat',
      data: {
        kantor,
        pegawai: [adminUser, pegawai1, pegawai2, pegawai3],
        ruangan: [ruangan1, ruangan2, ruangan3, ruangan4, ruangan5],
        jadwal: [jadwal1, jadwal2, jadwal3, jadwal4]
      }
    })

  } catch (error) {
    console.error('Seed error:', error)
    return NextResponse.json(
      { error: 'Gagal membuat data dummy' },
      { status: 500 }
    )
  }
}