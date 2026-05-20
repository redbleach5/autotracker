import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const vehicleId = searchParams.get('vehicleId')

    const where = vehicleId ? { vehicleId } : {}

    const records = await db.maintenanceRecord.findMany({
      where,
      include: { vehicle: true, schedule: true },
      orderBy: { date: 'desc' },
    })
    return NextResponse.json(records)
  } catch {
    return NextResponse.json({ error: 'Failed to fetch records' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const parsedDate = new Date(body.date)
    if (isNaN(parsedDate.getTime())) {
      return NextResponse.json({ error: 'Invalid date format' }, { status: 400 })
    }
    const record = await db.maintenanceRecord.create({
      data: {
        vehicleId: body.vehicleId,
        scheduleId: body.scheduleId || null,
        date: parsedDate,
        mileage: parseInt(body.mileage) || 0,
        cost: parseFloat(body.cost) || 0,
        description: body.description || '',
        workshop: body.workshop || '',
      },
      include: { vehicle: true, schedule: true },
    })

    // Update the schedule's last info if scheduleId is provided
    if (body.scheduleId) {
      await db.maintenanceSchedule.update({
        where: { id: body.scheduleId },
        data: {
          lastDate: parsedDate,
          lastMileage: parseInt(body.mileage) || 0,
        },
      })
    }

    return NextResponse.json(record, { status: 201 })
  } catch (e) {
    console.error('Failed to create record:', e)
    return NextResponse.json({ error: 'Failed to create record' }, { status: 500 })
  }
}
