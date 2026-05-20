import Dexie, { type Table } from 'dexie'

export interface Vehicle {
  id: string
  name: string
  brand: string
  model: string
  year: number
  vin: string
  licensePlate: string
  currentMileage: number
  color: string
  fuelType: string
  imageUrl: string
  createdAt: Date
  updatedAt: Date
}

export interface MaintenanceSchedule {
  id: string
  vehicleId: string
  name: string
  description: string
  intervalMileage: number
  intervalMonths: number
  lastDate: Date | null
  lastMileage: number
  nextDate: Date | null
  nextMileage: number
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface MaintenanceRecord {
  id: string
  vehicleId: string
  scheduleId: string | null
  date: Date
  mileage: number
  cost: number
  description: string
  workshop: string
  createdAt: Date
  updatedAt: Date
}

export interface Expense {
  id: string
  vehicleId: string
  category: string
  amount: number
  date: Date
  description: string
  supplier: string
  createdAt: Date
  updatedAt: Date
}

export interface Part {
  id: string
  vehicleId: string
  name: string
  partNumber: string
  category: string
  cost: number
  purchaseDate: Date
  supplier: string
  notes: string
  createdAt: Date
  updatedAt: Date
}

class AutoTrackerDB extends Dexie {
  vehicles!: Table<Vehicle>
  maintenanceSchedules!: Table<MaintenanceSchedule>
  maintenanceRecords!: Table<MaintenanceRecord>
  expenses!: Table<Expense>
  parts!: Table<Part>

  constructor() {
    super('AutoTrackerDB')
    this.version(1).stores({
      vehicles: 'id, name, brand, model, year, fuelType, createdAt',
      maintenanceSchedules: 'id, vehicleId, name, isActive, nextDate, createdAt',
      maintenanceRecords: 'id, vehicleId, scheduleId, date, createdAt',
      expenses: 'id, vehicleId, category, date, amount, createdAt',
      parts: 'id, vehicleId, name, category, createdAt',
    })
  }
}

export const dbClient = new AutoTrackerDB()

// Helper to generate IDs
export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9)
}
