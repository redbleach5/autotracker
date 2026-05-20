'use client'

import { useApi } from '@/hooks/use-api'
import { useAppStore } from '@/components/app-store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { BarChart3, TrendingUp } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useMemo } from 'react'
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'

interface Vehicle {
  id: string
  name: string
  brand: string
  model: string
}

interface Expense {
  id: string
  vehicleId: string
  category: string
  amount: number
  date: string
  description: string
  supplier: string
  vehicle: Vehicle
}

interface MaintenanceRecord {
  id: string
  vehicleId: string
  date: string
  cost: number
  description: string
  workshop: string
  vehicle: Vehicle
  schedule: { id: string; name: string } | null
}

const categoryLabels: Record<string, string> = {
  parts: 'Запчасти',
  fuel: 'Топливо',
  insurance: 'Страховка',
  fine: 'Штрафы',
  wash: 'Мойка',
  parking: 'Парковка',
  other: 'Другое',
}

const CHART_COLORS = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444', '#06b6d4', '#6b7280']

function formatAmount(amount: number) {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    maximumFractionDigits: 0,
  }).format(amount)
}

const monthNames = ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек']

export function StatsTab() {
  const { selectedVehicleId, setSelectedVehicleId } = useAppStore()
  const { data: vehicles, loading: vehiclesLoading } = useApi<Vehicle[]>('/api/vehicles')

  const expenseUrl = selectedVehicleId
    ? `/api/expenses?vehicleId=${selectedVehicleId}`
    : '/api/expenses'

  const maintenanceUrl = selectedVehicleId
    ? `/api/maintenance-records?vehicleId=${selectedVehicleId}`
    : '/api/maintenance-records'

  const { data: expenses, loading: expensesLoading } = useApi<Expense[]>(expenseUrl)
  const { data: maintenanceRecords, loading: maintenanceLoading } = useApi<MaintenanceRecord[]>(maintenanceUrl)

  const { pieData, barData, totalExpenses, totalMaintenance } = useMemo(() => {
    if (!expenses) return { pieData: [], barData: [], totalExpenses: 0, totalMaintenance: 0 }

    // Pie chart data - expenses by category
    const categoryMap: Record<string, number> = {}
    expenses.forEach((e) => {
      const cat = categoryLabels[e.category] || e.category
      categoryMap[cat] = (categoryMap[cat] || 0) + e.amount
    })
    const pie = Object.entries(categoryMap).map(([name, value], idx) => ({
      name,
      value: Math.round(value),
      color: CHART_COLORS[idx % CHART_COLORS.length],
    }))

    // Bar chart data - monthly expenses for last 6 months
    const now = new Date()
    const monthlyMap: Record<string, number> = {}
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      monthlyMap[key] = 0
    }
    expenses.forEach((e) => {
      const d = new Date(e.date)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      if (key in monthlyMap) {
        monthlyMap[key] += e.amount
      }
    })
    const bar = Object.entries(monthlyMap).map(([key, amount]) => {
      const [year, month] = key.split('-')
      return {
        name: monthNames[parseInt(month) - 1],
        amount: Math.round(amount),
      }
    })

    const total = expenses.reduce((sum, e) => sum + e.amount, 0)
    const totalMaint = maintenanceRecords
      ? maintenanceRecords.reduce((sum, r) => sum + r.cost, 0)
      : 0

    return { pieData: pie, barData: bar, totalExpenses: total, totalMaintenance: totalMaint }
  }, [expenses, maintenanceRecords])

  const isLoading = vehiclesLoading || expensesLoading || maintenanceLoading

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key="stats"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.2 }}
        className="p-4 space-y-4"
      >
        {/* Vehicle selector */}
        <Select
          value={selectedVehicleId || 'all'}
          onValueChange={(v) => setSelectedVehicleId(v === 'all' ? null : v)}
        >
          <SelectTrigger className="w-full h-10">
            <SelectValue placeholder="Все транспортные средства" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все транспортные средства</SelectItem>
            {vehicles?.map((v) => (
              <SelectItem key={v.id} value={v.id}>
                {v.brand} {v.model} ({v.name})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-48 w-full rounded-xl" />
            <Skeleton className="h-48 w-full rounded-xl" />
          </div>
        ) : !expenses || expenses.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <BarChart3 className="h-16 w-16 mx-auto mb-4 opacity-30" />
            <p className="text-base font-medium mb-1">Нет данных</p>
            <p className="text-sm">Добавьте расходы для отображения статистики</p>
          </div>
        ) : (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-2 gap-3">
              <Card className="border-0 shadow-sm">
                <CardContent className="p-4 text-center">
                  <TrendingUp className="h-5 w-5 text-rose-500 mx-auto mb-1" />
                  <p className="text-lg font-bold">{formatAmount(totalExpenses)}</p>
                  <p className="text-xs text-muted-foreground">Всего расходов</p>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-sm">
                <CardContent className="p-4 text-center">
                  <TrendingUp className="h-5 w-5 text-emerald-500 mx-auto mb-1" />
                  <p className="text-lg font-bold">{formatAmount(totalMaintenance)}</p>
                  <p className="text-xs text-muted-foreground">Затраты на ТО</p>
                </CardContent>
              </Card>
            </div>

            {/* Pie Chart */}
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-2 pt-4 px-4">
                <CardTitle className="text-sm font-semibold">Расходы по категориям</CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value: number) => formatAmount(value)}
                        contentStyle={{
                          borderRadius: '8px',
                          border: 'none',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                          fontSize: '12px',
                        }}
                      />
                      <Legend
                        verticalAlign="bottom"
                        height={36}
                        formatter={(value: string) => (
                          <span className="text-xs">{value}</span>
                        )}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Bar Chart */}
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-2 pt-4 px-4">
                <CardTitle className="text-sm font-semibold">Расходы по месяцам</CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={barData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="name" fontSize={11} tickLine={false} axisLine={false} />
                      <YAxis fontSize={11} tickLine={false} axisLine={false} />
                      <Tooltip
                        formatter={(value: number) => formatAmount(value)}
                        contentStyle={{
                          borderRadius: '8px',
                          border: 'none',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                          fontSize: '12px',
                        }}
                      />
                      <Bar dataKey="amount" fill="#10b981" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </motion.div>
    </AnimatePresence>
  )
}
