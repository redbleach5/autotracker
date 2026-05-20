import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const schedule = await db.maintenanceSchedule.update({
      where: { id },
      data: {
        name: body.name,
        description: body.description,
        intervalMileage: body.intervalMileage,
        intervalMonths: body.intervalMonths,
        lastDate: body.lastDate ? new Date(body.lastDate) : null,
        lastMileage: body.lastMileage,
        nextDate: body.nextDate ? new Date(body.nextDate) : null,
        nextMileage: body.nextMileage,
        isActive: body.isActive,
      },
      include: { vehicle: true },
    })
    return NextResponse.json(schedule)
  } catch {
    return NextResponse.json({ error: 'Failed to update schedule' }, { status: 500 })
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await db.maintenanceSchedule.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Failed to delete schedule' }, { status: 500 })
  }
}
