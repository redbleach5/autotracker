import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const part = await db.part.update({
      where: { id },
      data: {
        name: body.name,
        partNumber: body.partNumber,
        category: body.category,
        cost: body.cost,
        purchaseDate: new Date(body.purchaseDate),
        supplier: body.supplier,
        notes: body.notes,
      },
      include: { vehicle: true },
    })
    return NextResponse.json(part)
  } catch {
    return NextResponse.json({ error: 'Failed to update part' }, { status: 500 })
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await db.part.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Failed to delete part' }, { status: 500 })
  }
}
