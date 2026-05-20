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
    const vehicle = await db.vehicle.update({
      where: { id },
      data: {
        name: body.name,
        brand: body.brand,
        model: body.model,
        year: body.year,
        vin: body.vin,
        licensePlate: body.licensePlate,
        currentMileage: body.currentMileage,
        color: body.color,
        fuelType: body.fuelType,
        imageUrl: body.imageUrl,
      },
    })
    return NextResponse.json(vehicle)
  } catch {
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
