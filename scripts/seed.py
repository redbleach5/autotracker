#!/usr/bin/env python3
import urllib.request
import json
import sys
import datetime

BASE = 'http://localhost:3000/api'

def api_post(endpoint, data):
    req = urllib.request.Request(
        f'{BASE}{endpoint}',
        data=json.dumps(data).encode('utf-8'),
        headers={'Content-Type': 'application/json'},
        method='POST'
    )
    try:
        with urllib.request.urlopen(req) as resp:
            return json.loads(resp.read().decode('utf-8'))
    except Exception as e:
        print(f'ERROR POST {endpoint}: {e}')
        if hasattr(e, 'read'):
            print(e.read().decode('utf-8'))
        return None

def api_get(endpoint):
    req = urllib.request.Request(f'{BASE}{endpoint}')
    try:
        with urllib.request.urlopen(req) as resp:
            return json.loads(resp.read().decode('utf-8'))
    except Exception as e:
        print(f'ERROR GET {endpoint}: {e}')
        return None

# Check existing data
vehicles = api_get('/vehicles')
if vehicles and len(vehicles) > 0:
    print(f'Already have {len(vehicles)} vehicles, skipping seed')
    sys.exit(0)

# Create vehicles
v1 = api_post('/vehicles', {
    'name': 'Мой автомобиль',
    'brand': 'Toyota',
    'model': 'Camry',
    'year': 2020,
    'vin': '4T1BF1FK5EU123456',
    'licensePlate': 'А777МР77',
    'currentMileage': 85000,
    'color': 'Белый',
    'fuelType': 'petrol'
})
if not v1:
    print('Failed to create vehicle 1')
    sys.exit(1)
print(f'Created vehicle 1: {v1["id"]}')

v2 = api_post('/vehicles', {
    'name': 'Рабочая машина',
    'brand': 'Volkswagen',
    'model': 'Tiguan',
    'year': 2022,
    'vin': 'WVWZZZ5NZJW012345',
    'licensePlate': 'К888ОР99',
    'currentMileage': 42000,
    'color': 'Серый',
    'fuelType': 'diesel'
})
if not v2:
    print('Failed to create vehicle 2')
    sys.exit(1)
print(f'Created vehicle 2: {v2["id"]}')

# Create maintenance schedules
now = datetime.datetime.now()
next_month = (now.replace(day=1) + datetime.timedelta(days=32)).replace(day=15)
next_week = now + datetime.timedelta(days=5)
overdue = now - datetime.timedelta(days=30)

schedules_data = [
    {
        'vehicleId': v1['id'],
        'name': 'Замена масла',
        'description': 'Замена моторного масла и масляного фильтра',
        'intervalMileage': 10000,
        'intervalMonths': 12,
        'lastDate': (now - datetime.timedelta(days=365)).isoformat(),
        'lastMileage': 75000,
        'nextDate': next_week.isoformat(),
        'nextMileage': 85000,
        'isActive': True
    },
    {
        'vehicleId': v1['id'],
        'name': 'Замена тормозных колодок',
        'description': 'Проверка и замена передних/задних колодок',
        'intervalMileage': 30000,
        'intervalMonths': 24,
        'lastDate': (now - datetime.timedelta(days=400)).isoformat(),
        'lastMileage': 60000,
        'nextDate': overdue.isoformat(),
        'nextMileage': 90000,
        'isActive': True
    },
    {
        'vehicleId': v2['id'],
        'name': 'ТО-2',
        'description': 'Второе техническое обслуживание по регламенту',
        'intervalMileage': 15000,
        'intervalMonths': 12,
        'lastDate': (now - datetime.timedelta(days=180)).isoformat(),
        'lastMileage': 30000,
        'nextDate': next_month.isoformat(),
        'nextMileage': 45000,
        'isActive': True
    },
]

for s in schedules_data:
    result = api_post('/maintenance-schedules', s)
    if result:
        print(f'Created schedule: {result.get("name", "unknown")}')
    else:
        print(f'Failed to create schedule: {s["name"]}')

# Create maintenance records
records_data = [
    {'vehicleId': v1['id'], 'date': (now - datetime.timedelta(days=90)).isoformat(), 'mileage': 80000, 'cost': 5500, 'description': 'Замена масла Castrol 5W-40 и фильтра', 'workshop': 'Автосервис Мотор'},
    {'vehicleId': v1['id'], 'date': (now - datetime.timedelta(days=180)).isoformat(), 'mileage': 75000, 'cost': 12000, 'description': 'Замена передних колодок + диагностика', 'workshop': 'Официальный дилер Тойота'},
    {'vehicleId': v2['id'], 'date': (now - datetime.timedelta(days=30)).isoformat(), 'mileage': 40000, 'cost': 8500, 'description': 'Замена масла, фильтров, проверка ходовой', 'workshop': 'Автосервис Немец'},
    {'vehicleId': v2['id'], 'date': (now - datetime.timedelta(days=120)).isoformat(), 'mileage': 35000, 'cost': 3200, 'description': 'Замена салонного фильтра', 'workshop': 'Самостоятельно'},
    {'vehicleId': v1['id'], 'date': (now - datetime.timedelta(days=270)).isoformat(), 'mileage': 70000, 'cost': 15000, 'description': 'Замена ремня ГРМ и роликов', 'workshop': 'Автосервис Мотор'},
]

for r in records_data:
    result = api_post('/maintenance-records', r)
    if result:
        print(f'Created record: {result.get("id", "unknown")}')
    else:
        print(f'Failed to create record: {r["description"][:30]}')

# Create expenses
expenses_data = [
    {'vehicleId': v1['id'], 'category': 'fuel', 'amount': 3500, 'date': (now - datetime.timedelta(days=5)).isoformat(), 'description': 'АИ-95, 50 литров', 'supplier': 'Лукойл'},
    {'vehicleId': v1['id'], 'category': 'fuel', 'amount': 2800, 'date': (now - datetime.timedelta(days=40)).isoformat(), 'description': 'АИ-95, 40 литров', 'supplier': 'Газпромнефть'},
    {'vehicleId': v1['id'], 'category': 'wash', 'amount': 800, 'date': (now - datetime.timedelta(days=35)).isoformat(), 'description': 'Комплексная мойка', 'supplier': 'Мойка №1'},
    {'vehicleId': v1['id'], 'category': 'insurance', 'amount': 45000, 'date': (now - datetime.timedelta(days=130)).isoformat(), 'description': 'ОСАГО + КАСКО', 'supplier': 'Ингосстрах'},
    {'vehicleId': v1['id'], 'category': 'parts', 'amount': 6500, 'date': (now - datetime.timedelta(days=60)).isoformat(), 'description': 'Масло Castrol + фильтр', 'supplier': 'Exist.ru'},
    {'vehicleId': v1['id'], 'category': 'parking', 'amount': 1200, 'date': (now - datetime.timedelta(days=25)).isoformat(), 'description': 'Парковка ТЦ, месяц', 'supplier': 'ТЦ Мега'},
    {'vehicleId': v2['id'], 'category': 'fuel', 'amount': 4200, 'date': (now - datetime.timedelta(days=7)).isoformat(), 'description': 'ДТ, 60 литров', 'supplier': 'Лукойл'},
    {'vehicleId': v2['id'], 'category': 'fine', 'amount': 1500, 'date': (now - datetime.timedelta(days=65)).isoformat(), 'description': 'Превышение скорости', 'supplier': 'ГИБДД'},
    {'vehicleId': v2['id'], 'category': 'parts', 'amount': 9800, 'date': (now - datetime.timedelta(days=45)).isoformat(), 'description': 'Тормозные диски передние', 'supplier': 'AutoDoc'},
    {'vehicleId': v2['id'], 'category': 'wash', 'amount': 600, 'date': (now - datetime.timedelta(days=2)).isoformat(), 'description': 'Экспресс-мойка', 'supplier': 'Мойдодыр'},
]

for e in expenses_data:
    result = api_post('/expenses', e)
    if result:
        print(f'Created expense: {result.get("category", "unknown")} {result.get("amount", 0)}')
    else:
        print(f'Failed to create expense: {e["category"]} {e["amount"]}')

# Create parts
parts_data = [
    {'vehicleId': v1['id'], 'name': 'Масляный фильтр', 'partNumber': '90915-YZZN2', 'category': 'filter', 'cost': 450, 'purchaseDate': (now - datetime.timedelta(days=90)).isoformat(), 'supplier': 'Exist.ru', 'notes': 'Оригинал Toyota'},
    {'vehicleId': v1['id'], 'name': 'Моторное масло', 'partNumber': 'CASTROL-5W40-4L', 'category': 'oil', 'cost': 3200, 'purchaseDate': (now - datetime.timedelta(days=90)).isoformat(), 'supplier': 'Exist.ru', 'notes': 'Castrol EDGE 5W-40, 4 литра'},
    {'vehicleId': v2['id'], 'name': 'Салонный фильтр', 'partNumber': '5Q0-819-653', 'category': 'filter', 'cost': 1200, 'purchaseDate': (now - datetime.timedelta(days=120)).isoformat(), 'supplier': 'AutoDoc', 'notes': 'Угольный фильтр'},
]

for p in parts_data:
    result = api_post('/parts', p)
    if result:
        print(f'Created part: {result.get("name", "unknown")}')
    else:
        print(f'Failed to create part: {p["name"]}')

print('\nSeeding complete!')
