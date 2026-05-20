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
    const lastDate = body.lastDate ? new Date(body.lastDate) : null
    if (lastDate && isNaN(lastDate.getTime())) {
      return NextResponse.json({ error: 'Invalid lastDate format' }, { status: 400 })
    }
    const nextDate = body.nextDate ? new Date(body.nextDate) : null
    if (nextDate && isNaN(nextDate.getTime())) {
      return NextResponse.json({ error: 'Invalid nextDate format' }, { status: 400 })
    }
    const schedule = await db.maintenanceSchedule.create({
      data: {
        vehicleId: body.vehicleId,
        name: body.name,
        description: body.description || '',
        intervalMileage: parseInt(body.intervalMileage) || 0,
        intervalMonths: parseInt(body.intervalMonths) || 0,
        lastDate,
        lastMileage: parseInt(body.lastMileage) || 0,
        nextDate,
        nextMileage: parseInt(body.nextMileage) || 0,
        isActive: body.isActive ?? true,
      },
      include: { vehicle: true },
    })
    return NextResponse.json(schedule, { status: 201 })
  } catch (e) {
    console.error('Failed to create schedule:', e)
    return NextResponse.json({ error: 'Failed to create schedule' }, { status: 500 })
  }
}
