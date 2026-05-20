# Work Log — Task 3: AutoTracker PWA

## Summary
Built a complete AutoTracker PWA application for Android — a mobile-first Progressive Web App for tracking vehicle maintenance schedules, spare parts expenses, and automotive costs.

## What was done

### 1. Prisma Schema
- Replaced the default User/Post schema with Vehicle, MaintenanceSchedule, MaintenanceRecord, Expense, and Part models
- All models have proper relations with cascade delete
- Ran `db:push` successfully

### 2. API Routes (11 route files)
- `/api/vehicles` — GET (list with counts), POST (create)
- `/api/vehicles/[id]` — GET (single with relations), PUT (update), DELETE
- `/api/maintenance-schedules` — GET (with vehicleId filter), POST
- `/api/maintenance-schedules/[id]` — PUT, DELETE
- `/api/maintenance-records` — GET (with vehicle/schedule relations), POST (auto-updates schedule lastDate/lastMileage)
- `/api/maintenance-records/[id]` — PUT, DELETE
- `/api/expenses` — GET (with vehicleId & category filters), POST
- `/api/expenses/[id]` — PUT, DELETE
- `/api/parts` — GET (with vehicleId filter), POST
- `/api/parts/[id]` — PUT, DELETE
- `/api/dashboard` — GET (aggregated stats: totalVehicles, upcomingMaintenance, totalExpensesThisMonth, expensesByCategory, recentExpenses, recentMaintenance)

All routes use Next.js 16 `params: Promise<{ id: string }>` pattern for dynamic routes.

### 3. Components
- **app-store.ts** — Zustand store with activeTab, selectedVehicleId, and dialog states
- **bottom-nav.tsx** — Fixed bottom navigation with 5 tabs, emerald green active state
- **dashboard-tab.tsx** — Welcome card, stats cards, upcoming maintenance, recent expenses, quick actions
- **vehicles-tab.tsx** — Vehicle list with expandable cards, edit/delete, quick navigation
- **maintenance-tab.tsx** — Schedules & records with vehicle selector, status badges (overdue/soon/ok)
- **expenses-tab.tsx** — Category filter tabs, expense list with colored icons, total display
- **stats-tab.tsx** — Pie chart (by category) and bar chart (monthly) using recharts
- **dialogs/add-vehicle-dialog.tsx** — Full vehicle form with fuel type select
- **dialogs/add-expense-dialog.tsx** — Expense form with category and vehicle select
- **dialogs/add-maintenance-dialog.tsx** — Dual mode: schedule creation & record creation
- **dialogs/add-part-dialog.tsx** — Part form with category and purchase details

### 4. Layout & Page
- Updated layout.tsx with Russian title, `lang="ru"`, Sonner toaster
- page.tsx — Single-page app with header, tab content, bottom nav, and all dialogs

### 5. Styling
- Added custom CSS for scrollbar, safe area insets, PWA viewport, touch improvements
- Emerald/green color scheme throughout
- Mobile-first responsive design with 44px min touch targets
- Framer Motion animations on tab transitions

### 6. Seed Data
- 2 vehicles (Toyota Camry 2020, Kia Rio 2022)
- 3 maintenance schedules
- 5 maintenance records
- 10 expenses across categories
- 3 parts

## Tech Stack Used
- Next.js 16 with App Router
- TypeScript 5
- Prisma ORM with SQLite
- shadcn/ui components (Card, Dialog, Button, Input, Select, Badge, Skeleton, etc.)
- Zustand for state management
- Recharts for charts
- Framer Motion for animations
- Sonner for toast notifications
- Lucide React for icons
