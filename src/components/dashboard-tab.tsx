'use client'

import { useDbQuery } from '@/hooks/use-db'
import { getDashboardData, type DashboardData } from '@/lib/services'
import { useAppStore } from '@/components/app-store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import Image from 'next/image'
import {
  Car,
  Wrench,
  Receipt,
  TrendingUp,
  AlertTriangle,
  Clock,
  Plus,
  ChevronRight,
  Calendar,
  Fuel,
  Shield,
  Package,
  Droplets,
  ParkingCircle,
  AlertCircle,
  HelpCircle,
  Download,
} from 'lucide-react'
import { motion } from 'framer-motion'
import { CURRENT_VERSION } from '@/lib/update-service'

const categoryLabels: Record<string, string> = {
  parts: 'Запчасти',
  fuel: 'Топливо',
  insurance: 'Страховка',
  fine: 'Штрафы',
  wash: 'Мойка',
  parking: 'Парковка',
  other: 'Другое',
}

const categoryIcons: Record<string, React.ElementType> = {
  parts: Package,
  fuel: Fuel,
  insurance: Shield,
  fine: AlertCircle,
  wash: Droplets,
  parking: ParkingCircle,
  other: HelpCircle,
}

const categoryColors: Record<string, string> = {
  parts: 'bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400',
  fuel: 'bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400',
  insurance: 'bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400',
  fine: 'bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400',
  wash: 'bg-cyan-50 dark:bg-cyan-950/50 text-cyan-600 dark:text-cyan-400',
  parking: 'bg-gray-50 dark:bg-gray-800/50 text-gray-600 dark:text-gray-400',
  other: 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400',
}

function formatDate(dateStr: string | Date) {
  return new Date(dateStr).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'short',
  })
}

function formatAmount(amount: number) {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    maximumFractionDigits: 0,
  }).format(amount)
}

function formatShortAmount(amount: number) {
  if (amount >= 1000000) return `${(amount / 1000000).toFixed(1)} млн`
  if (amount >= 1000) return `${Math.round(amount / 1000)} тыс`
  return `${amount}`
}

function getScheduleStatus(nextDate: string | Date | null) {
  if (!nextDate) return { label: 'Не задано', variant: 'secondary' as const, color: '' }
  const now = new Date()
  const next = new Date(nextDate)
  const diffDays = Math.ceil((next.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  if (diffDays < 0) return { label: 'Просрочено', variant: 'destructive' as const, color: 'text-red-500' }
  if (diffDays <= 7) return { label: 'Скоро', variant: 'default' as const, color: 'text-amber-500' }
  if (diffDays <= 30) return { label: `${diffDays} дн.`, variant: 'secondary' as const, color: '' }
  return { label: 'В норме', variant: 'outline' as const, color: 'text-emerald-500' }
}

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
}

const item = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: 0.25, ease: [0.22, 1, 0.36, 1] } },
}

export function DashboardTab() {
  const { data, loading } = useDbQuery<DashboardData>(() => getDashboardData())
  const { setActiveTab, setAddVehicleOpen, setAddExpenseOpen, setAddMaintenanceRecordOpen, updateAvailable, updateInfo, setUpdateDialogOpen } = useAppStore()

  if (loading) {
    return (
      <div className="p-4 space-y-4">
        <Skeleton className="h-32 w-full rounded-2xl" />
        <div className="grid grid-cols-3 gap-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-36 w-full rounded-xl" />
        <Skeleton className="h-36 w-full rounded-xl" />
      </div>
    )
  }

  if (!data) return null

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="p-4 space-y-4"
    >
      {/* Welcome Card */}
      <motion.div variants={item}>
        <Card className="bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-700 border-0 text-white overflow-hidden relative shadow-lg shadow-emerald-200/40 dark:shadow-emerald-900/30">
          <div className="absolute top-0 right-0 w-40 h-40 bg-white/8 rounded-full -translate-y-12 translate-x-12" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-8 -translate-x-8" />
          <div className="absolute top-1/2 right-4 w-16 h-16 bg-white/5 rounded-full" />
          <CardContent className="p-5 relative z-10">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-bold tracking-tight">AutoTracker</h1>
                  <span className="text-[10px] font-mono bg-white/15 px-1.5 py-0.5 rounded-md">v{CURRENT_VERSION.version}</span>
                </div>
                <p className="text-emerald-100/90 mt-0.5 text-sm">Учёт ТО и расходов автомобиля</p>
              </div>
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-white/15">
                <Image src="/logo-icon.png" alt="AutoTracker" width={28} height={28} className="rounded-lg" />
              </div>
            </div>
            <div className="flex flex-wrap gap-2 mt-4">
              <Button
                size="sm"
                className="bg-white/20 hover:bg-white/30 text-white border-0 h-8 text-xs backdrop-blur-sm"
                onClick={() => setAddVehicleOpen(true)}
              >
                <Plus className="h-3.5 w-3.5 mr-1" />
                Транспорт
              </Button>
              <Button
                size="sm"
                className="bg-white/20 hover:bg-white/30 text-white border-0 h-8 text-xs backdrop-blur-sm"
                onClick={() => setAddExpenseOpen(true)}
              >
                <Plus className="h-3.5 w-3.5 mr-1" />
                Расход
              </Button>
              <Button
                size="sm"
                className="bg-white/20 hover:bg-white/30 text-white border-0 h-8 text-xs backdrop-blur-sm"
                onClick={() => setAddMaintenanceRecordOpen(true)}
              >
                <Plus className="h-3.5 w-3.5 mr-1" />
                ТО
              </Button>
              {updateAvailable && updateInfo && (
                <Button
                  size="sm"
                  className={`h-8 text-xs backdrop-blur-sm ${
                    updateInfo.isCritical
                      ? 'bg-red-500/60 hover:bg-red-500/80 text-white border-0'
                      : 'bg-white/20 hover:bg-white/30 text-white border-0'
                  }`}
                  onClick={() => setUpdateDialogOpen(true)}
                >
                  <Download className="h-3.5 w-3.5 mr-1" />
                  v{updateInfo.version}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Stats Cards */}
      <motion.div variants={item}>
        <div className="grid grid-cols-3 gap-2.5">
          <Card className="border-0 shadow-sm card-hover">
            <CardContent className="p-3 text-center">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 mx-auto mb-2">
                <Car className="h-4.5 w-4.5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <p className="text-2xl font-bold tabular-nums">{data.totalVehicles}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5 font-medium">Транспорт</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm card-hover">
            <CardContent className="p-3 text-center">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/50 mx-auto mb-2">
                <AlertTriangle className="h-4.5 w-4.5 text-amber-600 dark:text-amber-400" />
              </div>
              <p className="text-2xl font-bold tabular-nums">{data.upcomingMaintenance.length}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5 font-medium">Ближайшее ТО</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm card-hover">
            <CardContent className="p-3 text-center">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/50 mx-auto mb-2">
                <TrendingUp className="h-4.5 w-4.5 text-rose-600 dark:text-rose-400" />
              </div>
              <p className="text-lg font-bold tabular-nums">{formatShortAmount(data.totalExpensesThisMonth)}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5 font-medium">₽ за месяц</p>
            </CardContent>
          </Card>
        </div>
      </motion.div>

      {/* Upcoming Maintenance */}
      <motion.div variants={item}>
        <Card className="border-0 shadow-sm overflow-hidden">
          <CardHeader className="pb-2 pt-4 px-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <div className="flex items-center justify-center w-6 h-6 rounded-lg bg-amber-50 dark:bg-amber-950/50">
                  <Clock className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                </div>
                Ближайшее ТО
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs text-emerald-600 dark:text-emerald-400 gap-0.5 pr-1"
                onClick={() => setActiveTab('maintenance')}
              >
                Все
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            {data.upcomingMaintenance.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 mx-auto mb-3">
                  <Wrench className="h-6 w-6 text-emerald-400" />
                </div>
                <p className="text-sm font-medium">Нет ближайшего ТО</p>
                <p className="text-xs text-muted-foreground/70 mt-1">Все обслуживания в порядке</p>
              </div>
            ) : (
              <div className="space-y-2">
                {data.upcomingMaintenance.map((schedule) => {
                  const status = getScheduleStatus(schedule.nextDate)
                  return (
                    <div
                      key={schedule.id}
                      className="flex items-center gap-3 p-2.5 rounded-xl bg-muted/40 card-hover"
                    >
                      <div className={`flex items-center justify-center w-9 h-9 rounded-lg shrink-0 ${
                        schedule.nextDate && new Date(schedule.nextDate) < new Date()
                          ? 'bg-red-50 dark:bg-red-950/50'
                          : 'bg-muted'
                      }`}>
                        <Calendar className={`h-4 w-4 ${
                          schedule.nextDate && new Date(schedule.nextDate) < new Date()
                            ? 'text-red-500'
                            : 'text-muted-foreground'
                        }`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{schedule.name}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {schedule.vehicle.brand} {schedule.vehicle.model}
                          {schedule.nextDate && ` · ${formatDate(schedule.nextDate)}`}
                        </p>
                      </div>
                      <Badge
                        variant={status.variant}
                        className={`text-[10px] shrink-0 font-medium ${status.color ? `border-0 ${status.color} bg-opacity-10` : ''}`}
                      >
                        {status.label}
                      </Badge>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Recent Expenses */}
      <motion.div variants={item}>
        <Card className="border-0 shadow-sm overflow-hidden">
          <CardHeader className="pb-2 pt-4 px-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <div className="flex items-center justify-center w-6 h-6 rounded-lg bg-rose-50 dark:bg-rose-950/50">
                  <Receipt className="h-3.5 w-3.5 text-rose-600 dark:text-rose-400" />
                </div>
                Последние расходы
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs text-emerald-600 dark:text-emerald-400 gap-0.5 pr-1"
                onClick={() => setActiveTab('expenses')}
              >
                Все
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            {data.recentExpenses.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 mx-auto mb-3">
                  <Receipt className="h-6 w-6 text-emerald-400" />
                </div>
                <p className="text-sm font-medium">Нет расходов</p>
                <p className="text-xs text-muted-foreground/70 mt-1">Добавьте первую запись</p>
              </div>
            ) : (
              <div className="space-y-2">
                {data.recentExpenses.map((expense) => {
                  const Icon = categoryIcons[expense.category] || HelpCircle
                  const colorClass = categoryColors[expense.category] || categoryColors.other
                  return (
                    <div
                      key={expense.id}
                      className="flex items-center gap-3 p-2.5 rounded-xl bg-muted/40 card-hover"
                    >
                      <div className={`flex items-center justify-center w-9 h-9 rounded-lg shrink-0 ${colorClass}`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {categoryLabels[expense.category] || expense.category}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {expense.vehicle.brand} {expense.vehicle.model}
                          {expense.description && ` · ${expense.description}`}
                        </p>
                      </div>
                      <span className="text-sm font-semibold tabular-nums ml-2 shrink-0">
                        {formatAmount(expense.amount)}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Recent Maintenance */}
      <motion.div variants={item}>
        <Card className="border-0 shadow-sm overflow-hidden">
          <CardHeader className="pb-2 pt-4 px-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <div className="flex items-center justify-center w-6 h-6 rounded-lg bg-emerald-50 dark:bg-emerald-950/50">
                  <Wrench className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                </div>
                Последние ТО
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs text-emerald-600 dark:text-emerald-400 gap-0.5 pr-1"
                onClick={() => setActiveTab('maintenance')}
              >
                Все
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            {data.recentMaintenance.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 mx-auto mb-3">
                  <Wrench className="h-6 w-6 text-emerald-400" />
                </div>
                <p className="text-sm font-medium">Нет записей ТО</p>
                <p className="text-xs text-muted-foreground/70 mt-1">Добавьте первую запись обслуживания</p>
              </div>
            ) : (
              <div className="space-y-2">
                {data.recentMaintenance.map((record) => (
                  <div
                    key={record.id}
                    className="flex items-center gap-3 p-2.5 rounded-xl bg-muted/40 card-hover"
                  >
                    <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 shrink-0">
                      <Wrench className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {record.schedule?.name || 'ТО'}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {record.vehicle.brand} {record.vehicle.model} · {formatDate(record.date)}
                        {record.workshop && ` · ${record.workshop}`}
                      </p>
                    </div>
                    <span className="text-sm font-semibold tabular-nums ml-2 shrink-0">
                      {formatAmount(record.cost)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  )
}
