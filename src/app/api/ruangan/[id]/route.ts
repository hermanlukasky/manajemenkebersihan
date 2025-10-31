import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const ruangan = await db.ruangan.findUnique({
      where: {
        id: params.id
      },
      include: {
        kantor: {
          select: {
            id: true,
            nama: true
          }
        }
      }
    })

    if (!ruangan) {
      return NextResponse.json(
        { error: 'Ruangan tidak ditemukan' },
        { status: 404 }
      )
    }

    return NextResponse.json(ruangan)
  } catch (error) {
    console.error('Error fetching ruangan:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan saat mengambil data ruangan' },
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
    const { nama, tipeArea, deskripsi, tingkatLantai, status, customChecklist } = body

    const ruangan = await db.ruangan.update({
      where: {
        id: params.id
      },
      data: {
        nama,
        tipeArea,
        deskripsi,
        tingkatLantai,
        status,
        customChecklist
      },
      include: {
        kantor: {
          select: {
            id: true,
            nama: true
          }
        }
      }
    })

    return NextResponse.json(ruangan)
  } catch (error) {
    console.error('Error updating ruangan:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan saat memperbarui ruangan' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await db.ruangan.delete({
      where: {
        id: params.id
      }
    })

    return NextResponse.json({ message: 'Ruangan berhasil dihapus' })
  } catch (error) {
    console.error('Error deleting ruangan:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan saat menghapus ruangan' },
      { status: 500 }
    )
  }
}