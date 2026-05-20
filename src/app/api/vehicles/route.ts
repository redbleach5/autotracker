import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const vehicles = await db.vehicle.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { expenses: true, maintenanceRecords: true, parts: true },
        },
      },
    })
    return NextResponse.json(vehicles)
  } catch {
    return NextResponse.json({ error: 'Failed to fetch vehicles' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const vehicle = await db.vehicle.create({
      data: {
        name: body.name,
        brand: body.brand,
        model: body.model,
        year: parseInt(body.year) || new Date().getFullYear(),
        vin: body.vin || '',
        licensePlate: body.licensePlate || '',
        currentMileage: parseInt(body.currentMileage) || 0,
        color: body.color || '',
        fuelType: body.fuelType || 'petrol',
        imageUrl: body.imageUrl || '',
      },
    })
    return NextResponse.json(vehicle, { status: 201 })
  } catch (e) {
    console.error('Failed to create vehicle:', e)
    return NextResponse.json({ error: 'Failed to create vehicle' }, { status: 500 })
  }
}
