'use client'

import { useApi } from '@/hooks/use-api'
import { useAppStore } from '@/components/app-store'
import { Card, CardContent } from '@/components/ui/card'
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
  Receipt,
  Plus,
  Fuel,
  Car,
  Shield,
  AlertCircle,
  Droplets,
  ParkingCircle,
  Package,
  HelpCircle,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { useState, useMemo } from 'react'

interface Vehicle {
  id: string
  name: string
  brand: string
  model: string
}

interface Expense {
  id: string
  vehicleId: string
  category: string
  amount: number
  date: string
  description: string
  supplier: string
  vehicle: Vehicle
}

const categories = [
  { id: 'all', label: 'Все', icon: Receipt },
  { id: 'parts', label: 'Запчасти', icon: Package },
  { id: 'fuel', label: 'Топливо', icon: Fuel },
  { id: 'insurance', label: 'Страховка', icon: Shield },
  { id: 'fine', label: 'Штрафы', icon: AlertCircle },
  { id: 'wash', label: 'Мойка', icon: Droplets },
  { id: 'parking', label: 'Парковка', icon: ParkingCircle },
  { id: 'other', label: 'Другое', icon: HelpCircle },
]

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
  parts: 'bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400',
  fuel: 'bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400',
  insurance: 'bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400',
  fine: 'bg-red-50 dark:bg-red-950 text-red-600 dark:text-red-400',
  wash: 'bg-cyan-50 dark:bg-cyan-950 text-cyan-600 dark:text-cyan-400',
  parking: 'bg-gray-50 dark:bg-gray-950 text-gray-600 dark:text-gray-400',
  other: 'bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400',
}

function formatDate(dateStr: string) {
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

export function ExpensesTab() {
  const { selectedVehicleId, setSelectedVehicleId, setAddExpenseOpen } = useAppStore()
  const { data: vehicles, loading: vehiclesLoading } = useApi<Vehicle[]>('/api/vehicles')

  const [activeCategory, setActiveCategory] = useState('all')

  const expenseUrl = selectedVehicleId
    ? `/api/expenses?vehicleId=${selectedVehicleId}`
    : '/api/expenses'

  const { data: expenses, loading: expensesLoading, refresh: refreshExpenses } = useApi<Expense[]>(expenseUrl)

  const filteredExpenses = useMemo(() => {
    if (!expenses) return []
    if (activeCategory === 'all') return expenses
    return expenses.filter((e) => e.category === activeCategory)
  }, [expenses, activeCategory])

  const totalAmount = useMemo(() => {
    return filteredExpenses.reduce((sum, e) => sum + e.amount, 0)
  }, [filteredExpenses])

  const handleDelete = async (id: string) => {
    if (!confirm('Удалить расход?')) return
    try {
      const res = await fetch(`/api/expenses/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      toast.success('Расход удалён')
      refreshExpenses()
    } catch {
      toast.error('Ошибка удаления')
    }
  }

  const isLoading = vehiclesLoading || expensesLoading

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key="expenses"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.2 }}
        className="p-4 space-y-4"
      >
        {/* Vehicle selector */}
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

        {/* Category filter */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {categories.map((cat) => {
            const Icon = cat.icon
            const isActive = activeCategory === cat.id
            return (
              <Button
                key={cat.id}
                size="sm"
                variant={isActive ? 'default' : 'outline'}
                className={`shrink-0 h-8 text-xs px-3 ${
                  isActive ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : ''
                }`}
                onClick={() => setActiveCategory(cat.id)}
              >
                <Icon className="h-3 w-3 mr-1" />
                {cat.label}
              </Button>
            )
          })}
        </div>

        {/* Total */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">Итого</p>
            <p className="text-xl font-bold">{formatAmount(totalAmount)}</p>
          </div>
          <Button
            size="sm"
            className="bg-emerald-600 hover:bg-emerald-700 text-white h-9"
            onClick={() => setAddExpenseOpen(true)}
          >
            <Plus className="h-4 w-4 mr-1" />
            Добавить
          </Button>
        </div>

        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-16 w-full rounded-xl" />
            ))}
          </div>
        ) : filteredExpenses.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Receipt className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm font-medium mb-1">Нет расходов</p>
            <p className="text-xs">Добавьте первую запись о расходе</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-[calc(100vh-360px)] overflow-y-auto">
            {filteredExpenses.map((expense) => {
              const Icon = categoryIcons[expense.category] || HelpCircle
              const colorClass = categoryColors[expense.category] || categoryColors.other
              return (
                <Card key={expense.id} className="border-0 shadow-sm">
                  <CardContent className="p-3">
                    <div className="flex items-center gap-3">
                      <div className={`flex items-center justify-center w-9 h-9 rounded-lg shrink-0 ${colorClass}`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">
                          {categoryLabels[expense.category] || expense.category}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {!selectedVehicleId && `${expense.vehicle.brand} ${expense.vehicle.model} · `}
                          {formatDate(expense.date)}
                          {expense.description && ` · ${expense.description}`}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-0.5 ml-2">
                        <span className="text-sm font-semibold">{formatAmount(expense.amount)}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-5 w-5 p-0 text-muted-foreground hover:text-destructive"
                          onClick={() => handleDelete(expense.id)}
                        >
                          ×
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  )
}
