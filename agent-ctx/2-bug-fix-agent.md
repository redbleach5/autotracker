# Task 2 - Bug Fix Agent: Fix API routes and re-seed database

## Summary
Fixed all API POST/PUT route bugs related to missing type coercion and date validation, and re-seeded the empty database with demo data.

## Changes Made

### API POST Routes Fixed
1. **`/api/vehicles/route.ts`** - Added `parseInt()` for `year` and `currentMileage`; added `console.error`
2. **`/api/maintenance-schedules/route.ts`** - Added `parseInt()` for `intervalMileage`, `intervalMonths`, `lastMileage`, `nextMileage`; added date validation for `lastDate`/`nextDate`; added `console.error`
3. **`/api/maintenance-records/route.ts`** - Added `parseInt()` for `mileage`, `parseFloat()` for `cost`; added date validation; added `console.error`
4. **`/api/parts/route.ts`** - Added `parseFloat()` for `cost`; added date validation for `purchaseDate`; added `console.error`
5. **`/api/expenses/route.ts`** - Was already partially fixed (had `parseFloat` and date validation)

### API [id] PUT Routes Fixed
All 5 PUT routes updated with:
- Proper `parseInt()`/`parseFloat()` type coercion
- Date validation with `isNaN(date.getTime())` check
- Partial update support (only updating fields present in request body)
- `console.error` logging in catch blocks

### Dialog Components
Checked all 4 dialog components - they correctly parse numbers and send dates as YYYY-MM-DD. No changes needed.

### Seed Script
Created `/home/z/my-project/scripts/seed.py` - Python script that seeds data via API calls.

### Seeded Data
- 2 vehicles (Toyota Camry 2020, Volkswagen Tiguan 2022)
- 3 maintenance schedules (oil change, brake pads, TO-2)
- 5 maintenance records
- 10 expenses across categories (fuel, wash, insurance, parts, parking, fine)
- 3 parts (oil filter, motor oil, cabin filter)

### Verification
- All POST endpoints return 201 with correct data
- PUT endpoint updates partial fields correctly
- DELETE endpoints work correctly
- Dashboard API returns: 2 vehicles, 3 upcoming maintenance items, 8,300₽ monthly expenses
- Lint passes with no errors
