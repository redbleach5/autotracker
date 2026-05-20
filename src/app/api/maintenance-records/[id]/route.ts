import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const record = await db.maintenanceRecord.update({
      where: { id },
      data: {
        scheduleId: body.scheduleId || null,
        date: new Date(body.date),
        mileage: body.mileage,
        cost: body.cost,
        description: body.description,
        workshop: body.workshop,
      },
      include: { vehicle: true, schedule: true },
    })
    return NextResponse.json(record)
  } catch {
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
