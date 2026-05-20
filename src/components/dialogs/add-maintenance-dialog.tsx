'use client'

import { useAppStore } from '@/components/app-store'
import { useApi } from '@/hooks/use-api'
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

interface Vehicle {
  id: string
  name: string
  brand: string
  model: string
}

interface MaintenanceSchedule {
  id: string
  name: string
  vehicleId: string
}

export function AddMaintenanceDialog() {
  const {
    addMaintenanceScheduleOpen,
    setAddMaintenanceScheduleOpen,
    addMaintenanceRecordOpen,
    setAddMaintenanceRecordOpen,
    selectedVehicleId,
  } = useAppStore()

  const { data: vehicles } = useApi<Vehicle[]>('/api/vehicles')
  const { data: schedules } = useApi<MaintenanceSchedule[]>('/api/maintenance-schedules')

  const isSchedule = addMaintenanceScheduleOpen
  const isOpen = addMaintenanceScheduleOpen || addMaintenanceRecordOpen

  // Schedule form
  const [scheduleForm, setScheduleForm] = useState({
    vehicleId: '',
    name: '',
    description: '',
    intervalMileage: 0,
    intervalMonths: 0,
  })

  // Record form
  const [recordForm, setRecordForm] = useState({
    vehicleId: '',
    scheduleId: '',
    date: new Date().toISOString().split('T')[0],
    mileage: 0,
    cost: 0,
    description: '',
    workshop: '',
  })

  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (isOpen) {
      const defaultVehicleId = selectedVehicleId || vehicles?.[0]?.id || ''
      if (isSchedule) {
        setScheduleForm((prev) => ({ ...prev, vehicleId: defaultVehicleId }))
      } else {
        setRecordForm((prev) => ({
          ...prev,
          vehicleId: defaultVehicleId,
          date: new Date().toISOString().split('T')[0],
        }))
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
      const res = await fetch('/api/maintenance-schedules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(scheduleForm),
      })
      if (!res.ok) throw new Error()
      toast.success('Расписание создано')
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
      const res = await fetch('/api/maintenance-records', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(recordForm),
      })
      if (!res.ok) throw new Error()
      toast.success('Запись ТО добавлена')
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
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isSchedule ? (
              <>
                <Calendar className="h-5 w-5 text-emerald-600" />
                Добавить расписание ТО
              </>
            ) : (
              <>
                <Wrench className="h-5 w-5 text-emerald-600" />
                Добавить запись ТО
              </>
            )}
          </DialogTitle>
        </DialogHeader>

        {isSchedule ? (
          <form onSubmit={handleScheduleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Транспорт *</Label>
              <Select
                value={scheduleForm.vehicleId}
                onValueChange={(v) => setScheduleForm({ ...scheduleForm, vehicleId: v })}
              >
                <SelectTrigger>
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
              <Label htmlFor="scheduleName">Название *</Label>
              <Input
                id="scheduleName"
                placeholder="Замена масла"
                value={scheduleForm.name}
                onChange={(e) => setScheduleForm({ ...scheduleForm, name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="scheduleDesc">Описание</Label>
              <Input
                id="scheduleDesc"
                placeholder="Описание обслуживания"
                value={scheduleForm.description}
                onChange={(e) => setScheduleForm({ ...scheduleForm, description: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="intervalMileage">Интервал (км)</Label>
                <Input
                  id="intervalMileage"
                  type="number"
                  min={0}
                  value={scheduleForm.intervalMileage || ''}
                  onChange={(e) =>
                    setScheduleForm({ ...scheduleForm, intervalMileage: parseInt(e.target.value) || 0 })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="intervalMonths">Интервал (мес.)</Label>
                <Input
                  id="intervalMonths"
                  type="number"
                  min={0}
                  value={scheduleForm.intervalMonths || ''}
                  onChange={(e) =>
                    setScheduleForm({ ...scheduleForm, intervalMonths: parseInt(e.target.value) || 0 })
                  }
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <Button type="button" variant="outline" className="flex-1" onClick={handleClose}>
                Отмена
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                disabled={saving}
              >
                {saving ? 'Сохранение...' : 'Создать'}
              </Button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleRecordSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Транспорт *</Label>
              <Select
                value={recordForm.vehicleId}
                onValueChange={(v) => setRecordForm({ ...recordForm, vehicleId: v, scheduleId: '' })}
              >
                <SelectTrigger>
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
              <Label>Расписание ТО</Label>
              <Select
                value={recordForm.scheduleId || 'none'}
                onValueChange={(v) => setRecordForm({ ...recordForm, scheduleId: v === 'none' ? '' : v })}
              >
                <SelectTrigger>
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
                <Label htmlFor="recDate">Дата *</Label>
                <Input
                  id="recDate"
                  type="date"
                  value={recordForm.date}
                  onChange={(e) => setRecordForm({ ...recordForm, date: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="recMileage">Пробег (км)</Label>
                <Input
                  id="recMileage"
                  type="number"
                  min={0}
                  value={recordForm.mileage || ''}
                  onChange={(e) =>
                    setRecordForm({ ...recordForm, mileage: parseInt(e.target.value) || 0 })
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="recCost">Стоимость (₽)</Label>
              <Input
                id="recCost"
                type="number"
                min={0}
                step={0.01}
                value={recordForm.cost || ''}
                onChange={(e) => setRecordForm({ ...recordForm, cost: parseFloat(e.target.value) || 0 })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="recWorkshop">Автосервис</Label>
              <Input
                id="recWorkshop"
                placeholder="Название автосервиса"
                value={recordForm.workshop}
                onChange={(e) => setRecordForm({ ...recordForm, workshop: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="recDesc">Описание</Label>
              <Input
                id="recDesc"
                placeholder="Описание работ"
                value={recordForm.description}
                onChange={(e) => setRecordForm({ ...recordForm, description: e.target.value })}
              />
            </div>

            <div className="flex gap-2 pt-2">
              <Button type="button" variant="outline" className="flex-1" onClick={handleClose}>
                Отмена
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
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
