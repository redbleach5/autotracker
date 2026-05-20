'use client'

import { useEffect } from 'react'
import { useAppStore } from '@/components/app-store'
import { seedDemoData } from '@/lib/services'
import { DashboardTab } from '@/components/dashboard-tab'
import { VehiclesTab } from '@/components/vehicles-tab'
import { MaintenanceTab } from '@/components/maintenance-tab'
import { ExpensesTab } from '@/components/expenses-tab'
import { StatsTab } from '@/components/stats-tab'
import { BottomNav } from '@/components/bottom-nav'
import { AddVehicleDialog } from '@/components/dialogs/add-vehicle-dialog'
import { AddExpenseDialog } from '@/components/dialogs/add-expense-dialog'
import { AddMaintenanceDialog } from '@/components/dialogs/add-maintenance-dialog'
import { AddPartDialog } from '@/components/dialogs/add-part-dialog'
import { Car } from 'lucide-react'

const tabTitles: Record<string, string> = {
  dashboard: 'AutoTracker',
  vehicles: 'Мой транспорт',
  maintenance: 'Техобслуживание',
  expenses: 'Расходы',
  stats: 'Статистика',
}

export default function Home() {
  const { activeTab } = useAppStore()

  useEffect(() => {
    seedDemoData()
  }, [])

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b safe-area-top">
        <div className="flex items-center justify-between h-12 px-4 max-w-lg mx-auto">
          <div className="flex items-center gap-2">
            {activeTab === 'dashboard' ? (
              <div className="flex items-center gap-2">
                <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-emerald-500">
                  <Car className="h-4 w-4 text-white" />
                </div>
                <h1 className="font-bold text-base">{tabTitles[activeTab]}</h1>
              </div>
            ) : (
              <h1 className="font-semibold text-base">{tabTitles[activeTab]}</h1>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto pb-20">
        {activeTab === 'dashboard' && <DashboardTab />}
        {activeTab === 'vehicles' && <VehiclesTab />}
        {activeTab === 'maintenance' && <MaintenanceTab />}
        {activeTab === 'expenses' && <ExpensesTab />}
        {activeTab === 'stats' && <StatsTab />}
      </main>

      <BottomNav />

      {/* Dialogs */}
      <AddVehicleDialog />
      <AddExpenseDialog />
      <AddMaintenanceDialog />
      <AddPartDialog />
    </div>
  )
}
