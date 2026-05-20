'use client'

import { useAppStore } from '@/components/app-store'
import { useDbQuery } from '@/hooks/use-db'
import { getVehicles as getVehiclesService, createPart, type Vehicle } from '@/lib/services'
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
import { Package } from 'lucide-react'

const partCategories = [
  { value: 'engine', label: 'Двигатель' },
  { value: 'brakes', label: 'Тормоза' },
  { value: 'suspension', label: 'Подвеска' },
  { value: 'electrical', label: 'Электрика' },
  { value: 'body', label: 'Кузов' },
  { value: 'interior', label: 'Салон' },
  { value: 'other', label: 'Другое' },
]

export function AddPartDialog() {
  const { addPartOpen, setAddPartOpen, selectedVehicleId } = useAppStore()
  const { data: vehicles } = useDbQuery<Vehicle[]>(() => getVehiclesService())

  const [form, setForm] = useState({
    vehicleId: '',
    name: '',
    partNumber: '',
    category: 'other',
    cost: 0,
    purchaseDate: new Date().toISOString().split('T')[0],
    supplier: '',
    notes: '',
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (addPartOpen) {
      setForm((prev) => ({
        ...prev,
        vehicleId: selectedVehicleId || vehicles?.[0]?.id || '',
        purchaseDate: new Date().toISOString().split('T')[0],
      }))
    }
  }, [addPartOpen, selectedVehicleId, vehicles])

  const handleClose = () => {
    setAddPartOpen(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.vehicleId || !form.name) {
      toast.error('Заполните обязательные поля: транспорт, название')
      return
    }

    setSaving(true)
    try {
      await createPart(form)
      toast.success('Запчасть добавлена')
      handleClose()
    } catch {
      toast.error('Ошибка сохранения')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={addPartOpen} onOpenChange={(open) => { if (!open) handleClose() }}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-emerald-600" />
            Добавить запчасть
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Транспорт *</Label>
            <Select
              value={form.vehicleId}
              onValueChange={(v) => setForm({ ...form, vehicleId: v })}
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

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="partName">Название *</Label>
              <Input
                id="partName"
                placeholder="Тормозные колодки"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="partNumber">Артикул</Label>
              <Input
                id="partNumber"
                placeholder="Номер детали"
                value={form.partNumber}
                onChange={(e) => setForm({ ...form, partNumber: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Категория</Label>
              <Select
                value={form.category}
                onValueChange={(v) => setForm({ ...form, category: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {partCategories.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="partCost">Стоимость (₽)</Label>
              <Input
                id="partCost"
                type="number"
                min={0}
                step={0.01}
                value={form.cost || ''}
                onChange={(e) => setForm({ ...form, cost: parseFloat(e.target.value) || 0 })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="purchaseDate">Дата покупки</Label>
              <Input
                id="purchaseDate"
                type="date"
                value={form.purchaseDate}
                onChange={(e) => setForm({ ...form, purchaseDate: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="partSupplier">Поставщик</Label>
              <Input
                id="partSupplier"
                placeholder="Магазин"
                value={form.supplier}
                onChange={(e) => setForm({ ...form, supplier: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="partNotes">Заметки</Label>
            <Input
              id="partNotes"
              placeholder="Дополнительные заметки"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
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
      </DialogContent>
    </Dialog>
  )
}
