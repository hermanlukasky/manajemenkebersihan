import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST() {
  try {
    // Get existing data
    const pegawai = await db.pegawai.findMany()
    const ruangan = await db.ruangan.findMany()
    const kantor = await db.kantor.findFirst()

    if (pegawai.length === 0 || ruangan.length === 0 || !kantor) {
      return NextResponse.json({ error: 'Required data not found' }, { status: 400 })
    }

    // Create sample jadwal if not exists
    const existingJadwal = await db.jadwal.findFirst()
    let jadwalId = existingJadwal?.id

    if (!existingJadwal) {
      const newJadwal = await db.jadwal.create({
        data: {
          namaTugas: 'Cleaning Ruang Meeting',
          ruanganId: ruangan[0].id,
          hariTanggal: new Date(),
          jamMulai: '08:00',
          jamSelesai: '10:00',
          pegawaiId: pegawai[0].id,
          kantorId: kantor.id,
          status: 'Completed'
        }
      })
      jadwalId = newJadwal.id
    }

    // Create sample laporan
    const sampleChecklist = JSON.stringify([
      { item: 'Sapu lantai', checked: true, point: 10 },
      { item: 'Pel lantai', checked: true, point: 10 },
      { item: 'Bersihkan meja', checked: true, point: 5 },
      { item: 'Kosongkan trash', checked: false, point: 5 }
    ])

    const laporan = await db.laporan.create({
      data: {
        jadwalId: jadwalId!,
        checklist: sampleChecklist,
        komentar: 'Pembersihan sudah baik, trash perlu diperhatikan',
        status: 'Pending',
        totalPoint: 25,
        persentase: 83.3
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

    return NextResponse.json({ 
      message: 'Sample data created successfully',
      laporan 
    })
  } catch (error) {
    console.error('Error creating sample data:', error)
    return NextResponse.json(
      { error: 'Failed to create sample data' },
      { status: 500 }
    )
  }
}