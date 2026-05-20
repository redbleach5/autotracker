'use client'

import { useAppStore } from '@/components/app-store'
import { useDbQuery } from '@/hooks/use-db'
import {
  getVehicles as getVehiclesService,
  getMaintenanceSchedules as getSchedulesService,
  getMaintenanceRecords as getRecordsService,
  createMaintenanceSchedule,
  createMaintenanceRecord,
  type Vehicle,
  type MaintenanceSchedule,
  type MaintenanceRecord,
} from '@/lib/services'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Wrench, Calendar } from 'lucide-react'

export function AddMaintenanceDialog() {
  const {
    addMaintenanceScheduleOpen,
    setAddMaintenanceScheduleOpen,
    addMaintenanceRecordOpen,
    setAddMaintenanceRecordOpen,
    selectedVehicleId,
  } = useAppStore()

  const { data: vehicles } = useDbQuery<Vehicle[]>(() => getVehiclesService())
  const { data: schedules, refresh: refreshSchedules } = useDbQuery<MaintenanceSchedule[]>(() => getSchedulesService(selectedVehicleId || undefined), [selectedVehicleId])
  const { refresh: refreshRecords } = useDbQuery<MaintenanceRecord[]>(() => getRecordsService(selectedVehicleId || undefined), [selectedVehicleId])

  const isSchedule = addMaintenanceScheduleOpen
  const isOpen = addMaintenanceScheduleOpen || addMaintenanceRecordOpen

  const [scheduleForm, setScheduleForm] = useState({
    vehicleId: '',
    name: '',
    description: '',
    intervalMileage: '' as string | number,
    intervalMonths: '' as string | number,
  })

  const [recordForm, setRecordForm] = useState({
    vehicleId: '',
    scheduleId: '',
    date: new Date().toISOString().split('T')[0],
    mileage: '' as string | number,
    cost: '' as string | number,
    description: '',
    workshop: '',
  })

  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (isOpen) {
      const defaultVehicleId = selectedVehicleId || vehicles?.[0]?.id || ''
      if (isSchedule) {
        setScheduleForm({
          vehicleId: defaultVehicleId,
          name: '',
          description: '',
          intervalMileage: '',
          intervalMonths: '',
        })
      } else {
        setRecordForm({
          vehicleId: defaultVehicleId,
          scheduleId: '',
          date: new Date().toISOString().split('T')[0],
          mileage: '',
          cost: '',
          description: '',
          workshop: '',
        })
      }
    }
  }, [isOpen, isSchedule, selectedVehicleId, vehicles])

  const handleClose = () => {
    setAddMaintenanceScheduleOpen(false)
    setAddMaintenanceRecordOpen(false)
  }

  const handleScheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!scheduleForm.vehicleId || !scheduleForm.name) {
      toast.error('Заполните обязательные поля: транспорт, название')
      return
    }

    setSaving(true)
    try {
      await createMaintenanceSchedule({
        vehicleId: scheduleForm.vehicleId,
        name: scheduleForm.name,
        description: scheduleForm.description,
        intervalMileage: parseInt(String(scheduleForm.intervalMileage)) || 0,
        intervalMonths: parseInt(String(scheduleForm.intervalMonths)) || 0,
      })
      toast.success('Расписание создано')
      refreshSchedules()
      handleClose()
    } catch {
      toast.error('Ошибка сохранения')
    } finally {
      setSaving(false)
    }
  }

  const handleRecordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!recordForm.vehicleId || !recordForm.date) {
      toast.error('Заполните обязательные поля: транспорт, дата')
      return
    }

    setSaving(true)
    try {
      await createMaintenanceRecord({
        vehicleId: recordForm.vehicleId,
        scheduleId: recordForm.scheduleId || null,
        date: recordForm.date,
        mileage: parseInt(String(recordForm.mileage)) || 0,
        cost: parseFloat(String(recordForm.cost)) || 0,
        description: recordForm.description,
        workshop: recordForm.workshop,
      })
      toast.success('Запись ТО добавлена')
      refreshRecords()
      handleClose()
    } catch {
      toast.error('Ошибка сохранения')
    } finally {
      setSaving(false)
    }
  }

  const filteredSchedules = schedules?.filter(
    (s) => s.vehicleId === recordForm.vehicleId
  )

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) handleClose() }}>
      <DialogContent className="bottom-sheet-content max-w-md">
        <div className="bottom-sheet-handle" />
        <DialogHeader className="pb-2">
          <DialogTitle className="flex items-center gap-2.5">
            {isSchedule ? (
              <>
                <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/50">
                  <Calendar className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                </div>
                Добавить расписание ТО
              </>
            ) : (
              <>
                <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/50">
                  <Wrench className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                </div>
                Добавить запись ТО
              </>
            )}
          </DialogTitle>
        </DialogHeader>

        {isSchedule ? (
          <form onSubmit={handleScheduleSubmit} className="space-y-4 px-1">
            <div className="space-y-2">
              <Label className="text-xs font-medium">Транспорт *</Label>
              <Select
                value={scheduleForm.vehicleId}
                onValueChange={(v) => setScheduleForm({ ...scheduleForm, vehicleId: v })}
              >
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Выберите транспорт" />
                </SelectTrigger>
                <SelectContent>
                  {vehicles?.map((v) => (
                    <SelectItem key={v.id} value={v.id}>
                      {v.brand} {v.model} ({v.name})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="scheduleName" className="text-xs font-medium">Название *</Label>
              <Input
                id="scheduleName"
                placeholder="Замена масла"
                value={scheduleForm.name}
                onChange={(e) => setScheduleForm({ ...scheduleForm, name: e.target.value })}
                className="h-10"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="scheduleDesc" className="text-xs font-medium">Описание</Label>
              <Input
                id="scheduleDesc"
                placeholder="Описание обслуживания"
                value={scheduleForm.description}
                onChange={(e) => setScheduleForm({ ...scheduleForm, description: e.target.value })}
                className="h-10"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="intervalMileage" className="text-xs font-medium">Интервал (км)</Label>
                <Input
                  id="intervalMileage"
                  type="number"
                  min={0}
                  placeholder="10000"
                  value={scheduleForm.intervalMileage}
                  onChange={(e) =>
                    setScheduleForm({ ...scheduleForm, intervalMileage: e.target.value })
                  }
                  className="h-10"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="intervalMonths" className="text-xs font-medium">Интервал (мес.)</Label>
                <Input
                  id="intervalMonths"
                  type="number"
                  min={0}
                  placeholder="12"
                  value={scheduleForm.intervalMonths}
                  onChange={(e) =>
                    setScheduleForm({ ...scheduleForm, intervalMonths: e.target.value })
                  }
                  className="h-10"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2 pb-2">
              <Button type="button" variant="outline" className="flex-1 h-11" onClick={handleClose}>
                Отмена
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white h-11 shadow-sm shadow-emerald-200/40 dark:shadow-emerald-900/30"
                disabled={saving}
              >
                {saving ? 'Сохранение...' : 'Создать'}
              </Button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleRecordSubmit} className="space-y-4 px-1">
            <div className="space-y-2">
              <Label className="text-xs font-medium">Транспорт *</Label>
              <Select
                value={recordForm.vehicleId}
                onValueChange={(v) => setRecordForm({ ...recordForm, vehicleId: v, scheduleId: '' })}
              >
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Выберите транспорт" />
                </SelectTrigger>
                <SelectContent>
                  {vehicles?.map((v) => (
                    <SelectItem key={v.id} value={v.id}>
                      {v.brand} {v.model} ({v.name})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-medium">Расписание ТО</Label>
              <Select
                value={recordForm.scheduleId || 'none'}
                onValueChange={(v) => setRecordForm({ ...recordForm, scheduleId: v === 'none' ? '' : v })}
              >
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Без расписания" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Без расписания</SelectItem>
                  {filteredSchedules?.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="recDate" className="text-xs font-medium">Дата *</Label>
                <Input
                  id="recDate"
                  type="date"
                  value={recordForm.date}
                  onChange={(e) => setRecordForm({ ...recordForm, date: e.target.value })}
                  className="h-10"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="recMileage" className="text-xs font-medium">Пробег (км)</Label>
                <Input
                  id="recMileage"
                  type="number"
                  min={0}
                  placeholder="0"
                  value={recordForm.mileage}
                  onChange={(e) =>
                    setRecordForm({ ...recordForm, mileage: e.target.value })
                  }
                  className="h-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="recCost" className="text-xs font-medium">Стоимость (₽)</Label>
              <Input
                id="recCost"
                type="number"
                min={0}
                step={0.01}
                placeholder="0"
                value={recordForm.cost}
                onChange={(e) => setRecordForm({ ...recordForm, cost: e.target.value })}
                className="h-10 text-lg font-semibold tabular-nums"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="recWorkshop" className="text-xs font-medium">Автосервис</Label>
              <Input
                id="recWorkshop"
                placeholder="Название автосервиса"
                value={recordForm.workshop}
                onChange={(e) => setRecordForm({ ...recordForm, workshop: e.target.value })}
                className="h-10"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="recDesc" className="text-xs font-medium">Описание</Label>
              <Input
                id="recDesc"
                placeholder="Описание работ"
                value={recordForm.description}
                onChange={(e) => setRecordForm({ ...recordForm, description: e.target.value })}
                className="h-10"
              />
            </div>

            <div className="flex gap-2 pt-2 pb-2">
              <Button type="button" variant="outline" className="flex-1 h-11" onClick={handleClose}>
                Отмена
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white h-11 shadow-sm shadow-emerald-200/40 dark:shadow-emerald-900/30"
                disabled={saving}
              >
                {saving ? 'Сохранение...' : 'Добавить'}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
