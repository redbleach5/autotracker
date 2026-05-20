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
    if (body.scheduleId !== undefined) data.scheduleId = body.scheduleId || null
    if (body.date !== undefined) {
      const parsedDate = new Date(body.date)
      if (isNaN(parsedDate.getTime())) {
        return NextResponse.json({ error: 'Invalid date format' }, { status: 400 })
      }
      data.date = parsedDate
    }
    if (body.mileage !== undefined) data.mileage = parseInt(body.mileage) || 0
    if (body.cost !== undefined) data.cost = parseFloat(body.cost) || 0
    if (body.description !== undefined) data.description = body.description
    if (body.workshop !== undefined) data.workshop = body.workshop

    const record = await db.maintenanceRecord.update({
      where: { id },
      data,
      include: { vehicle: true, schedule: true },
    })
    return NextResponse.json(record)
  } catch (e) {
    console.error('Failed to update record:', e)
    return NextResponse.json({ error: 'Failed to update record' }, { status: 500 })
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await db.maintenanceRecord.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Failed to delete record' }, { status: 500 })
  }
}
