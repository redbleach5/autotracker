import { dbClient, generateId, type Vehicle, type MaintenanceSchedule, type MaintenanceRecord, type Expense, type Part } from './db-client'

// ===== VEHICLES =====
export async function getVehicles(): Promise<Vehicle[]> {
  const vehicles = await dbClient.vehicles.orderBy('createdAt').reverse().toArray()
  // Add counts
  for (const v of vehicles) {
    (v as any)._count = {
      expenses: await dbClient.expenses.where('vehicleId').equals(v.id).count(),
      maintenanceRecords: await dbClient.maintenanceRecords.where('vehicleId').equals(v.id).count(),
      parts: await dbClient.parts.where('vehicleId').equals(v.id).count(),
    }
  }
  return vehicles
}

export async function createVehicle(data: Partial<Vehicle>): Promise<Vehicle> {
  const now = new Date()
  const vehicle: Vehicle = {
    id: generateId(),
    name: data.name || '',
    brand: data.brand || '',
    model: data.model || '',
    year: data.year || 2024,
    vin: data.vin || '',
    licensePlate: data.licensePlate || '',
    currentMileage: data.currentMileage || 0,
    color: data.color || '',
    fuelType: data.fuelType || 'petrol',
    imageUrl: data.imageUrl || '',
    createdAt: now,
    updatedAt: now,
  }
  await dbClient.vehicles.add(vehicle)
  return vehicle
}

export async function updateVehicle(id: string, data: Partial<Vehicle>): Promise<Vehicle> {
  const existing = await dbClient.vehicles.get(id)
  if (!existing) throw new Error('Vehicle not found')
  const updated = { ...existing, ...data, updatedAt: new Date() }
  await dbClient.vehicles.put(updated)
  return updated
}

export async function deleteVehicle(id: string): Promise<void> {
  await dbClient.maintenanceSchedules.where('vehicleId').equals(id).delete()
  await dbClient.maintenanceRecords.where('vehicleId').equals(id).delete()
  await dbClient.expenses.where('vehicleId').equals(id).delete()
  await dbClient.parts.where('vehicleId').equals(id).delete()
  await dbClient.vehicles.delete(id)
}

// ===== MAINTENANCE SCHEDULES =====
export async function getMaintenanceSchedules(vehicleId?: string): Promise<MaintenanceSchedule[]> {
  if (vehicleId) {
    return dbClient.maintenanceSchedules.where('vehicleId').equals(vehicleId).reverse().sortBy('createdAt')
  }
  return dbClient.maintenanceSchedules.orderBy('createdAt').reverse().toArray()
}

export async function createMaintenanceSchedule(data: Partial<MaintenanceSchedule>): Promise<MaintenanceSchedule> {
  const now = new Date()
  const schedule: MaintenanceSchedule = {
    id: generateId(),
    vehicleId: data.vehicleId || '',
    name: data.name || '',
    description: data.description || '',
    intervalMileage: data.intervalMileage || 0,
    intervalMonths: data.intervalMonths || 0,
    lastDate: data.lastDate ? new Date(data.lastDate) : null,
    lastMileage: data.lastMileage || 0,
    nextDate: data.nextDate ? new Date(data.nextDate) : null,
    nextMileage: data.nextMileage || 0,
    isActive: data.isActive !== undefined ? data.isActive : true,
    createdAt: now,
    updatedAt: now,
  }
  await dbClient.maintenanceSchedules.add(schedule)
  return schedule
}

export async function updateMaintenanceSchedule(id: string, data: Partial<MaintenanceSchedule>): Promise<MaintenanceSchedule> {
  const existing = await dbClient.maintenanceSchedules.get(id)
  if (!existing) throw new Error('Schedule not found')
  const updated = { ...existing, ...data, updatedAt: new Date() }
  if (data.lastDate) updated.lastDate = new Date(data.lastDate)
  if (data.nextDate) updated.nextDate = new Date(data.nextDate)
  await dbClient.maintenanceSchedules.put(updated)
  return updated
}

export async function deleteMaintenanceSchedule(id: string): Promise<void> {
  await dbClient.maintenanceSchedules.delete(id)
}

// ===== MAINTENANCE RECORDS =====
export async function getMaintenanceRecords(vehicleId?: string): Promise<MaintenanceRecord[]> {
  if (vehicleId) {
    return dbClient.maintenanceRecords.where('vehicleId').equals(vehicleId).reverse().sortBy('date')
  }
  return dbClient.maintenanceRecords.orderBy('date').reverse().toArray()
}

export async function createMaintenanceRecord(data: Partial<MaintenanceRecord>): Promise<MaintenanceRecord> {
  const now = new Date()
  const record: MaintenanceRecord = {
    id: generateId(),
    vehicleId: data.vehicleId || '',
    scheduleId: data.scheduleId || null,
    date: data.date ? new Date(data.date) : now,
    mileage: data.mileage || 0,
    cost: data.cost || 0,
    description: data.description || '',
    workshop: data.workshop || '',
    createdAt: now,
    updatedAt: now,
  }
  await dbClient.maintenanceRecords.add(record)
  return record
}

export async function updateMaintenanceRecord(id: string, data: Partial<MaintenanceRecord>): Promise<MaintenanceRecord> {
  const existing = await dbClient.maintenanceRecords.get(id)
  if (!existing) throw new Error('Record not found')
  const updated = { ...existing, ...data, updatedAt: new Date() }
  if (data.date) updated.date = new Date(data.date)
  await dbClient.maintenanceRecords.put(updated)
  return updated
}

export async function deleteMaintenanceRecord(id: string): Promise<void> {
  await dbClient.maintenanceRecords.delete(id)
}

// ===== EXPENSES =====
export async function getExpenses(vehicleId?: string, category?: string): Promise<Expense[]> {
  let collection = dbClient.expenses.orderBy('date').reverse()
  let expenses = await collection.toArray()
  if (vehicleId) expenses = expenses.filter(e => e.vehicleId === vehicleId)
  if (category) expenses = expenses.filter(e => e.category === category)
  return expenses
}

export async function createExpense(data: Partial<Expense>): Promise<Expense> {
  const now = new Date()
  const expense: Expense = {
    id: generateId(),
    vehicleId: data.vehicleId || '',
    category: data.category || 'other',
    amount: data.amount || 0,
    date: data.date ? new Date(data.date) : now,
    description: data.description || '',
    supplier: data.supplier || '',
    createdAt: now,
    updatedAt: now,
  }
  await dbClient.expenses.add(expense)
  return expense
}

export async function updateExpense(id: string, data: Partial<Expense>): Promise<Expense> {
  const existing = await dbClient.expenses.get(id)
  if (!existing) throw new Error('Expense not found')
  const updated = { ...existing, ...data, updatedAt: new Date() }
  if (data.date) updated.date = new Date(data.date)
  await dbClient.expenses.put(updated)
  return updated
}

export async function deleteExpense(id: string): Promise<void> {
  await dbClient.expenses.delete(id)
}

// ===== PARTS =====
export async function getParts(vehicleId?: string): Promise<Part[]> {
  if (vehicleId) {
    return dbClient.parts.where('vehicleId').equals(vehicleId).reverse().sortBy('createdAt')
  }
  return dbClient.parts.orderBy('createdAt').reverse().toArray()
}

export async function createPart(data: Partial<Part>): Promise<Part> {
  const now = new Date()
  const part: Part = {
    id: generateId(),
    vehicleId: data.vehicleId || '',
    name: data.name || '',
    partNumber: data.partNumber || '',
    category: data.category || 'other',
    cost: data.cost || 0,
    purchaseDate: data.purchaseDate ? new Date(data.purchaseDate) : now,
    supplier: data.supplier || '',
    notes: data.notes || '',
    createdAt: now,
    updatedAt: now,
  }
  await dbClient.parts.add(part)
  return part
}

export async function updatePart(id: string, data: Partial<Part>): Promise<Part> {
  const existing = await dbClient.parts.get(id)
  if (!existing) throw new Error('Part not found')
  const updated = { ...existing, ...data, updatedAt: new Date() }
  if (data.purchaseDate) updated.purchaseDate = new Date(data.purchaseDate)
  await dbClient.parts.put(updated)
  return updated
}

export async function deletePart(id: string): Promise<void> {
  await dbClient.parts.delete(id)
}

// ===== DASHBOARD =====
export interface DashboardData {
  totalVehicles: number
  upcomingMaintenance: Array<MaintenanceSchedule & { vehicle: Vehicle }>
  totalExpensesThisMonth: number
  expensesByCategory: Record<string, number>
  recentExpenses: Array<Expense & { vehicle: Vehicle }>
  recentMaintenance: Array<MaintenanceRecord & { vehicle: Vehicle; schedule: MaintenanceSchedule | null }>
}

export async function getDashboardData(): Promise<DashboardData> {
  const vehicles = await dbClient.vehicles.toArray()
  const vehicleMap = Object.fromEntries(vehicles.map(v => [v.id, v]))

  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0)

  // Upcoming maintenance (nextDate within 30 days or overdue)
  const allSchedules = await dbClient.maintenanceSchedules.toArray()
  const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
  const upcoming = allSchedules
    .filter(s => s.isActive && s.nextDate && (new Date(s.nextDate) <= thirtyDaysFromNow))
    .sort((a, b) => {
      const da = a.nextDate ? new Date(a.nextDate).getTime() : Infinity
      const db = b.nextDate ? new Date(b.nextDate).getTime() : Infinity
      return da - db
    })
    .map(s => ({ ...s, vehicle: vehicleMap[s.vehicleId] || s }))

  // Expenses this month
  const allExpenses = await dbClient.expenses.toArray()
  const monthlyExpenses = allExpenses.filter(e => {
    const d = new Date(e.date)
    return d >= monthStart && d <= monthEnd
  })
  const totalThisMonth = monthlyExpenses.reduce((sum, e) => sum + e.amount, 0)

  // By category
  const byCategory: Record<string, number> = {}
  monthlyExpenses.forEach(e => {
    byCategory[e.category] = (byCategory[e.category] || 0) + e.amount
  })

  // Recent expenses
  const recentExpenses = allExpenses
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5)
    .map(e => ({ ...e, vehicle: vehicleMap[e.vehicleId] || e }))

  // Recent maintenance
  const scheduleMap = Object.fromEntries((await dbClient.maintenanceSchedules.toArray()).map(s => [s.id, s]))
  const recentMaintenance = (await dbClient.maintenanceRecords.toArray())
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5)
    .map(r => ({
      ...r,
      vehicle: vehicleMap[r.vehicleId] || r,
      schedule: r.scheduleId ? scheduleMap[r.scheduleId] || null : null,
    }))

  return {
    totalVehicles: vehicles.length,
    upcomingMaintenance: upcoming,
    totalExpensesThisMonth: totalThisMonth,
    expensesByCategory: byCategory,
    recentExpenses,
    recentMaintenance,
  }
}

// ===== SEED DATA =====
export async function seedDemoData(): Promise<void> {
  const count = await dbClient.vehicles.count()
  if (count > 0) return // Already seeded

  const now = new Date()

  const v1 = await createVehicle({
    name: 'Мой автомобиль', brand: 'Toyota', model: 'Camry', year: 2020,
    vin: '4T1BF1FK5EU123456', licensePlate: 'А777МР77', currentMileage: 85000,
    color: 'Белый', fuelType: 'petrol',
  })

  const v2 = await createVehicle({
    name: 'Рабочая машина', brand: 'Volkswagen', model: 'Tiguan', year: 2022,
    vin: 'WVWZZZ5NZJW012345', licensePlate: 'К888ОР99', currentMileage: 42000,
    color: 'Серый', fuelType: 'diesel',
  })

  const nextWeek = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000)
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 15)
  const overdue = new Date(now.getFullYear(), now.getMonth() - 1, 10)

  await createMaintenanceSchedule({ vehicleId: v1.id, name: 'Замена масла', description: 'Замена моторного масла и масляного фильтра', intervalMileage: 10000, intervalMonths: 12, lastDate: new Date(now.getFullYear() - 1, 5, 15), lastMileage: 75000, nextDate: nextWeek, nextMileage: 85000 })
  await createMaintenanceSchedule({ vehicleId: v1.id, name: 'Замена тормозных колодок', description: 'Проверка и замена передних/задних колодок', intervalMileage: 30000, intervalMonths: 24, lastDate: new Date(now.getFullYear() - 1, 2, 10), lastMileage: 60000, nextDate: overdue, nextMileage: 90000 })
  await createMaintenanceSchedule({ vehicleId: v2.id, name: 'ТО-2', description: 'Второе техническое обслуживание по регламенту', intervalMileage: 15000, intervalMonths: 12, lastDate: new Date(now.getFullYear(), 0, 20), lastMileage: 30000, nextDate: nextMonth, nextMileage: 45000 })

  await createMaintenanceRecord({ vehicleId: v1.id, date: new Date(now.getFullYear(), now.getMonth() - 3, 15), mileage: 80000, cost: 5500, description: 'Замена масла Castrol 5W-40 и фильтра', workshop: 'Автосервис Мотор' })
  await createMaintenanceRecord({ vehicleId: v1.id, date: new Date(now.getFullYear(), now.getMonth() - 6, 10), mileage: 75000, cost: 12000, description: 'Замена передних колодок + диагностика', workshop: 'Официальный дилер Тойота' })
  await createMaintenanceRecord({ vehicleId: v2.id, date: new Date(now.getFullYear(), now.getMonth() - 1, 20), mileage: 40000, cost: 8500, description: 'Замена масла, фильтров, проверка ходовой', workshop: 'Автосервис Немец' })
  await createMaintenanceRecord({ vehicleId: v2.id, date: new Date(now.getFullYear(), now.getMonth() - 4, 5), mileage: 35000, cost: 3200, description: 'Замена салонного фильтра', workshop: 'Самостоятельно' })
  await createMaintenanceRecord({ vehicleId: v1.id, date: new Date(now.getFullYear(), now.getMonth() - 9, 1), mileage: 70000, cost: 15000, description: 'Замена ремня ГРМ и роликов', workshop: 'Автосервис Мотор' })

  await createExpense({ vehicleId: v1.id, category: 'fuel', amount: 3500, date: new Date(now.getFullYear(), now.getMonth(), 5), description: 'АИ-95, 50 литров', supplier: 'Лукойл' })
  await createExpense({ vehicleId: v1.id, category: 'fuel', amount: 2800, date: new Date(now.getFullYear(), now.getMonth() - 1, 12), description: 'АИ-95, 40 литров', supplier: 'Газпромнефть' })
  await createExpense({ vehicleId: v1.id, category: 'wash', amount: 800, date: new Date(now.getFullYear(), now.getMonth() - 1, 18), description: 'Комплексная мойка', supplier: 'Мойка №1' })
  await createExpense({ vehicleId: v1.id, category: 'insurance', amount: 45000, date: new Date(now.getFullYear(), 0, 10), description: 'ОСАГО + КАСКО', supplier: 'Ингосстрах' })
  await createExpense({ vehicleId: v1.id, category: 'parts', amount: 6500, date: new Date(now.getFullYear(), now.getMonth() - 2, 22), description: 'Масло Castrol + фильтр', supplier: 'Exist.ru' })
  await createExpense({ vehicleId: v1.id, category: 'parking', amount: 1200, date: new Date(now.getFullYear(), now.getMonth() - 1, 28), description: 'Парковка ТЦ, месяц', supplier: 'ТЦ Мега' })
  await createExpense({ vehicleId: v2.id, category: 'fuel', amount: 4200, date: new Date(now.getFullYear(), now.getMonth(), 3), description: 'ДТ, 60 литров', supplier: 'Лукойл' })
  await createExpense({ vehicleId: v2.id, category: 'fine', amount: 1500, date: new Date(now.getFullYear(), now.getMonth() - 2, 8), description: 'Превышение скорости', supplier: 'ГИБДД' })
  await createExpense({ vehicleId: v2.id, category: 'parts', amount: 9800, date: new Date(now.getFullYear(), now.getMonth() - 1, 15), description: 'Тормозные диски передние', supplier: 'AutoDoc' })
  await createExpense({ vehicleId: v2.id, category: 'wash', amount: 600, date: new Date(now.getFullYear(), now.getMonth(), 10), description: 'Экспресс-мойка', supplier: 'Мойдодыр' })

  await createPart({ vehicleId: v1.id, name: 'Масляный фильтр', partNumber: '90915-YZZN2', category: 'filter', cost: 450, purchaseDate: new Date(now.getFullYear(), now.getMonth() - 3, 14), supplier: 'Exist.ru', notes: 'Оригинал Toyota' })
  await createPart({ vehicleId: v1.id, name: 'Моторное масло', partNumber: 'CASTROL-5W40-4L', category: 'oil', cost: 3200, purchaseDate: new Date(now.getFullYear(), now.getMonth() - 3, 14), supplier: 'Exist.ru', notes: 'Castrol EDGE 5W-40' })
  await createPart({ vehicleId: v2.id, name: 'Салонный фильтр', partNumber: '5Q0-819-653', category: 'filter', cost: 1200, purchaseDate: new Date(now.getFullYear(), now.getMonth() - 4, 3), supplier: 'AutoDoc', notes: 'Угольный фильтр' })

  console.log('Demo data seeded!')
}
