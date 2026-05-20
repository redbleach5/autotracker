import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const data: Record<string, unknown> = {}
    if (body.name !== undefined) data.name = body.name
    if (body.partNumber !== undefined) data.partNumber = body.partNumber
    if (body.category !== undefined) data.category = body.category
    if (body.cost !== undefined) data.cost = parseFloat(body.cost) || 0
    if (body.purchaseDate !== undefined) {
      const parsedDate = new Date(body.purchaseDate)
      if (isNaN(parsedDate.getTime())) {
        return NextResponse.json({ error: 'Invalid purchaseDate format' }, { status: 400 })
      }
      data.purchaseDate = parsedDate
    }
    if (body.supplier !== undefined) data.supplier = body.supplier
    if (body.notes !== undefined) data.notes = body.notes

    const part = await db.part.update({
      where: { id },
      data,
      include: { vehicle: true },
    })
    return NextResponse.json(part)
  } catch (e) {
    console.error('Failed to update part:', e)
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
