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
    if (body.category !== undefined) data.category = body.category
    if (body.amount !== undefined) data.amount = parseFloat(body.amount) || 0
    if (body.date !== undefined) {
      const parsedDate = new Date(body.date)
      if (isNaN(parsedDate.getTime())) {
        return NextResponse.json({ error: 'Invalid date format' }, { status: 400 })
      }
      data.date = parsedDate
    }
    if (body.description !== undefined) data.description = body.description
    if (body.supplier !== undefined) data.supplier = body.supplier

    const expense = await db.expense.update({
      where: { id },
      data,
      include: { vehicle: true },
    })
    return NextResponse.json(expense)
  } catch (e) {
    console.error('Failed to update expense:', e)
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
