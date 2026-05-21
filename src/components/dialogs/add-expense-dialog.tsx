'use client'

import { useAppStore } from '@/components/app-store'
import { useDbQuery } from '@/hooks/use-db'
import { getVehicles as getVehiclesService, createExpense, type Vehicle, type Expense, getExpenses } from '@/lib/services'
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
import { Receipt, Fuel, Package, Shield, AlertCircle, Droplets, ParkingCircle, HelpCircle } from 'lucide-react'

const expenseCategories = [
  { value: 'fuel', label: 'Топливо', icon: Fuel },
  { value: 'parts', label: 'Запчасти', icon: Package },
  { value: 'insurance', label: 'Страховка', icon: Shield },
  { value: 'wash', label: 'Мойка', icon: Droplets },
  { value: 'fine', label: 'Штрафы', icon: AlertCircle },
  { value: 'parking', label: 'Парковка', icon: ParkingCircle },
  { value: 'other', label: 'Другое', icon: HelpCircle },
]

export function AddExpenseDialog() {
  const { addExpenseOpen, setAddExpenseOpen, selectedVehicleId } = useAppStore()
  const { data: vehicles } = useDbQuery<Vehicle[]>(() => getVehiclesService())
  const { refresh: refreshExpenses } = useDbQuery<Expense[]>(() => getExpenses(selectedVehicleId || undefined), [selectedVehicleId])

  const [form, setForm] = useState({
    vehicleId: '',
    category: 'fuel',
    amount: '' as string | number,
    date: new Date().toISOString().split('T')[0],
    description: '',
    supplier: '',
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (addExpenseOpen) {
      setForm({
        vehicleId: selectedVehicleId || vehicles?.[0]?.id || '',
        category: 'fuel',
        amount: '',
        date: new Date().toISOString().split('T')[0],
        description: '',
        supplier: '',
      })
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
      await createExpense({
        vehicleId: form.vehicleId,
        category: form.category,
        amount: parseFloat(String(form.amount)) || 0,
        date: form.date,
        description: form.description,
        supplier: form.supplier,
      })
      toast.success('Расход добавлен')
      refreshExpenses()
      handleClose()
    } catch {
      toast.error('Ошибка сохранения')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={addExpenseOpen} onOpenChange={(open) => { if (!open) handleClose() }}>
      <DialogContent className="bottom-sheet-content max-w-md">
        <div className="bottom-sheet-handle" />
        <DialogHeader className="pb-2 px-4 pt-3 shrink-0">
          <DialogTitle className="flex items-center gap-2.5">
            <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/50">
              <Receipt className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            Добавить расход
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="bottom-sheet-scroll space-y-4 px-4 pb-4">
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

          <div className="space-y-2">
            <Label className="text-xs font-medium">Категория</Label>
            <div className="grid grid-cols-4 gap-1.5">
              {expenseCategories.map((cat) => {
                const Icon = cat.icon
                const isActive = form.category === cat.value
                return (
                  <button
                    key={cat.value}
                    type="button"
                    onClick={() => setForm({ ...form, category: cat.value })}
                    className={`flex flex-col items-center gap-1 p-2 rounded-xl text-[10px] font-medium transition-all duration-200 ${
                      isActive
                        ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 ring-1 ring-emerald-200 dark:ring-emerald-800'
                        : 'bg-muted/40 text-muted-foreground hover:bg-muted'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {cat.label}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="amount" className="text-xs font-medium">Сумма (₽) *</Label>
              <Input
                id="amount"
                type="number"
                min={0}
                step={0.01}
                placeholder="0"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                className="h-10 text-lg font-semibold tabular-nums"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="date" className="text-xs font-medium">Дата *</Label>
              <Input
                id="date"
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                className="h-10"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="text-xs font-medium">Описание</Label>
            <Input
              id="description"
              placeholder="Краткое описание"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="h-10"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="supplier" className="text-xs font-medium">Поставщик</Label>
            <Input
              id="supplier"
              placeholder="Название сервиса/магазина"
              value={form.supplier}
              onChange={(e) => setForm({ ...form, supplier: e.target.value })}
              className="h-10"
            />
          </div>

          <div className="flex gap-2 pt-2 pb-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1 h-11"
              onClick={handleClose}
            >
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
