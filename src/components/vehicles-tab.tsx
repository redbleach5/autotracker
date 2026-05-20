'use client'

import { useDbQuery } from '@/hooks/use-db'
import { getVehicles, deleteVehicle as deleteVehicleService, type Vehicle } from '@/lib/services'
import { useAppStore } from '@/components/app-store'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Car,
  Plus,
  MoreVertical,
  Pencil,
  Trash2,
  Gauge,
  Fuel,
  Palette,
  Receipt,
  Wrench,
  Package,
  ChevronRight,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'

const fuelTypeLabels: Record<string, string> = {
  petrol: 'Бензин',
  diesel: 'Дизель',
  gas: 'Газ',
  electric: 'Электро',
  hybrid: 'Гибрид',
}

const fuelColors: Record<string, string> = {
  petrol: 'bg-orange-50 dark:bg-orange-950/50 text-orange-600 dark:text-orange-400',
  diesel: 'bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400',
  gas: 'bg-cyan-50 dark:bg-cyan-950/50 text-cyan-600 dark:text-cyan-400',
  electric: 'bg-green-50 dark:bg-green-950/50 text-green-600 dark:text-green-400',
  hybrid: 'bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400',
}

function formatMileage(km: number) {
  return new Intl.NumberFormat('ru-RU').format(km) + ' км'
}

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05 },
  },
}

const item = {
  hidden: { opacity: 0, y: 6 },
  show: { opacity: 1, y: 0, transition: { duration: 0.2, ease: [0.22, 1, 0.36, 1] } },
}

export function VehiclesTab() {
  const { data, loading, refresh } = useDbQuery<Vehicle[]>(() => getVehicles())
  const { selectedVehicleId, setSelectedVehicleId, setAddVehicleOpen, setEditVehicleId, setActiveTab } = useAppStore()

  const handleDelete = async (id: string) => {
    if (!confirm('Удалить транспортное средство? Все связанные данные будут удалены.')) return
    try {
      await deleteVehicleService(id)
      toast.success('Транспорт удалён')
      if (selectedVehicleId === id) setSelectedVehicleId(null)
      refresh()
    } catch {
      toast.error('Ошибка удаления')
    }
  }

  if (loading) {
    return (
      <div className="p-4 space-y-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-32 w-full rounded-xl" />
        ))}
      </div>
    )
  }

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="p-4 space-y-4"
    >
      <motion.div variants={item} className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Мой транспорт</h2>
        <Button
          size="sm"
          className="bg-emerald-600 hover:bg-emerald-700 text-white h-9 shadow-sm shadow-emerald-200/40 dark:shadow-emerald-900/30"
          onClick={() => setAddVehicleOpen(true)}
        >
          <Plus className="h-4 w-4 mr-1" />
          Добавить
        </Button>
      </motion.div>

      {!data || data.length === 0 ? (
        <motion.div variants={item} className="text-center py-16 text-muted-foreground">
          <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 mx-auto mb-4">
            <Car className="h-8 w-8 text-emerald-400" />
          </div>
          <p className="text-base font-medium mb-1">Нет транспортных средств</p>
          <p className="text-sm mb-4 text-muted-foreground/70">Добавьте ваш первый автомобиль</p>
          <Button
            className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
            onClick={() => setAddVehicleOpen(true)}
          >
            <Plus className="h-4 w-4 mr-1" />
            Добавить авто
          </Button>
        </motion.div>
      ) : (
        <div className="space-y-3">
          {data.map((vehicle) => {
            const isSelected = selectedVehicleId === vehicle.id
            const counts = (vehicle as any)._count as { expenses: number; maintenanceRecords: number; parts: number }
            return (
              <motion.div key={vehicle.id} variants={item}>
                <Card
                  className={`border-0 shadow-sm cursor-pointer transition-all duration-200 overflow-hidden ${
                    isSelected
                      ? 'ring-2 ring-emerald-500/60 shadow-emerald-100/50 dark:shadow-emerald-950/30'
                      : 'card-hover'
                  }`}
                  onClick={() => setSelectedVehicleId(isSelected ? null : vehicle.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 shrink-0">
                          <Car className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-sm">
                            {vehicle.name || `${vehicle.brand} ${vehicle.model}`}
                          </h3>
                          <p className="text-xs text-muted-foreground">
                            {vehicle.brand} {vehicle.model} · {vehicle.year}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation()
                                setEditVehicleId(vehicle.id)
                              }}
                            >
                              <Pencil className="h-4 w-4 mr-2" />
                              Редактировать
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleDelete(vehicle.id)
                              }}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Удалить
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>

                    <AnimatePresence>
                      {isSelected && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                          className="overflow-hidden"
                        >
                          <div className="mt-3 pt-3 border-t space-y-3">
                            <div className="grid grid-cols-2 gap-2">
                              <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/40">
                                <Gauge className="h-3.5 w-3.5 text-muted-foreground" />
                                <span className="text-xs text-muted-foreground">{formatMileage(vehicle.currentMileage)}</span>
                              </div>
                              <div className={`flex items-center gap-2 p-2 rounded-lg ${fuelColors[vehicle.fuelType] || 'bg-muted/40'}`}>
                                <Fuel className="h-3.5 w-3.5" />
                                <span className="text-xs">{fuelTypeLabels[vehicle.fuelType] || vehicle.fuelType}</span>
                              </div>
                              {vehicle.color && (
                                <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/40">
                                  <Palette className="h-3.5 w-3.5 text-muted-foreground" />
                                  <span className="text-xs text-muted-foreground">{vehicle.color}</span>
                                </div>
                              )}
                              {vehicle.licensePlate && (
                                <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/40">
                                  <span className="text-xs font-mono text-muted-foreground">{vehicle.licensePlate}</span>
                                </div>
                              )}
                            </div>

                            <div className="flex gap-2">
                              <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/50">
                                <Receipt className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                                <span className="text-xs font-medium text-blue-700 dark:text-blue-300">{counts?.expenses || 0}</span>
                                <span className="text-[10px] text-blue-600/70 dark:text-blue-400/70">расходов</span>
                              </div>
                              <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/50">
                                <Wrench className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                                <span className="text-xs font-medium text-amber-700 dark:text-amber-300">{counts?.maintenanceRecords || 0}</span>
                                <span className="text-[10px] text-amber-600/70 dark:text-amber-400/70">ТО</span>
                              </div>
                              <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-purple-50 dark:bg-purple-950/50">
                                <Package className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
                                <span className="text-xs font-medium text-purple-700 dark:text-purple-300">{counts?.parts || 0}</span>
                                <span className="text-[10px] text-purple-600/70 dark:text-purple-400/70">деталей</span>
                              </div>
                            </div>

                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                className="flex-1 h-8 text-xs gap-1"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setSelectedVehicleId(vehicle.id)
                                  setActiveTab('expenses')
                                }}
                              >
                                <Receipt className="h-3 w-3" />
                                Расходы
                                <ChevronRight className="h-3 w-3 opacity-40" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="flex-1 h-8 text-xs gap-1"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setSelectedVehicleId(vehicle.id)
                                  setActiveTab('maintenance')
                                }}
                              >
                                <Wrench className="h-3 w-3" />
                                ТО
                                <ChevronRight className="h-3 w-3 opacity-40" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="flex-1 h-8 text-xs gap-1"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setSelectedVehicleId(vehicle.id)
                                  setActiveTab('stats')
                                }}
                              >
                                <BarChart3Icon className="h-3 w-3" />
                                Статистика
                                <ChevronRight className="h-3 w-3 opacity-40" />
                              </Button>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
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

function BarChart3Icon(props: React.SVGProps<SVGSVGElement> & { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M3 3v18h18" />
      <path d="M18 17V9" />
      <path d="M13 17V5" />
      <path d="M8 17v-3" />
    </svg>
  )
}
