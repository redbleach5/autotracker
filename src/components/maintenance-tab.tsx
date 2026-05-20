'use client'

import { useApi } from '@/hooks/use-api'
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
  Wrench,
  Plus,
  Clock,
  Gauge,
  AlertTriangle,
  CheckCircle2,
  Calendar,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { useState } from 'react'

interface Vehicle {
  id: string
  name: string
  brand: string
  model: string
}

interface MaintenanceSchedule {
  id: string
  vehicleId: string
  name: string
  description: string
  intervalMileage: number
  intervalMonths: number
  lastDate: string | null
  lastMileage: number
  nextDate: string | null
  nextMileage: number
  isActive: boolean
  vehicle: Vehicle
}

interface MaintenanceRecord {
  id: string
  vehicleId: string
  date: string
  mileage: number
  cost: number
  description: string
  workshop: string
  vehicle: Vehicle
  schedule: { id: string; name: string } | null
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
  if (!nextDate) return { label: 'Не задано', variant: 'secondary' as const, icon: Clock, color: 'text-gray-500' }
  const now = new Date()
  const next = new Date(nextDate)
  const diffDays = Math.ceil((next.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  if (diffDays < 0) return { label: `Просрочено ${Math.abs(diffDays)} дн.`, variant: 'destructive' as const, icon: AlertTriangle, color: 'text-red-500' }
  if (diffDays <= 7) return { label: `Через ${diffDays} дн.`, variant: 'default' as const, icon: AlertTriangle, color: 'text-amber-500' }
  if (diffDays <= 30) return { label: `Через ${diffDays} дн.`, variant: 'secondary' as const, icon: Clock, color: 'text-blue-500' }
  return { label: 'В норме', variant: 'outline' as const, icon: CheckCircle2, color: 'text-emerald-500' }
}

export function MaintenanceTab() {
  const { selectedVehicleId, setSelectedVehicleId, setAddMaintenanceScheduleOpen, setAddMaintenanceRecordOpen } = useAppStore()
  const { data: vehicles, loading: vehiclesLoading } = useApi<Vehicle[]>('/api/vehicles')

  const scheduleUrl = selectedVehicleId
    ? `/api/maintenance-schedules?vehicleId=${selectedVehicleId}`
    : '/api/maintenance-schedules'
  const recordsUrl = selectedVehicleId
    ? `/api/maintenance-records?vehicleId=${selectedVehicleId}`
    : '/api/maintenance-records'

  const { data: schedules, loading: schedulesLoading, refresh: refreshSchedules } = useApi<MaintenanceSchedule[]>(scheduleUrl)
  const { data: records, loading: recordsLoading, refresh: refreshRecords } = useApi<MaintenanceRecord[]>(recordsUrl)

  const [activeSection, setActiveSection] = useState<'schedules' | 'records'>('schedules')

  const handleDeleteSchedule = async (id: string) => {
    if (!confirm('Удалить расписание ТО?')) return
    try {
      const res = await fetch(`/api/maintenance-schedules/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      toast.success('Расписание удалено')
      refreshSchedules()
    } catch {
      toast.error('Ошибка удаления')
    }
  }

  const handleDeleteRecord = async (id: string) => {
    if (!confirm('Удалить запись ТО?')) return
    try {
      const res = await fetch(`/api/maintenance-records/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      toast.success('Запись удалена')
      refreshRecords()
    } catch {
      toast.error('Ошибка удаления')
    }
  }

  const isLoading = vehiclesLoading || schedulesLoading || recordsLoading

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key="maintenance"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.2 }}
        className="p-4 space-y-4"
      >
        {/* Vehicle selector */}
        <div className="flex items-center gap-2">
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
        </div>

        {/* Section toggle */}
        <div className="flex gap-2">
          <Button
            size="sm"
            variant={activeSection === 'schedules' ? 'default' : 'outline'}
            className={`flex-1 text-xs h-9 ${activeSection === 'schedules' ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : ''}`}
            onClick={() => setActiveSection('schedules')}
          >
            <Calendar className="h-3.5 w-3.5 mr-1" />
            Расписания
          </Button>
          <Button
            size="sm"
            variant={activeSection === 'records' ? 'default' : 'outline'}
            className={`flex-1 text-xs h-9 ${activeSection === 'records' ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : ''}`}
            onClick={() => setActiveSection('records')}
          >
            <Wrench className="h-3.5 w-3.5 mr-1" />
            Записи
          </Button>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-28 w-full rounded-xl" />
            ))}
          </div>
        ) : activeSection === 'schedules' ? (
          <>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">Расписания ТО</h3>
              <Button
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-700 text-white h-8 text-xs"
                onClick={() => setAddMaintenanceScheduleOpen(true)}
              >
                <Plus className="h-3.5 w-3.5 mr-1" />
                Добавить
              </Button>
            </div>
            {!schedules || schedules.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Calendar className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p className="text-sm font-medium mb-1">Нет расписаний</p>
                <p className="text-xs">Создайте расписание для отслеживания ТО</p>
              </div>
            ) : (
              <div className="space-y-2">
                {schedules.map((schedule) => {
                  const status = getScheduleStatus(schedule.nextDate)
                  const StatusIcon = status.icon
                  return (
                    <Card key={schedule.id} className="border-0 shadow-sm">
                      <CardContent className="p-3.5">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <StatusIcon className={`h-4 w-4 shrink-0 ${status.color}`} />
                              <h4 className="font-medium text-sm truncate">{schedule.name}</h4>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                              {!selectedVehicleId && `${schedule.vehicle.brand} ${schedule.vehicle.model} · `}
                              {schedule.intervalMileage > 0 && `каждые ${schedule.intervalMileage} км`}
                              {schedule.intervalMileage > 0 && schedule.intervalMonths > 0 && ' / '}
                              {schedule.intervalMonths > 0 && `каждые ${schedule.intervalMonths} мес.`}
                            </p>
                            <div className="flex flex-wrap gap-1.5 mt-2">
                              <Badge variant={status.variant} className="text-[10px]">
                                {status.label}
                              </Badge>
                              {schedule.nextMileage > 0 && (
                                <Badge variant="outline" className="text-[10px]">
                                  <Gauge className="h-3 w-3 mr-0.5" />
                                  {schedule.nextMileage} км
                                </Badge>
                              )}
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                            onClick={() => handleDeleteSchedule(schedule.id)}
                          >
                            ×
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}
          </>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">Записи ТО</h3>
              <Button
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-700 text-white h-8 text-xs"
                onClick={() => setAddMaintenanceRecordOpen(true)}
              >
                <Plus className="h-3.5 w-3.5 mr-1" />
                Добавить
              </Button>
            </div>
            {!records || records.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Wrench className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p className="text-sm font-medium mb-1">Нет записей</p>
                <p className="text-xs">Добавьте запись о проведённом ТО</p>
              </div>
            ) : (
              <div className="space-y-2">
                {records.map((record) => (
                  <Card key={record.id} className="border-0 shadow-sm">
                    <CardContent className="p-3.5">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm">
                            {record.schedule?.name || 'ТО'}
                          </h4>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {!selectedVehicleId && `${record.vehicle.brand} ${record.vehicle.model} · `}
                            {formatDate(record.date)} · {new Intl.NumberFormat('ru-RU').format(record.mileage)} км
                          </p>
                          {record.workshop && (
                            <p className="text-xs text-muted-foreground">🔧 {record.workshop}</p>
                          )}
                          {record.description && (
                            <p className="text-xs text-muted-foreground mt-0.5">{record.description}</p>
                          )}
                        </div>
                        <div className="flex flex-col items-end gap-1 ml-2">
                          <span className="text-sm font-semibold">{formatAmount(record.cost)}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                            onClick={() => handleDeleteRecord(record.id)}
                          >
                            ×
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}
      </motion.div>
    </AnimatePresence>
  )
}
