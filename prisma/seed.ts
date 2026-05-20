import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Clean up existing data
  await prisma.part.deleteMany()
  await prisma.expense.deleteMany()
  await prisma.maintenanceRecord.deleteMany()
  await prisma.maintenanceSchedule.deleteMany()
  await prisma.vehicle.deleteMany()

  // Create vehicles
  const vehicle1 = await prisma.vehicle.create({
    data: {
      name: 'Мой автомобиль',
      brand: 'Toyota',
      model: 'Camry',
      year: 2020,
      vin: '4T1BF1FK5EU123456',
      licensePlate: 'А 777 АА 77',
      currentMileage: 85000,
      color: 'Чёрный',
      fuelType: 'petrol',
    },
  })

  const vehicle2 = await prisma.vehicle.create({
    data: {
      name: 'Жена',
      brand: 'Kia',
      model: 'Rio',
      year: 2022,
      vin: 'XWEHN511AB023456',
      licensePlate: 'В 123 ОР 99',
      currentMileage: 32000,
      color: 'Белый',
      fuelType: 'petrol',
    },
  })

  // Create maintenance schedules
  const schedule1 = await prisma.maintenanceSchedule.create({
    data: {
      vehicleId: vehicle1.id,
      name: 'Замена масла',
      description: 'Замена моторного масла и фильтра',
      intervalMileage: 10000,
      intervalMonths: 12,
      lastDate: new Date('2025-08-15'),
      lastMileage: 75000,
      nextDate: new Date('2026-02-15'),
      nextMileage: 85000,
    },
  })

  const schedule2 = await prisma.maintenanceSchedule.create({
    data: {
      vehicleId: vehicle1.id,
      name: 'Замена тормозных колодок',
      description: 'Замена передних и задних колодок',
      intervalMileage: 30000,
      intervalMonths: 24,
      lastDate: new Date('2024-11-01'),
      lastMileage: 60000,
      nextDate: new Date('2026-05-01'),
      nextMileage: 90000,
    },
  })

  const schedule3 = await prisma.maintenanceSchedule.create({
    data: {
      vehicleId: vehicle2.id,
      name: 'Замена масла',
      description: 'Замена моторного масла и фильтра',
      intervalMileage: 15000,
      intervalMonths: 12,
      lastDate: new Date('2025-06-01'),
      lastMileage: 25000,
      nextDate: new Date('2026-03-01'),
      nextMileage: 40000,
    },
  })

  // Create maintenance records
  const now = new Date()
  const records = [
    {
      vehicleId: vehicle1.id,
      scheduleId: schedule1.id,
      date: new Date('2025-08-15'),
      mileage: 75000,
      cost: 5500,
      description: 'Замена масла Castrol 5W-40 и фильтра',
      workshop: 'Автосервис «Мотор»',
    },
    {
      vehicleId: vehicle1.id,
      scheduleId: null,
      date: new Date('2025-06-20'),
      mileage: 72000,
      cost: 12000,
      description: 'Замена свечей зажигания',
      workshop: 'Тойота Центр',
    },
    {
      vehicleId: vehicle1.id,
      scheduleId: schedule2.id,
      date: new Date('2024-11-01'),
      mileage: 60000,
      cost: 8500,
      description: 'Замена передних тормозных колодок',
      workshop: 'Автосервис «Мотор»',
    },
    {
      vehicleId: vehicle2.id,
      scheduleId: schedule3.id,
      date: new Date('2025-06-01'),
      mileage: 25000,
      cost: 4200,
      description: 'Замена масла Shell 5W-30',
      workshop: 'KIA Сервис',
    },
    {
      vehicleId: vehicle2.id,
      scheduleId: null,
      date: new Date('2025-04-10'),
      mileage: 20000,
      cost: 3200,
      description: 'Диагностика ходовой',
      workshop: 'KIA Сервис',
    },
  ]

  for (const record of records) {
    await prisma.maintenanceRecord.create({ data: record })
  }

  // Create expenses
  const expenses = [
    {
      vehicleId: vehicle1.id,
      category: 'fuel',
      amount: 3500,
      date: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
      description: 'АИ-95, 50 литров',
      supplier: 'Лукойл',
    },
    {
      vehicleId: vehicle1.id,
      category: 'wash',
      amount: 800,
      date: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
      description: 'Комплексная мойка',
      supplier: 'Мойка №1',
    },
    {
      vehicleId: vehicle1.id,
      category: 'insurance',
      amount: 25000,
      date: new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000),
      description: 'ОСАГО на 1 год',
      supplier: 'Росгосстрах',
    },
    {
      vehicleId: vehicle1.id,
      category: 'parts',
      amount: 4500,
      date: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000),
      description: 'Воздушный фильтр',
      supplier: 'Автодок',
    },
    {
      vehicleId: vehicle1.id,
      category: 'fuel',
      amount: 3200,
      date: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
      description: 'АИ-95, 45 литров',
      supplier: 'Газпромнефть',
    },
    {
      vehicleId: vehicle1.id,
      category: 'parking',
      amount: 300,
      date: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
      description: 'Парковка ТЦ',
      supplier: '',
    },
    {
      vehicleId: vehicle2.id,
      category: 'fuel',
      amount: 2800,
      date: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000),
      description: 'АИ-92, 40 литров',
      supplier: 'Лукойл',
    },
    {
      vehicleId: vehicle2.id,
      category: 'fine',
      amount: 500,
      date: new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000),
      description: 'Превышение скорости',
      supplier: 'ГИБДД',
    },
    {
      vehicleId: vehicle2.id,
      category: 'wash',
      amount: 600,
      date: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
      description: 'Экспресс-мойка',
      supplier: 'Мойка №3',
    },
    {
      vehicleId: vehicle1.id,
      category: 'other',
      amount: 1500,
      date: new Date(now.getTime() - 12 * 24 * 60 * 60 * 1000),
      description: 'Антидождь для стёкол',
      supplier: 'Автозапчасти',
    },
  ]

  for (const expense of expenses) {
    await prisma.expense.create({ data: expense })
  }

  // Create parts
  const parts = [
    {
      vehicleId: vehicle1.id,
      name: 'Масляный фильтр',
      partNumber: '90915-YZZN2',
      category: 'engine',
      cost: 650,
      purchaseDate: new Date('2025-08-10'),
      supplier: 'Автодок',
      notes: 'Оригинал Toyota',
    },
    {
      vehicleId: vehicle1.id,
      name: 'Передние тормозные колодки',
      partNumber: '04465-33471',
      category: 'brakes',
      cost: 3500,
      purchaseDate: new Date('2024-10-25'),
      supplier: 'Экзист',
      notes: 'Оригинал',
    },
    {
      vehicleId: vehicle2.id,
      name: 'Салонный фильтр',
      partNumber: '97133-H1000',
      category: 'interior',
      cost: 850,
      purchaseDate: new Date('2025-05-15'),
      supplier: 'Автодок',
      notes: 'Угольный фильтр',
    },
  ]

  for (const part of parts) {
    await prisma.part.create({ data: part })
  }

  console.log('Seed data created successfully!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
