'use client'

import { useDbQuery } from '@/hooks/use-db'
import {
  getVehicles as getVehiclesService,
  getMaintenanceSchedules as getSchedulesService,
  getMaintenanceRecords as getRecordsService,
  deleteMaintenanceSchedule,
  deleteMaintenanceRecord,
  type Vehicle,
  type MaintenanceSchedule,
  type MaintenanceRecord,
} from '@/lib/services'
import { useAppStore } from '@/components/app-store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import {
  Wrench,
  Plus,
  Clock,
  Gauge,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Trash2,
  MapPin,
} from 'lucide-react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { useState } from 'react'

function formatDate(dateStr: string | Date) {
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

function getScheduleStatus(nextDate: string | Date | null) {
  if (!nextDate) return { label: 'Не задано', variant: 'secondary' as const, icon: Clock, color: 'text-gray-500', bg: 'bg-gray-50 dark:bg-gray-800/50', borderColor: 'border-l-gray-300' }
  const now = new Date()
  const next = new Date(nextDate)
  const diffDays = Math.ceil((next.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  if (diffDays < 0) return { label: `Просрочено ${Math.abs(diffDays)} дн.`, variant: 'destructive' as const, icon: AlertTriangle, color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-950/50', borderColor: 'border-l-red-400' }
  if (diffDays <= 7) return { label: `Через ${diffDays} дн.`, variant: 'default' as const, icon: AlertTriangle, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-950/50', borderColor: 'border-l-amber-400' }
  if (diffDays <= 30) return { label: `Через ${diffDays} дн.`, variant: 'secondary' as const, icon: Clock, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-950/50', borderColor: 'border-l-blue-400' }
  return { label: 'В норме', variant: 'outline' as const, icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-950/50', borderColor: 'border-l-emerald-400' }
}

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } },
}

const item = {
  hidden: { opacity: 0, y: 6 },
  show: { opacity: 1, y: 0, transition: { duration: 0.2, ease: [0.22, 1, 0.36, 1] } },
}

export function MaintenanceTab() {
  const { selectedVehicleId, setSelectedVehicleId, setAddMaintenanceScheduleOpen, setAddMaintenanceRecordOpen } = useAppStore()
  const { data: vehicles, loading: vehiclesLoading } = useDbQuery<Vehicle[]>(() => getVehiclesService())

  const { data: schedules, loading: schedulesLoading, refresh: refreshSchedules } = useDbQuery<MaintenanceSchedule[]>(
    () => getSchedulesService(selectedVehicleId || undefined),
    [selectedVehicleId]
  )

  const { data: records, loading: recordsLoading, refresh: refreshRecords } = useDbQuery<MaintenanceRecord[]>(
    () => getRecordsService(selectedVehicleId || undefined),
    [selectedVehicleId]
  )

  const [activeSection, setActiveSection] = useState<'schedules' | 'records'>('schedules')

  const handleDeleteSchedule = async (id: string) => {
    try {
      await deleteMaintenanceSchedule(id)
      toast.success('Расписание удалено')
      refreshSchedules()
    } catch {
      toast.error('Ошибка удаления')
    }
  }

  const handleDeleteRecord = async (id: string) => {
    try {
      await deleteMaintenanceRecord(id)
      toast.success('Запись удалена')
      refreshRecords()
    } catch {
      toast.error('Ошибка удаления')
    }
  }

  const vehicleMap = vehicles
    ? Object.fromEntries(vehicles.map(v => [v.id, v]))
    : {}

  const scheduleMap = schedules
    ? Object.fromEntries(schedules.map(s => [s.id, s]))
    : {}

  const isLoading = vehiclesLoading || schedulesLoading || recordsLoading

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

      {/* Section toggle */}
      <motion.div variants={item}>
        <div className="flex p-1 bg-muted/50 rounded-xl">
          <button
            className={`flex-1 flex items-center justify-center gap-1.5 text-xs h-9 rounded-lg font-medium transition-all duration-200 ${
              activeSection === 'schedules'
                ? 'bg-white dark:bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
            onClick={() => setActiveSection('schedules')}
          >
            <Calendar className="h-3.5 w-3.5" />
            Расписания
          </button>
          <button
            className={`flex-1 flex items-center justify-center gap-1.5 text-xs h-9 rounded-lg font-medium transition-all duration-200 ${
              activeSection === 'records'
                ? 'bg-white dark:bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
            onClick={() => setActiveSection('records')}
          >
            <Wrench className="h-3.5 w-3.5" />
            Записи
          </button>
        </div>
      </motion.div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-28 w-full rounded-xl" />
          ))}
        </div>
      ) : activeSection === 'schedules' ? (
        <>
          <motion.div variants={item} className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">Расписания ТО</h3>
            <Button
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-700 text-white h-8 text-xs shadow-sm shadow-emerald-200/40 dark:shadow-emerald-900/30"
              onClick={() => setAddMaintenanceScheduleOpen(true)}
            >
              <Plus className="h-3.5 w-3.5 mr-1" />
              Добавить
            </Button>
          </motion.div>
          {!schedules || schedules.length === 0 ? (
            <motion.div variants={item} className="text-center py-16 text-muted-foreground">
              <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 mx-auto mb-4">
                <Calendar className="h-7 w-7 text-emerald-400" />
              </div>
              <p className="text-base font-medium mb-1">Нет расписаний</p>
              <p className="text-sm text-muted-foreground/70">Создайте расписание для отслеживания ТО</p>
            </motion.div>
          ) : (
            <div className="space-y-2.5">
              {schedules.map((schedule) => {
                const status = getScheduleStatus(schedule.nextDate)
                const StatusIcon = status.icon
                const vehicle = vehicleMap[schedule.vehicleId]
                return (
                  <motion.div key={schedule.id} variants={item}>
                    <Card className={`border-0 shadow-sm card-hover overflow-hidden border-l-4 ${status.borderColor}`}>
                      <CardContent className="p-3.5">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <div className={`flex items-center justify-center w-7 h-7 rounded-lg shrink-0 ${status.bg}`}>
                                <StatusIcon className={`h-3.5 w-3.5 ${status.color}`} />
                              </div>
                              <h4 className="font-medium text-sm truncate">{schedule.name}</h4>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1.5 ml-9">
                              {!selectedVehicleId && vehicle && `${vehicle.brand} ${vehicle.model} · `}
                              {schedule.intervalMileage > 0 && `каждые ${new Intl.NumberFormat('ru-RU').format(schedule.intervalMileage)} км`}
                              {schedule.intervalMileage > 0 && schedule.intervalMonths > 0 && ' / '}
                              {schedule.intervalMonths > 0 && `каждые ${schedule.intervalMonths} мес.`}
                            </p>
                            <div className="flex flex-wrap gap-1.5 mt-2 ml-9">
                              <Badge variant={status.variant} className="text-[10px] font-medium">
                                {status.label}
                              </Badge>
                              {schedule.nextMileage > 0 && (
                                <Badge variant="outline" className="text-[10px]">
                                  <Gauge className="h-3 w-3 mr-0.5" />
                                  {new Intl.NumberFormat('ru-RU').format(schedule.nextMileage)} км
                                </Badge>
                              )}
                            </div>
                          </div>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 w-7 p-0 text-muted-foreground/40 hover:text-destructive shrink-0"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Удалить расписание?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Расписание &laquo;{schedule.name}&raquo; будет удалено безвозвратно.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Отмена</AlertDialogCancel>
                                <AlertDialogAction
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  onClick={() => handleDeleteSchedule(schedule.id)}
                                >
                                  Удалить
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )
              })}
            </div>
          )}
        </>
      ) : (
        <>
          <motion.div variants={item} className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">Записи ТО</h3>
            <Button
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-700 text-white h-8 text-xs shadow-sm shadow-emerald-200/40 dark:shadow-emerald-900/30"
              onClick={() => setAddMaintenanceRecordOpen(true)}
            >
              <Plus className="h-3.5 w-3.5 mr-1" />
              Добавить
            </Button>
          </motion.div>
          {!records || records.length === 0 ? (
            <motion.div variants={item} className="text-center py-16 text-muted-foreground">
              <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 mx-auto mb-4">
                <Wrench className="h-7 w-7 text-emerald-400" />
              </div>
              <p className="text-base font-medium mb-1">Нет записей</p>
              <p className="text-sm text-muted-foreground/70">Добавьте запись о проведённом ТО</p>
            </motion.div>
          ) : (
            <div className="space-y-2.5">
              {records.map((record) => {
                const vehicle = vehicleMap[record.vehicleId]
                const schedule = record.scheduleId ? scheduleMap[record.scheduleId] : null
                return (
                  <motion.div key={record.id} variants={item}>
                    <Card className="border-0 shadow-sm card-hover overflow-hidden border-l-4 border-l-emerald-400">
                      <CardContent className="p-3.5">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-2.5 flex-1 min-w-0">
                            <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 shrink-0 mt-0.5">
                              <Wrench className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium text-sm">
                                {schedule?.name || 'ТО'}
                              </h4>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {!selectedVehicleId && vehicle && `${vehicle.brand} ${vehicle.model} · `}
                                {formatDate(record.date)} · {new Intl.NumberFormat('ru-RU').format(record.mileage)} км
                              </p>
                              {record.workshop && (
                                <div className="flex items-center gap-1 mt-1">
                                  <MapPin className="h-3 w-3 text-muted-foreground" />
                                  <p className="text-xs text-muted-foreground">{record.workshop}</p>
                                </div>
                              )}
                              {record.description && (
                                <p className="text-xs text-muted-foreground/70 mt-0.5 truncate">{record.description}</p>
                              )}
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-1 ml-2 shrink-0">
                            <span className="text-sm font-semibold tabular-nums">{formatAmount(record.cost)}</span>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0 text-muted-foreground/40 hover:text-destructive"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Удалить запись?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Запись ТО будет удалена безвозвратно.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Отмена</AlertDialogCancel>
                                  <AlertDialogAction
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    onClick={() => handleDeleteRecord(record.id)}
                                  >
                                    Удалить
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )
              })}
            </div>
          )}
        </>
      )}
    </motion.div>
  )
}
