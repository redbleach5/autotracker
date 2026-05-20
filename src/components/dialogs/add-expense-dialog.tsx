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
import { Receipt } from 'lucide-react'

interface Vehicle {
  id: string
  name: string
  brand: string
  model: string
}

const expenseCategories = [
  { value: 'parts', label: 'Запчасти' },
  { value: 'fuel', label: 'Топливо' },
  { value: 'insurance', label: 'Страховка' },
  { value: 'fine', label: 'Штрафы' },
  { value: 'wash', label: 'Мойка' },
  { value: 'parking', label: 'Парковка' },
  { value: 'other', label: 'Другое' },
]

export function AddExpenseDialog() {
  const { addExpenseOpen, setAddExpenseOpen, selectedVehicleId } = useAppStore()
  const { data: vehicles } = useApi<Vehicle[]>('/api/vehicles')

  const [form, setForm] = useState({
    vehicleId: '',
    category: 'fuel',
    amount: 0,
    date: new Date().toISOString().split('T')[0],
    description: '',
    supplier: '',
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (addExpenseOpen) {
      setForm((prev) => ({
        ...prev,
        vehicleId: selectedVehicleId || vehicles?.[0]?.id || '',
        date: new Date().toISOString().split('T')[0],
      }))
    }
  }, [addExpenseOpen, selectedVehicleId, vehicles])

  const handleClose = () => {
    setAddExpenseOpen(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.vehicleId || !form.amount || !form.date) {
      toast.error('Заполните обязательные поля: транспорт, сумма, дата')
      return
    }

    setSaving(true)
    try {
      const res = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error()
      toast.success('Расход добавлен')
      handleClose()
    } catch {
      toast.error('Ошибка сохранения')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={addExpenseOpen} onOpenChange={(open) => { if (!open) handleClose() }}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5 text-emerald-600" />
            Добавить расход
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
                {expenseCategories.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="amount">Сумма (₽) *</Label>
              <Input
                id="amount"
                type="number"
                min={0}
                step={0.01}
                value={form.amount || ''}
                onChange={(e) => setForm({ ...form, amount: parseFloat(e.target.value) || 0 })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="date">Дата *</Label>
              <Input
                id="date"
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Описание</Label>
            <Input
              id="description"
              placeholder="Краткое описание"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="supplier">Поставщик</Label>
            <Input
              id="supplier"
              placeholder="Название сервиса/магазина"
              value={form.supplier}
              onChange={(e) => setForm({ ...form, supplier: e.target.value })}
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
              {saving ? 'Сохранение...' : 'Добавить'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
