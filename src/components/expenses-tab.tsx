'use client'

import { useDbQuery } from '@/hooks/use-db'
import {
  getVehicles as getVehiclesService,
  getExpenses as getExpensesService,
  deleteExpense as deleteExpenseService,
  type Vehicle,
  type Expense,
} from '@/lib/services'
import { useAppStore } from '@/components/app-store'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
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
  Receipt,
  Plus,
  Fuel,
  Shield,
  AlertCircle,
  Droplets,
  ParkingCircle,
  Package,
  HelpCircle,
  Trash2,
} from 'lucide-react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { useState, useMemo } from 'react'

const categories = [
  { id: 'all', label: 'Все', icon: Receipt, color: '' },
  { id: 'fuel', label: 'Топливо', icon: Fuel, color: 'bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 ring-amber-200 dark:ring-amber-800' },
  { id: 'parts', label: 'Запчасти', icon: Package, color: 'bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 ring-blue-200 dark:ring-blue-800' },
  { id: 'insurance', label: 'Страховка', icon: Shield, color: 'bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 ring-purple-200 dark:ring-purple-800' },
  { id: 'wash', label: 'Мойка', icon: Droplets, color: 'bg-cyan-50 dark:bg-cyan-950/50 text-cyan-600 dark:text-cyan-400 ring-cyan-200 dark:ring-cyan-800' },
  { id: 'fine', label: 'Штрафы', icon: AlertCircle, color: 'bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400 ring-red-200 dark:ring-red-800' },
  { id: 'parking', label: 'Парковка', icon: ParkingCircle, color: 'bg-gray-50 dark:bg-gray-800/50 text-gray-600 dark:text-gray-400 ring-gray-200 dark:ring-gray-700' },
  { id: 'other', label: 'Другое', icon: HelpCircle, color: 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 ring-emerald-200 dark:ring-emerald-800' },
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
  parts: 'bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400',
  fuel: 'bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400',
  insurance: 'bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400',
  fine: 'bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400',
  wash: 'bg-cyan-50 dark:bg-cyan-950/50 text-cyan-600 dark:text-cyan-400',
  parking: 'bg-gray-50 dark:bg-gray-800/50 text-gray-600 dark:text-gray-400',
  other: 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400',
}

function formatDate(dateStr: string | Date) {
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

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.04 } },
}

const item = {
  hidden: { opacity: 0, y: 6 },
  show: { opacity: 1, y: 0, transition: { duration: 0.2, ease: [0.22, 1, 0.36, 1] } },
}

export function ExpensesTab() {
  const { selectedVehicleId, setSelectedVehicleId, setAddExpenseOpen } = useAppStore()
  const { data: vehicles, loading: vehiclesLoading } = useDbQuery<Vehicle[]>(() => getVehiclesService())

  const [activeCategory, setActiveCategory] = useState('all')

  const { data: expenses, loading: expensesLoading, refresh: refreshExpenses } = useDbQuery<Expense[]>(
    () => getExpensesService(selectedVehicleId || undefined),
    [selectedVehicleId]
  )

  const vehicleMap = vehicles
    ? Object.fromEntries(vehicles.map(v => [v.id, v]))
    : {}

  const filteredExpenses = useMemo(() => {
    if (!expenses) return []
    if (activeCategory === 'all') return expenses
    return expenses.filter((e) => e.category === activeCategory)
  }, [expenses, activeCategory])

  const totalAmount = useMemo(() => {
    return filteredExpenses.reduce((sum, e) => sum + e.amount, 0)
  }, [filteredExpenses])

  const handleDelete = async (id: string) => {
    try {
      await deleteExpenseService(id)
      toast.success('Расход удалён')
      refreshExpenses()
    } catch {
      toast.error('Ошибка удаления')
    }
  }

  const isLoading = vehiclesLoading || expensesLoading

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

      {/* Category filter */}
      <motion.div variants={item}>
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none -mx-1 px-1">
          {categories.map((cat) => {
            const Icon = cat.icon
            const isActive = activeCategory === cat.id
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`shrink-0 flex items-center gap-1.5 h-8 text-xs px-3 rounded-full transition-all duration-200 font-medium ${
                  isActive
                    ? cat.color
                      ? `${cat.color} ring-1`
                      : 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 ring-1 ring-emerald-200 dark:ring-emerald-800'
                    : 'bg-muted/50 text-muted-foreground hover:bg-muted'
                }`}
              >
                <Icon className="h-3 w-3" />
                {cat.label}
              </button>
            )
          })}
        </div>
      </motion.div>

      {/* Total & Add */}
      <motion.div variants={item}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground font-medium">Итого</p>
            <p className="text-2xl font-bold tabular-nums tracking-tight">{formatAmount(totalAmount)}</p>
          </div>
          <Button
            size="sm"
            className="bg-emerald-600 hover:bg-emerald-700 text-white h-9 shadow-sm shadow-emerald-200/40 dark:shadow-emerald-900/30"
            onClick={() => setAddExpenseOpen(true)}
          >
            <Plus className="h-4 w-4 mr-1" />
            Добавить
          </Button>
        </div>
      </motion.div>

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-16 w-full rounded-xl" />
          ))}
        </div>
      ) : filteredExpenses.length === 0 ? (
        <motion.div variants={item} className="text-center py-16 text-muted-foreground">
          <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 mx-auto mb-4">
            <Receipt className="h-7 w-7 text-emerald-400" />
          </div>
          <p className="text-base font-medium mb-1">Нет расходов</p>
          <p className="text-sm text-muted-foreground/70">Добавьте первую запись о расходе</p>
        </motion.div>
      ) : (
        <div className="space-y-2">
          {filteredExpenses.map((expense) => {
            const Icon = categoryIcons[expense.category] || HelpCircle
            const colorClass = categoryColors[expense.category] || categoryColors.other
            const vehicle = vehicleMap[expense.vehicleId]
            return (
              <motion.div
                key={expense.id}
                variants={item}
                className="group"
              >
                <Card className="border-0 shadow-sm card-hover overflow-hidden">
                  <CardContent className="p-3">
                    <div className="flex items-center gap-3">
                      <div className={`flex items-center justify-center w-10 h-10 rounded-xl shrink-0 ${colorClass}`}>
                        <Icon className="h-4.5 w-4.5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">
                          {categoryLabels[expense.category] || expense.category}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {!selectedVehicleId && vehicle && `${vehicle.brand} ${vehicle.model} · `}
                          {formatDate(expense.date)}
                          {expense.description && ` · ${expense.description}`}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 ml-2 shrink-0">
                        <span className="text-sm font-semibold tabular-nums">{formatAmount(expense.amount)}</span>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0 text-muted-foreground/40 hover:text-destructive transition-opacity"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Удалить расход?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Запись о расходе &laquo;{categoryLabels[expense.category] || expense.category}&raquo; на сумму {formatAmount(expense.amount)} будет удалена безвозвратно.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Отмена</AlertDialogCancel>
                              <AlertDialogAction
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                onClick={() => handleDelete(expense.id)}
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
    </motion.div>
  )
}
