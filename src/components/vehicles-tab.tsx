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

function formatMileage(km: number) {
  return new Intl.NumberFormat('ru-RU').format(km) + ' км'
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
    <AnimatePresence mode="wait">
      <motion.div
        key="vehicles"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.2 }}
        className="p-4 space-y-3"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Мой транспорт</h2>
          <Button
            size="sm"
            className="bg-emerald-600 hover:bg-emerald-700 text-white h-9"
            onClick={() => setAddVehicleOpen(true)}
          >
            <Plus className="h-4 w-4 mr-1" />
            Добавить
          </Button>
        </div>

        {!data || data.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <Car className="h-16 w-16 mx-auto mb-4 opacity-30" />
            <p className="text-base font-medium mb-1">Нет транспортных средств</p>
            <p className="text-sm mb-4">Добавьте ваш первый автомобиль</p>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={() => setAddVehicleOpen(true)}
            >
              <Plus className="h-4 w-4 mr-1" />
              Добавить авто
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {data.map((vehicle) => {
              const isSelected = selectedVehicleId === vehicle.id
              const counts = (vehicle as any)._count as { expenses: number; maintenanceRecords: number; parts: number }
              return (
                <motion.div
                  key={vehicle.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                >
                  <Card
                    className={`border-0 shadow-sm cursor-pointer transition-all ${
                      isSelected
                        ? 'ring-2 ring-emerald-500 shadow-emerald-100 dark:shadow-emerald-950'
                        : 'hover:shadow-md'
                    }`}
                    onClick={() => setSelectedVehicleId(isSelected ? null : vehicle.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-emerald-50 dark:bg-emerald-950 shrink-0">
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
                              className="text-destructive"
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

                      {isSelected && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="mt-3 pt-3 border-t space-y-2"
                        >
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div className="flex items-center gap-1.5 text-muted-foreground">
                              <Gauge className="h-3.5 w-3.5" />
                              {formatMileage(vehicle.currentMileage)}
                            </div>
                            <div className="flex items-center gap-1.5 text-muted-foreground">
                              <Fuel className="h-3.5 w-3.5" />
                              {fuelTypeLabels[vehicle.fuelType] || vehicle.fuelType}
                            </div>
                            {vehicle.color && (
                              <div className="flex items-center gap-1.5 text-muted-foreground">
                                <Palette className="h-3.5 w-3.5" />
                                {vehicle.color}
                              </div>
                            )}
                            {vehicle.licensePlate && (
                              <div className="text-muted-foreground">
                                🪪 {vehicle.licensePlate}
                              </div>
                            )}
                          </div>
                          <div className="flex flex-wrap gap-1.5 pt-1">
                            <Badge variant="secondary" className="text-[10px]">
                              💰 {counts?.expenses || 0} расходов
                            </Badge>
                            <Badge variant="secondary" className="text-[10px]">
                              🔧 {counts?.maintenanceRecords || 0} ТО
                            </Badge>
                            <Badge variant="secondary" className="text-[10px]">
                              ⚙️ {counts?.parts || 0} запчастей
                            </Badge>
                          </div>
                          <div className="flex gap-2 pt-1">
                            <Button
                              size="sm"
                              variant="outline"
                              className="flex-1 h-8 text-xs"
                              onClick={(e) => {
                                e.stopPropagation()
                                setSelectedVehicleId(vehicle.id)
                                setActiveTab('expenses')
                              }}
                            >
                              Расходы
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="flex-1 h-8 text-xs"
                              onClick={(e) => {
                                e.stopPropagation()
                                setSelectedVehicleId(vehicle.id)
                                setActiveTab('maintenance')
                              }}
                            >
                              ТО
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="flex-1 h-8 text-xs"
                              onClick={(e) => {
                                e.stopPropagation()
                                setSelectedVehicleId(vehicle.id)
                                setActiveTab('stats')
                              }}
                            >
                              Статистика
                            </Button>
                          </div>
                        </motion.div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              )
            })}
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  )
}
