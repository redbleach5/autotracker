import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const vehicle = await db.vehicle.findUnique({
      where: { id },
      include: {
        maintenanceSchedules: true,
        maintenanceRecords: { orderBy: { date: 'desc' } },
        expenses: { orderBy: { date: 'desc' } },
        parts: { orderBy: { purchaseDate: 'desc' } },
        _count: {
          select: { expenses: true, maintenanceRecords: true, parts: true },
        },
      },
    })
    if (!vehicle) {
      return NextResponse.json({ error: 'Vehicle not found' }, { status: 404 })
    }
    return NextResponse.json(vehicle)
  } catch {
    return NextResponse.json({ error: 'Failed to fetch vehicle' }, { status: 500 })
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const data: Record<string, unknown> = {}
    if (body.name !== undefined) data.name = body.name
    if (body.brand !== undefined) data.brand = body.brand
    if (body.model !== undefined) data.model = body.model
    if (body.year !== undefined) data.year = parseInt(body.year) || new Date().getFullYear()
    if (body.vin !== undefined) data.vin = body.vin
    if (body.licensePlate !== undefined) data.licensePlate = body.licensePlate
    if (body.currentMileage !== undefined) data.currentMileage = parseInt(body.currentMileage) || 0
    if (body.color !== undefined) data.color = body.color
    if (body.fuelType !== undefined) data.fuelType = body.fuelType
    if (body.imageUrl !== undefined) data.imageUrl = body.imageUrl

    const vehicle = await db.vehicle.update({
      where: { id },
      data,
    })
    return NextResponse.json(vehicle)
  } catch (e) {
    console.error('Failed to update vehicle:', e)
    return NextResponse.json({ error: 'Failed to update vehicle' }, { status: 500 })
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await db.vehicle.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Failed to delete vehicle' }, { status: 500 })
  }
}
