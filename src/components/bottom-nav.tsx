'use client'

import { useAppStore, type TabId } from '@/components/app-store'
import { LayoutDashboard, Car, Wrench, Receipt, BarChart3 } from 'lucide-react'
import { motion } from 'framer-motion'

const tabs: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: 'dashboard', label: 'Главная', icon: LayoutDashboard },
  { id: 'vehicles', label: 'Транспорт', icon: Car },
  { id: 'maintenance', label: 'ТО', icon: Wrench },
  { id: 'expenses', label: 'Расходы', icon: Receipt },
  { id: 'stats', label: 'Статистика', icon: BarChart3 },
]

export function BottomNav() {
  const { activeTab, setActiveTab } = useAppStore()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 glass border-t safe-area-bottom">
      <div className="flex items-center justify-around h-14 max-w-lg mx-auto px-1">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="relative flex flex-col items-center justify-center min-w-[52px] min-h-[44px] rounded-2xl transition-colors duration-200"
            >
              {isActive && (
                <motion.div
                  layoutId="nav-pill"
                  className="absolute inset-1 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
              <div className="relative z-10 flex flex-col items-center justify-center gap-0.5">
                <Icon
                  className={`h-[22px] w-[22px] transition-all duration-200 ${
                    isActive
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-muted-foreground/60'
                  }`}
                  strokeWidth={isActive ? 2.5 : 1.8}
                />
                <span
                  className={`text-[10px] leading-tight transition-all duration-200 ${
                    isActive
                      ? 'font-semibold text-emerald-600 dark:text-emerald-400'
                      : 'font-medium text-muted-foreground/60'
                  }`}
                >
                  {tab.label}
                </span>
              </div>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
