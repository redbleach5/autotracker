import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const expense = await db.expense.update({
      where: { id },
      data: {
        category: body.category,
        amount: body.amount,
        date: new Date(body.date),
        description: body.description,
        supplier: body.supplier,
      },
      include: { vehicle: true },
    })
    return NextResponse.json(expense)
  } catch {
    return NextResponse.json({ error: 'Failed to update expense' }, { status: 500 })
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await db.expense.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Failed to delete expense' }, { status: 500 })
  }
}
