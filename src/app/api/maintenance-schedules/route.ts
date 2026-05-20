import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const vehicleId = searchParams.get('vehicleId')

    const where = vehicleId ? { vehicleId } : {}

    const schedules = await db.maintenanceSchedule.findMany({
      where,
      include: { vehicle: true },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(schedules)
  } catch {
    return NextResponse.json({ error: 'Failed to fetch schedules' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const schedule = await db.maintenanceSchedule.create({
      data: {
        vehicleId: body.vehicleId,
        name: body.name,
        description: body.description || '',
        intervalMileage: body.intervalMileage || 0,
        intervalMonths: body.intervalMonths || 0,
        lastDate: body.lastDate ? new Date(body.lastDate) : null,
        lastMileage: body.lastMileage || 0,
        nextDate: body.nextDate ? new Date(body.nextDate) : null,
        nextMileage: body.nextMileage || 0,
        isActive: body.isActive ?? true,
      },
      include: { vehicle: true },
    })
    return NextResponse.json(schedule, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Failed to create schedule' }, { status: 500 })
  }
}
