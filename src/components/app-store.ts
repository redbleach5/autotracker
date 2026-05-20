import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type TabId = 'dashboard' | 'vehicles' | 'maintenance' | 'expenses' | 'stats'

interface AppState {
  activeTab: TabId
  selectedVehicleId: string | null
  theme: 'light' | 'dark' | 'system'
  addVehicleOpen: boolean
  editVehicleId: string | null
  addExpenseOpen: boolean
  editExpenseId: string | null
  addMaintenanceScheduleOpen: boolean
  addMaintenanceRecordOpen: boolean
  addPartOpen: boolean
  editPartId: string | null

  setActiveTab: (tab: TabId) => void
  setSelectedVehicleId: (id: string | null) => void
  setTheme: (theme: 'light' | 'dark' | 'system') => void
  setAddVehicleOpen: (open: boolean) => void
  setEditVehicleId: (id: string | null) => void
  setAddExpenseOpen: (open: boolean) => void
  setEditExpenseId: (id: string | null) => void
  setAddMaintenanceScheduleOpen: (open: boolean) => void
  setAddMaintenanceRecordOpen: (open: boolean) => void
  setAddPartOpen: (open: boolean) => void
  setEditPartId: (id: string | null) => void
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      activeTab: 'dashboard',
      selectedVehicleId: null,
      theme: 'system',
      addVehicleOpen: false,
      editVehicleId: null,
      addExpenseOpen: false,
      editExpenseId: null,
      addMaintenanceScheduleOpen: false,
      addMaintenanceRecordOpen: false,
      addPartOpen: false,
      editPartId: null,

      setActiveTab: (tab) => set({ activeTab: tab }),
      setSelectedVehicleId: (id) => set({ selectedVehicleId: id }),
      setTheme: (theme) => set({ theme }),
      setAddVehicleOpen: (open) => set({ addVehicleOpen: open, editVehicleId: open ? null : undefined }),
      setEditVehicleId: (id) => set({ editVehicleId: id, addVehicleOpen: !!id }),
      setAddExpenseOpen: (open) => set({ addExpenseOpen: open }),
      setEditExpenseId: (id) => set({ editExpenseId: id, addExpenseOpen: !!id }),
      setAddMaintenanceScheduleOpen: (open) => set({ addMaintenanceScheduleOpen: open }),
      setAddMaintenanceRecordOpen: (open) => set({ addMaintenanceRecordOpen: open }),
      setAddPartOpen: (open) => set({ addPartOpen: open, editPartId: open ? null : undefined }),
      setEditPartId: (id) => set({ editPartId: id, addPartOpen: !!id }),
    }),
    {
      name: 'autotracker-settings',
      partialize: (state) => ({ theme: state.theme }),
    }
  )
)
