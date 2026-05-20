import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const vehicleId = searchParams.get('vehicleId')
    const category = searchParams.get('category')

    const where: Record<string, unknown> = {}
    if (vehicleId) where.vehicleId = vehicleId
    if (category) where.category = category

    const expenses = await db.expense.findMany({
      where,
      include: { vehicle: true },
      orderBy: { date: 'desc' },
    })
    return NextResponse.json(expenses)
  } catch {
    return NextResponse.json({ error: 'Failed to fetch expenses' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const expense = await db.expense.create({
      data: {
        vehicleId: body.vehicleId,
        category: body.category || 'other',
        amount: body.amount,
        date: new Date(body.date),
        description: body.description || '',
        supplier: body.supplier || '',
      },
      include: { vehicle: true },
    })
    return NextResponse.json(expense, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Failed to create expense' }, { status: 500 })
  }
}
