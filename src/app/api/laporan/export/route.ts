import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const periode = searchParams.get('periode')
    const pegawaiId = searchParams.get('pegawaiId')
    const kantorId = searchParams.get('kantorId')
    const format = searchParams.get('format') || 'excel'

    let whereClause: any = {}

    // Filter berdasarkan periode
    if (periode) {
      const now = new Date()
      let startDate: Date

      switch (periode) {
        case 'hari-ini':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
          break
        case 'minggu-ini':
          const dayOfWeek = now.getDay()
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - dayOfWeek)
          break
        case 'bulan-ini':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1)
          break
        case 'tahun-ini':
          startDate = new Date(now.getFullYear(), 0, 1)
          break
        default:
          startDate = new Date(0)
      }

      whereClause.createdAt = {
        gte: startDate
      }
    }

    // Filter berdasarkan pegawai
    if (pegawaiId) {
      whereClause.jadwal = {
        pegawaiId: pegawaiId
      }
    }

    // Filter berdasarkan kantor
    if (kantorId) {
      whereClause.jadwal = {
        ...whereClause.jadwal,
        kantorId: kantorId
      }
    }

    const laporan = await db.laporan.findMany({
      where: whereClause,
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
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Format data untuk Excel
    const excelData = laporan.map((l, index) => {
      const checklistData = JSON.parse(l.checklist || '[]')
      const totalChecklist = checklistData.length
      const completedChecklist = checklistData.filter((item: any) => item.checked).length
      
      const avgRating = l.inspeksi.length > 0 
        ? (l.inspeksi.reduce((sum, i) => sum + i.rating, 0) / l.inspeksi.length).toFixed(1)
        : 'N/A'

      const evaluasiByCategory = l.evaluasi.reduce((acc, e) => {
        acc[e.kategori] = `${e.point}/${e.maxPoint}`
        return acc
      }, {} as Record<string, string>)

      return {
        'No': index + 1,
        'Tanggal': new Date(l.createdAt).toLocaleDateString('id-ID'),
        'Waktu': new Date(l.createdAt).toLocaleTimeString('id-ID'),
        'Pegawai': l.jadwal.pegawai.namaLengkap,
        'Ruangan': l.jadwal.ruangan.nama,
        'Tugas': l.jadwal.namaTugas,
        'Status': l.status,
        'Checklist Selesai': `${completedChecklist}/${totalChecklist}`,
        'Persentase': `${l.persentase.toFixed(1)}%`,
        'Total Poin': l.totalPoint,
        'Rating Rata-rata': avgRating,
        'Komentar': l.komentar || '-',
        'Inspektor': l.inspeksi[0]?.inspector.namaLengkap || '-',
        'Kebersihan': evaluasiByCategory['Kebersihan'] || '-',
        'Kerapian': evaluasiByCategory['Kerapian'] || '-',
        'Kelayakan': evaluasiByCategory['Kelayakan'] || '-',
        'Keamanan': evaluasiByCategory['Keamanan'] || '-'
      }
    })

    // Buat CSV content
    const headers = Object.keys(excelData[0] || {})
    const csvContent = [
      headers.join(','),
      ...excelData.map(row => 
        headers.map(header => {
          const value = row[header as keyof typeof row]
          // Escape commas and quotes in values
          if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
            return `"${value.replace(/"/g, '""')}"`
          }
          return value
        }).join(',')
      )
    ].join('\n')

    // Buat filename dengan timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
    const filename = `rekap-laporan-${timestamp}.csv`

    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`
      }
    })
  } catch (error) {
    console.error('Error exporting laporan:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan saat mengekspor laporan' },
      { status: 500 }
    )
  }
}