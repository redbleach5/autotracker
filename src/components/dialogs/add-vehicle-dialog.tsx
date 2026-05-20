'use client'

import { useAppStore } from '@/components/app-store'
import { useDbQuery } from '@/hooks/use-db'
import { getVehicles as getVehiclesService, createVehicle, updateVehicle, type Vehicle } from '@/lib/services'
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
import { Car } from 'lucide-react'

const fuelTypes = [
  { value: 'petrol', label: 'Бензин' },
  { value: 'diesel', label: 'Дизель' },
  { value: 'gas', label: 'Газ' },
  { value: 'electric', label: 'Электро' },
  { value: 'hybrid', label: 'Гибрид' },
]

export function AddVehicleDialog() {
  const { addVehicleOpen, setAddVehicleOpen, editVehicleId, setEditVehicleId } = useAppStore()
  const { data: vehicles } = useDbQuery<Vehicle[]>(() => getVehiclesService())

  const editVehicle = editVehicleId
    ? vehicles?.find((v) => v.id === editVehicleId)
    : null

  const [form, setForm] = useState({
    name: '',
    brand: '',
    model: '',
    year: new Date().getFullYear(),
    vin: '',
    licensePlate: '',
    currentMileage: 0,
    color: '',
    fuelType: 'petrol',
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (editVehicle) {
      setForm({
        name: editVehicle.name,
        brand: editVehicle.brand,
        model: editVehicle.model,
        year: editVehicle.year,
        vin: editVehicle.vin,
        licensePlate: editVehicle.licensePlate,
        currentMileage: editVehicle.currentMileage,
        color: editVehicle.color,
        fuelType: editVehicle.fuelType,
      })
    } else if (addVehicleOpen && !editVehicleId) {
      setForm({
        name: '',
        brand: '',
        model: '',
        year: new Date().getFullYear(),
        vin: '',
        licensePlate: '',
        currentMileage: 0,
        color: '',
        fuelType: 'petrol',
      })
    }
  }, [editVehicle, addVehicleOpen, editVehicleId])

  const handleClose = () => {
    setAddVehicleOpen(false)
    setEditVehicleId(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.brand || !form.model || !form.year) {
      toast.error('Заполните обязательные поля: марка, модель, год')
      return
    }

    setSaving(true)
    try {
      if (editVehicleId) {
        await updateVehicle(editVehicleId, form)
        toast.success('Транспорт обновлён')
      } else {
        await createVehicle(form)
        toast.success('Транспорт добавлен')
      }
      handleClose()
    } catch {
      toast.error('Ошибка сохранения')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={addVehicleOpen} onOpenChange={(open) => { if (!open) handleClose() }}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Car className="h-5 w-5 text-emerald-600" />
            {editVehicleId ? 'Редактировать транспорт' : 'Добавить транспорт'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Название</Label>
            <Input
              id="name"
              placeholder="Мой автомобиль"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="brand">Марка *</Label>
              <Input
                id="brand"
                placeholder="Toyota"
                value={form.brand}
                onChange={(e) => setForm({ ...form, brand: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="model">Модель *</Label>
              <Input
                id="model"
                placeholder="Camry"
                value={form.model}
                onChange={(e) => setForm({ ...form, model: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="year">Год *</Label>
              <Input
                id="year"
                type="number"
                min={1900}
                max={2030}
                value={form.year}
                onChange={(e) => setForm({ ...form, year: parseInt(e.target.value) || 0 })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fuelType">Тип топлива</Label>
              <Select
                value={form.fuelType}
                onValueChange={(v) => setForm({ ...form, fuelType: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {fuelTypes.map((ft) => (
                    <SelectItem key={ft.value} value={ft.value}>
                      {ft.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="currentMileage">Пробег (км)</Label>
              <Input
                id="currentMileage"
                type="number"
                min={0}
                value={form.currentMileage}
                onChange={(e) => setForm({ ...form, currentMileage: parseInt(e.target.value) || 0 })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="color">Цвет</Label>
              <Input
                id="color"
                placeholder="Чёрный"
                value={form.color}
                onChange={(e) => setForm({ ...form, color: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="vin">VIN</Label>
            <Input
              id="vin"
              placeholder="VIN номер"
              value={form.vin}
              onChange={(e) => setForm({ ...form, vin: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="licensePlate">Гос. номер</Label>
            <Input
              id="licensePlate"
              placeholder="А 000 АА 00"
              value={form.licensePlate}
              onChange={(e) => setForm({ ...form, licensePlate: e.target.value })}
            />
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={handleClose}
            >
              Отмена
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
              disabled={saving}
            >
              {saving ? 'Сохранение...' : editVehicleId ? 'Сохранить' : 'Добавить'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
