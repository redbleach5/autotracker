'use client'

import { useAppStore, type TabId } from '@/components/app-store'
import { LayoutDashboard, Car, Wrench, Receipt, BarChart3 } from 'lucide-react'

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
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur border-t safe-area-bottom">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-2">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col items-center justify-center gap-0.5 min-w-[56px] min-h-[44px] rounded-xl transition-colors ${
                isActive
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon className={`h-5 w-5 ${isActive ? 'stroke-[2.5px]' : ''}`} />
              <span className={`text-[10px] leading-tight ${isActive ? 'font-semibold' : 'font-medium'}`}>
                {tab.label}
              </span>
              {isActive && (
                <div className="w-1 h-1 rounded-full bg-emerald-500 mt-0.5" />
              )}
            </button>
          )
        })}
      </div>
    </nav>
  )
}
