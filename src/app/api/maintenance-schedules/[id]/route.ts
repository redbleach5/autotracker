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
    if (body.description !== undefined) data.description = body.description
    if (body.intervalMileage !== undefined) data.intervalMileage = parseInt(body.intervalMileage) || 0
    if (body.intervalMonths !== undefined) data.intervalMonths = parseInt(body.intervalMonths) || 0
    if (body.lastDate !== undefined) {
      data.lastDate = body.lastDate ? new Date(body.lastDate) : null
    }
    if (body.lastMileage !== undefined) data.lastMileage = parseInt(body.lastMileage) || 0
    if (body.nextDate !== undefined) {
      data.nextDate = body.nextDate ? new Date(body.nextDate) : null
    }
    if (body.nextMileage !== undefined) data.nextMileage = parseInt(body.nextMileage) || 0
    if (body.isActive !== undefined) data.isActive = body.isActive

    const schedule = await db.maintenanceSchedule.update({
      where: { id },
      data,
      include: { vehicle: true },
    })
    return NextResponse.json(schedule)
  } catch (e) {
    console.error('Failed to update schedule:', e)
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
