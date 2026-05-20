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
    cost: '' as string | number,
    purchaseDate: new Date().toISOString().split('T')[0],
    supplier: '',
    notes: '',
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (addPartOpen) {
      setForm({
        vehicleId: selectedVehicleId || vehicles?.[0]?.id || '',
        name: '',
        partNumber: '',
        category: 'other',
        cost: '',
        purchaseDate: new Date().toISOString().split('T')[0],
        supplier: '',
        notes: '',
      })
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
      await createPart({
        vehicleId: form.vehicleId,
        name: form.name,
        partNumber: form.partNumber,
        category: form.category,
        cost: parseFloat(String(form.cost)) || 0,
        purchaseDate: form.purchaseDate,
        supplier: form.supplier,
        notes: form.notes,
      })
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
      <DialogContent className="bottom-sheet-content max-w-md">
        <div className="bottom-sheet-handle" />
        <DialogHeader className="pb-2">
          <DialogTitle className="flex items-center gap-2.5">
            <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/50">
              <Package className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            Добавить запчасть
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 px-1">
          <div className="space-y-2">
            <Label className="text-xs font-medium">Транспорт *</Label>
            <Select
              value={form.vehicleId}
              onValueChange={(v) => setForm({ ...form, vehicleId: v })}
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

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="partName" className="text-xs font-medium">Название *</Label>
              <Input
                id="partName"
                placeholder="Тормозные колодки"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="h-10"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="partNumber" className="text-xs font-medium">Артикул</Label>
              <Input
                id="partNumber"
                placeholder="Номер детали"
                value={form.partNumber}
                onChange={(e) => setForm({ ...form, partNumber: e.target.value })}
                className="h-10 font-mono text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="text-xs font-medium">Категория</Label>
              <Select
                value={form.category}
                onValueChange={(v) => setForm({ ...form, category: v })}
              >
                <SelectTrigger className="h-10">
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
              <Label htmlFor="partCost" className="text-xs font-medium">Стоимость (₽)</Label>
              <Input
                id="partCost"
                type="number"
                min={0}
                step={0.01}
                placeholder="0"
                value={form.cost}
                onChange={(e) => setForm({ ...form, cost: e.target.value })}
                className="h-10 font-semibold tabular-nums"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="purchaseDate" className="text-xs font-medium">Дата покупки</Label>
              <Input
                id="purchaseDate"
                type="date"
                value={form.purchaseDate}
                onChange={(e) => setForm({ ...form, purchaseDate: e.target.value })}
                className="h-10"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="partSupplier" className="text-xs font-medium">Поставщик</Label>
              <Input
                id="partSupplier"
                placeholder="Магазин"
                value={form.supplier}
                onChange={(e) => setForm({ ...form, supplier: e.target.value })}
                className="h-10"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="partNotes" className="text-xs font-medium">Заметки</Label>
            <Input
              id="partNotes"
              placeholder="Дополнительные заметки"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
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
      </DialogContent>
    </Dialog>
  )
}
