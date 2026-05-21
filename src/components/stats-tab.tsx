'use client'

import { useDbQuery } from '@/hooks/use-db'
import {
  getVehicles as getVehiclesService,
  getExpenses as getExpensesService,
  getMaintenanceRecords as getRecordsService,
  type Vehicle,
  type Expense,
  type MaintenanceRecord,
} from '@/lib/services'
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
import { BarChart3, TrendingUp, Wrench, Wallet } from 'lucide-react'
import { motion } from 'framer-motion'
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

function formatShortAmount(amount: number) {
  if (amount >= 1000000) return `${(amount / 1000000).toFixed(1)} млн ₽`
  if (amount >= 1000) return `${Math.round(amount / 1000)} тыс ₽`
  return `${amount} ₽`
}

const monthNames = ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек']

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
}

const item = {
  hidden: { opacity: 0, y: 6 },
  show: { opacity: 1, y: 0, transition: { duration: 0.2, ease: [0.22, 1, 0.36, 1] } },
}

// Custom tooltip component for charts
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-card border border-border rounded-xl px-3 py-2 shadow-lg">
      <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
      <p className="text-sm font-semibold tabular-nums">{formatAmount(payload[0].value)}</p>
    </div>
  )
}

function PieTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-card border border-border rounded-xl px-3 py-2 shadow-lg">
      <p className="text-xs font-medium">{payload[0].name}</p>
      <p className="text-sm font-semibold tabular-nums">{formatAmount(payload[0].value)}</p>
    </div>
  )
}

export function StatsTab() {
  const { selectedVehicleId, setSelectedVehicleId } = useAppStore()
  const { data: vehicles, loading: vehiclesLoading } = useDbQuery<Vehicle[]>(() => getVehiclesService())

  const { data: expenses, loading: expensesLoading } = useDbQuery<Expense[]>(
    () => getExpensesService(selectedVehicleId || undefined),
    [selectedVehicleId]
  )

  const { data: maintenanceRecords, loading: maintenanceLoading } = useDbQuery<MaintenanceRecord[]>(
    () => getRecordsService(selectedVehicleId || undefined),
    [selectedVehicleId]
  )

  const { pieData, barData, totalExpenses, totalMaintenance, averageMonthly } = useMemo(() => {
    if (!expenses) return { pieData: [], barData: [], totalExpenses: 0, totalMaintenance: 0, averageMonthly: 0 }

    // Pie chart data - expenses by category
    const categoryMap: Record<string, number> = {}
    expenses.forEach((e) => {
      const cat = categoryLabels[e.category] || e.category
      categoryMap[cat] = (categoryMap[cat] || 0) + e.amount
    })
    const pie = Object.entries(categoryMap)
      .sort(([,a], [,b]) => b - a)
      .map(([name, value], idx) => ({
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
      const [, month] = key.split('-')
      return {
        name: monthNames[parseInt(month) - 1],
        amount: Math.round(amount),
      }
    })

    const total = expenses.reduce((sum, e) => sum + e.amount, 0)
    const totalMaint = maintenanceRecords
      ? maintenanceRecords.reduce((sum, r) => sum + r.cost, 0)
      : 0

    const monthCount = bar.filter(b => b.amount > 0).length || 1
    const avg = Math.round(total / monthCount)

    return { pieData: pie, barData: bar, totalExpenses: total, totalMaintenance: totalMaint, averageMonthly: avg }
  }, [expenses, maintenanceRecords])

  const isLoading = vehiclesLoading || expensesLoading || maintenanceLoading

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="p-4 space-y-4"
    >
      {/* Vehicle selector */}
      <motion.div variants={item}>
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
      </motion.div>

      {isLoading ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Skeleton className="h-24 rounded-xl" />
            <Skeleton className="h-24 rounded-xl" />
          </div>
          <Skeleton className="h-56 w-full rounded-xl" />
          <Skeleton className="h-56 w-full rounded-xl" />
        </div>
      ) : !expenses || expenses.length === 0 ? (
        <motion.div variants={item} className="text-center py-16 text-muted-foreground">
          <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 mx-auto mb-4">
            <BarChart3 className="h-8 w-8 text-emerald-400" />
          </div>
          <p className="text-base font-medium mb-1">Нет данных</p>
          <p className="text-sm text-muted-foreground/70">Добавьте расходы для отображения статистики</p>
        </motion.div>
      ) : (
        <>
          {/* Summary Cards */}
          <motion.div variants={item}>
            <div className="grid grid-cols-3 gap-2.5">
              <Card className="border-0 shadow-sm card-hover">
                <CardContent className="p-3 text-center">
                  <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-rose-50 dark:bg-rose-950/50 mx-auto mb-2">
                    <Wallet className="h-4 w-4 text-rose-600 dark:text-rose-400" />
                  </div>
                  <p className="text-sm font-bold tabular-nums">{formatShortAmount(totalExpenses)}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5 font-medium">Расходы</p>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-sm card-hover">
                <CardContent className="p-3 text-center">
                  <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 mx-auto mb-2">
                    <Wrench className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <p className="text-sm font-bold tabular-nums">{formatShortAmount(totalMaintenance)}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5 font-medium">На ТО</p>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-sm card-hover">
                <CardContent className="p-3 text-center">
                  <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/50 mx-auto mb-2">
                    <TrendingUp className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <p className="text-sm font-bold tabular-nums">{formatShortAmount(averageMonthly)}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5 font-medium">Среднее/мес.</p>
                </CardContent>
              </Card>
            </div>
          </motion.div>

          {/* Pie Chart */}
          <motion.div variants={item}>
            <Card className="border-0 shadow-sm overflow-hidden">
              <CardHeader className="pb-2 pt-4 px-4">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <div className="flex items-center justify-center w-6 h-6 rounded-lg bg-emerald-50 dark:bg-emerald-950/50">
                    <BarChart3 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  Расходы по категориям
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <div className="h-60">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={85}
                        paddingAngle={3}
                        dataKey="value"
                        stroke="none"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip content={<PieTooltip />} />
                      <Legend
                        verticalAlign="bottom"
                        height={48}
                        formatter={(value: string) => (
                          <span className="text-xs font-medium">{value}</span>
                        )}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Bar Chart */}
          <motion.div variants={item}>
            <Card className="border-0 shadow-sm overflow-hidden">
              <CardHeader className="pb-2 pt-4 px-4">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <div className="flex items-center justify-center w-6 h-6 rounded-lg bg-emerald-50 dark:bg-emerald-950/50">
                    <TrendingUp className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  Расходы по месяцам
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <div className="h-52">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={barData} barCategoryGap="20%">
                      <CartesianGrid
                        strokeDasharray="3 3"
                        vertical={false}
                        stroke="oklch(0.7 0 0 / 12%)"
                      />
                      <XAxis
                        dataKey="name"
                        fontSize={11}
                        tickLine={false}
                        axisLine={false}
                        tick={{ fill: 'oklch(0.5 0 0)' }}
                      />
                      <YAxis
                        fontSize={10}
                        tickLine={false}
                        axisLine={false}
                        tick={{ fill: 'oklch(0.5 0 0)' }}
                        tickFormatter={(v) => v >= 1000 ? `${Math.round(v / 1000)}к` : `${v}`}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar
                        dataKey="amount"
                        fill="#10b981"
                        radius={[6, 6, 0, 0]}
                        fillOpacity={0.9}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </>
      )}
    </motion.div>
  )
}
