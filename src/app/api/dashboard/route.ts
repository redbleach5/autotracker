import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const now = new Date()
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)

    const totalVehicles = await db.vehicle.count()

    const upcomingMaintenance = await db.maintenanceSchedule.findMany({
      where: {
        isActive: true,
        OR: [
          { nextDate: { lte: thirtyDaysFromNow } },
          { nextDate: null },
        ],
      },
      include: { vehicle: true },
      orderBy: { nextDate: 'asc' },
      take: 10,
    })

    const expensesThisMonth = await db.expense.findMany({
      where: {
        date: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      },
    })

    const totalExpensesThisMonth = expensesThisMonth.reduce((sum, e) => sum + e.amount, 0)

    // Group expenses by category
    const expensesByCategory = expensesThisMonth.reduce(
      (acc, e) => {
        acc[e.category] = (acc[e.category] || 0) + e.amount
        return acc
      },
      {} as Record<string, number>
    )

    const recentExpenses = await db.expense.findMany({
      include: { vehicle: true },
      orderBy: { date: 'desc' },
      take: 5,
    })

    const recentMaintenance = await db.maintenanceRecord.findMany({
      include: { vehicle: true, schedule: true },
      orderBy: { date: 'desc' },
      take: 5,
    })

    return NextResponse.json({
      totalVehicles,
      upcomingMaintenance,
      totalExpensesThisMonth,
      expensesByCategory,
      recentExpenses,
      recentMaintenance,
    })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch dashboard data' }, { status: 500 })
  }
}
