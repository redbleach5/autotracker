import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const vehicleId = searchParams.get('vehicleId')

    const where = vehicleId ? { vehicleId } : {}

    const parts = await db.part.findMany({
      where,
      include: { vehicle: true },
      orderBy: { purchaseDate: 'desc' },
    })
    return NextResponse.json(parts)
  } catch {
    return NextResponse.json({ error: 'Failed to fetch parts' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const part = await db.part.create({
      data: {
        vehicleId: body.vehicleId,
        name: body.name,
        partNumber: body.partNumber || '',
        category: body.category || 'other',
        cost: body.cost || 0,
        purchaseDate: new Date(body.purchaseDate),
        supplier: body.supplier || '',
        notes: body.notes || '',
      },
      include: { vehicle: true },
    })
    return NextResponse.json(part, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Failed to create part' }, { status: 500 })
  }
}
