'use client'

import { useApi } from '@/hooks/use-api'
import { useAppStore } from '@/components/app-store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Car,
  Wrench,
  Receipt,
  TrendingUp,
  AlertTriangle,
  Clock,
  Plus,
  ChevronRight,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface DashboardData {
  totalVehicles: number
  upcomingMaintenance: Array<{
    id: string
    name: string
    nextDate: string | null
    nextMileage: number
    vehicle: { id: string; name: string; brand: string; model: string }
  }>
  totalExpensesThisMonth: number
  expensesByCategory: Record<string, number>
  recentExpenses: Array<{
    id: string
    category: string
    amount: number
    date: string
    description: string
    vehicle: { id: string; name: string; brand: string; model: string }
  }>
  recentMaintenance: Array<{
    id: string
    date: string
    cost: number
    description: string
    workshop: string
    vehicle: { id: string; name: string; brand: string; model: string }
    schedule: { id: string; name: string } | null
  }>
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

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function formatAmount(amount: number) {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    maximumFractionDigits: 0,
  }).format(amount)
}

function getScheduleStatus(nextDate: string | null) {
  if (!nextDate) return { label: 'Не задано', variant: 'secondary' as const }
  const now = new Date()
  const next = new Date(nextDate)
  const diffDays = Math.ceil((next.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  if (diffDays < 0) return { label: 'Просрочено', variant: 'destructive' as const }
  if (diffDays <= 7) return { label: 'Скоро', variant: 'default' as const }
  if (diffDays <= 30) return { label: `${diffDays} дн.`, variant: 'secondary' as const }
  return { label: 'В норме', variant: 'outline' as const }
}

export function DashboardTab() {
  const { data, loading, refresh } = useApi<DashboardData>('/api/dashboard')
  const { setActiveTab, setAddVehicleOpen, setAddExpenseOpen, setAddMaintenanceRecordOpen } = useAppStore()

  if (loading) {
    return (
      <div className="p-4 space-y-4">
        <Skeleton className="h-28 w-full rounded-2xl" />
        <div className="grid grid-cols-3 gap-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-40 w-full rounded-xl" />
        <Skeleton className="h-40 w-full rounded-xl" />
      </div>
    )
  }

  if (!data) return null

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key="dashboard"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.2 }}
        className="p-4 space-y-4"
      >
        {/* Welcome Card */}
        <Card className="bg-gradient-to-br from-emerald-500 to-emerald-700 border-0 text-white overflow-hidden relative">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-8 translate-x-8" />
          <div className="absolute bottom-0 left-0 w-20 h-20 bg-white/5 rounded-full translate-y-6 -translate-x-6" />
          <CardContent className="p-6 relative z-10">
            <h1 className="text-2xl font-bold">AutoTracker</h1>
            <p className="text-emerald-100 mt-1 text-sm">Учёт ТО и расходов автомобиля</p>
            <div className="flex gap-2 mt-4">
              <Button
                size="sm"
                variant="secondary"
                className="bg-white/20 hover:bg-white/30 text-white border-0"
                onClick={() => setAddVehicleOpen(true)}
              >
                <Plus className="h-4 w-4 mr-1" />
                Транспорт
              </Button>
              <Button
                size="sm"
                variant="secondary"
                className="bg-white/20 hover:bg-white/30 text-white border-0"
                onClick={() => setAddExpenseOpen(true)}
              >
                <Plus className="h-4 w-4 mr-1" />
                Расход
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-3">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-3 text-center">
              <div className="flex items-center justify-center w-9 h-9 rounded-full bg-emerald-50 dark:bg-emerald-950 mx-auto mb-1.5">
                <Car className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <p className="text-2xl font-bold">{data.totalVehicles}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">Транспорт</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardContent className="p-3 text-center">
              <div className="flex items-center justify-center w-9 h-9 rounded-full bg-amber-50 dark:bg-amber-950 mx-auto mb-1.5">
                <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              </div>
              <p className="text-2xl font-bold">{data.upcomingMaintenance.length}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">Ближайшее ТО</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardContent className="p-3 text-center">
              <div className="flex items-center justify-center w-9 h-9 rounded-full bg-rose-50 dark:bg-rose-950 mx-auto mb-1.5">
                <TrendingUp className="h-4 w-4 text-rose-600 dark:text-rose-400" />
              </div>
              <p className="text-lg font-bold">{formatAmount(data.totalExpensesThisMonth)}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">За месяц</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 text-xs h-10"
            onClick={() => setAddVehicleOpen(true)}
          >
            <Car className="h-3.5 w-3.5 mr-1.5" />
            Добавить авто
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-1 text-xs h-10"
            onClick={() => setAddExpenseOpen(true)}
          >
            <Receipt className="h-3.5 w-3.5 mr-1.5" />
            Добавить расход
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-1 text-xs h-10"
            onClick={() => setAddMaintenanceRecordOpen(true)}
          >
            <Wrench className="h-3.5 w-3.5 mr-1.5" />
            Запись ТО
          </Button>
        </div>

        {/* Upcoming Maintenance */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2 pt-4 px-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Clock className="h-4 w-4 text-emerald-600" />
                Ближайшее ТО
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs text-emerald-600"
                onClick={() => setActiveTab('maintenance')}
              >
                Все <ChevronRight className="h-3 w-3 ml-0.5" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            {data.upcomingMaintenance.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">
                <Wrench className="h-8 w-8 mx-auto mb-2 opacity-40" />
                <p className="text-sm">Нет ближайшего ТО</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-52 overflow-y-auto">
                {data.upcomingMaintenance.map((schedule) => {
                  const status = getScheduleStatus(schedule.nextDate)
                  return (
                    <div
                      key={schedule.id}
                      className="flex items-center justify-between p-2.5 rounded-lg bg-muted/50"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{schedule.name}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {schedule.vehicle.brand} {schedule.vehicle.model}
                          {schedule.nextDate && ` · ${formatDate(schedule.nextDate)}`}
                        </p>
                      </div>
                      <Badge variant={status.variant} className="ml-2 text-[10px] shrink-0">
                        {status.label}
                      </Badge>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Expenses */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2 pt-4 px-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Receipt className="h-4 w-4 text-emerald-600" />
                Последние расходы
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs text-emerald-600"
                onClick={() => setActiveTab('expenses')}
              >
                Все <ChevronRight className="h-3 w-3 ml-0.5" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            {data.recentExpenses.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">
                <Receipt className="h-8 w-8 mx-auto mb-2 opacity-40" />
                <p className="text-sm">Нет расходов</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-52 overflow-y-auto">
                {data.recentExpenses.map((expense) => (
                  <div
                    key={expense.id}
                    className="flex items-center justify-between p-2.5 rounded-lg bg-muted/50"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {categoryLabels[expense.category] || expense.category}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {expense.vehicle.brand} {expense.vehicle.model}
                        {expense.description && ` · ${expense.description}`}
                      </p>
                    </div>
                    <span className="text-sm font-semibold ml-2 shrink-0">
                      {formatAmount(expense.amount)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Maintenance */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2 pt-4 px-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Wrench className="h-4 w-4 text-emerald-600" />
                Последние ТО
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs text-emerald-600"
                onClick={() => setActiveTab('maintenance')}
              >
                Все <ChevronRight className="h-3 w-3 ml-0.5" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            {data.recentMaintenance.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">
                <Wrench className="h-8 w-8 mx-auto mb-2 opacity-40" />
                <p className="text-sm">Нет записей ТО</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-52 overflow-y-auto">
                {data.recentMaintenance.map((record) => (
                  <div
                    key={record.id}
                    className="flex items-center justify-between p-2.5 rounded-lg bg-muted/50"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {record.schedule?.name || 'ТО'}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {record.vehicle.brand} {record.vehicle.model} · {formatDate(record.date)}
                        {record.workshop && ` · ${record.workshop}`}
                      </p>
                    </div>
                    <span className="text-sm font-semibold ml-2 shrink-0">
                      {formatAmount(record.cost)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </AnimatePresence>
  )
}
