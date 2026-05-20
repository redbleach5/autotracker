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
import { Sun, Moon, Monitor } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Image from 'next/image'

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour >= 5 && hour < 12) return 'Доброе утро'
  if (hour >= 12 && hour < 17) return 'Добрый день'
  if (hour >= 17 && hour < 22) return 'Добрый вечер'
  return 'Доброй ночи'
}

function ThemeToggle() {
  const { theme, setTheme } = useAppStore()

  useEffect(() => {
    const applyTheme = () => {
      const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
      document.documentElement.classList.toggle('dark', isDark)
    }
    applyTheme()

    if (theme === 'system') {
      const mq = window.matchMedia('(prefers-color-scheme: dark)')
      const handler = () => applyTheme()
      mq.addEventListener('change', handler)
      return () => mq.removeEventListener('change', handler)
    }
  }, [theme])

  const nextTheme = theme === 'light' ? 'dark' : theme === 'dark' ? 'system' : 'light'
  const Icon = theme === 'light' ? Sun : theme === 'dark' ? Moon : Monitor

  return (
    <Button
      variant="ghost"
      size="sm"
      className="h-8 w-8 p-0 rounded-full"
      onClick={() => setTheme(nextTheme)}
      title={theme === 'light' ? 'Светлая тема' : theme === 'dark' ? 'Тёмная тема' : 'Системная тема'}
    >
      <Icon className="h-4 w-4 icon-transition" />
    </Button>
  )
}

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
      <header className="sticky top-0 z-50 glass border-b safe-area-top">
        <div className="flex items-center justify-between h-12 px-4 max-w-lg mx-auto">
          <div className="flex items-center gap-2.5">
            {activeTab === 'dashboard' ? (
              <div className="flex items-center gap-2.5">
                <div className="flex items-center justify-center w-8 h-8 rounded-xl overflow-hidden">
                  <Image src="/logo-icon.png" alt="AT" width={32} height={32} className="rounded-lg" />
                </div>
                <div>
                  <h1 className="font-bold text-base leading-tight">{tabTitles[activeTab]}</h1>
                  <p className="text-[11px] text-muted-foreground leading-tight">{getGreeting()}</p>
                </div>
              </div>
            ) : (
              <h1 className="font-semibold text-base">{tabTitles[activeTab]}</h1>
            )}
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main className="flex-1 overflow-y-auto pb-20">
        <div className="max-w-lg mx-auto">
          <div key={activeTab} className="tab-content">
            {activeTab === 'dashboard' && <DashboardTab />}
            {activeTab === 'vehicles' && <VehiclesTab />}
            {activeTab === 'maintenance' && <MaintenanceTab />}
            {activeTab === 'expenses' && <ExpensesTab />}
            {activeTab === 'stats' && <StatsTab />}
          </div>
        </div>
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
