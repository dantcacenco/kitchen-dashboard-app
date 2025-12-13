# Kitchen Dashboard App

A personal finance and productivity dashboard for the kitchen display. Built with Next.js 14, Convex (real-time database), and Tailwind CSS.

---

## Table of Contents

1. [Tech Stack](#tech-stack)
2. [Features Overview](#features-overview)
3. [Database Schema (Convex)](#database-schema-convex)
4. [UI/Layout Design](#uilayout-design)
5. [Widget Specifications](#widget-specifications)
6. [API Integrations](#api-integrations)
7. [File Structure](#file-structure)
8. [Development Workflow](#development-workflow)
9. [Setup Instructions](#setup-instructions)

---

## Tech Stack

| Category | Technology | Why |
|----------|------------|-----|
| Framework | Next.js 14 (App Router) | Server components, API routes |
| Database | Convex | Real-time, built-in crons, reactive |
| Styling | Tailwind CSS | Rapid UI development |
| Charts | Recharts | Data visualization |
| Icons | Lucide React | Consistent icon set |
| Grid Layout | react-grid-layout | Draggable/resizable widgets |
| Date Utils | date-fns | Date formatting |
| State | React Context + Convex | Real-time state sync |

---

## Features Overview

### Core Widgets
1. **Weather Widget** - Current weather + 7-day forecast (Open-Meteo API)
2. **Shopping List** - Interactive checklist with optimistic updates
3. **Expenses Tracker** - Categorized spending with trends
4. **Income Tracker** - Per-person income with source tagging
5. **Savings Goals** - Progress tracking with history
6. **Gold & Silver Tracker** - Portfolio value with live prices

### Dashboard Features
- **Draggable Layout** - iOS-style widget repositioning
- **Resizable Widgets** - Adjust widget sizes
- **Persistent Layout** - Saves to database
- **Modal Detail Views** - Click any widget for full features
- **Time Range Toggles** - This month / This year / Last year
- **Optimistic Updates** - Instant UI feedback
- **Offline Queue** - Requests retry on reconnection

---

## Database Schema (Convex)

### Tables

#### `users`
```typescript
{
  _id: Id<"users">,
  name: string,              // "Dan" | "Esther"
  createdAt: number,         // timestamp
}
```

#### `transactions` (Expenses)
```typescript
{
  _id: Id<"transactions">,
  amount: number,            // in cents (e.g., 4523 = $45.23)
  category: string,          // "groceries" | "gas" | "housing" | "dining" | "travel" | "clothing" | "healthcare" | "utilities" | "other"
  description: string,       // "Walmart groceries"
  date: number,              // timestamp
  createdAt: number,
  userId?: Id<"users">,      // optional: who made this expense
}
```

#### `income`
```typescript
{
  _id: Id<"income">,
  amount: number,            // in cents
  source: string,            // "hosting" | "dj" | "coding" | "photography" | "construction" | "babysitting" | "cleaning" | custom
  description?: string,      // optional note
  date: number,              // timestamp of income
  userId: Id<"users">,       // "Dan" or "Esther"
  createdAt: number,
}
```

#### `incomeSources` (for multi-select)
```typescript
{
  _id: Id<"incomeSources">,
  name: string,              // "Hosting", "DJ", etc.
  color: string,             // hex color for charts
  createdAt: number,
}
```

#### `savingsGoals`
```typescript
{
  _id: Id<"savingsGoals">,
  name: string,              // "House Down Payment"
  targetAmount: number,      // in cents (2000000 = $20,000)
  currentAmount: number,     // in cents
  icon: string,              // emoji "🏠"
  color: string,             // hex color "#4ECDC4"
  priority: string,          // "critical" | "high" | "medium" | "low"
  createdAt: number,
}
```

#### `savingsHistory`
```typescript
{
  _id: Id<"savingsHistory">,
  goalId: Id<"savingsGoals">,
  amount: number,            // positive = deposit, negative = withdrawal
  note?: string,             // "Monthly contribution"
  date: number,              // timestamp
  createdAt: number,
}
```

#### `metalHoldings` (Gold & Silver)
```typescript
{
  _id: Id<"metalHoldings">,
  metal: string,             // "gold" | "silver"
  quantityOz: number,        // ounces owned (e.g., 2.5)
  purchasePricePerOz: number, // price when bought (in cents)
  purchaseDate: number,      // timestamp
  note?: string,             // "2025 American Eagle"
  createdAt: number,
}
```

#### `shoppingList`
```typescript
{
  _id: Id<"shoppingList">,
  item: string,              // "Milk"
  quantity?: string,         // "1 gallon"
  category: string,          // "groceries" | "household" | "personal" | "other"
  completed: boolean,
  priority: string,          // "urgent" | "normal" | "low"
  createdAt: number,
  completedAt?: number,      // when marked done
}
```

#### `dashboardLayout`
```typescript
{
  _id: Id<"dashboardLayout">,
  layouts: string,           // JSON string of react-grid-layout config
  updatedAt: number,
}
```

#### `settings`
```typescript
{
  _id: Id<"settings">,
  key: string,               // "location_lat", "location_lon", "location_name"
  value: string,
  updatedAt: number,
}
```

### Indexes (defined in schema.ts)
```typescript
// transactions
byDate: ["date"]
byCategory: ["category"]
byCategoryAndDate: ["category", "date"]

// income
byDate: ["date"]
byUserId: ["userId"]
bySource: ["source"]
byUserIdAndDate: ["userId", "date"]

// savingsHistory
byGoalId: ["goalId"]
byGoalIdAndDate: ["goalId", "date"]

// shoppingList
byCompleted: ["completed"]
byCategory: ["category"]

// metalHoldings
byMetal: ["metal"]
```

---

## UI/Layout Design

### Default Dashboard Layout (12-column grid)

```
┌─────────────────────────────────────────────────────────────────┐
│  Good Morning! 👋                    Sat, December 13, 2025     │
├──────────────────┬──────────────────┬───────────────────────────┤
│   🌤️ WEATHER     │  💵 INCOME       │      📊 QUICK STATS       │
│   (3 cols)       │  (3 cols)        │      (6 cols)             │
│   48°F           │  Today: $0       │  Expenses: $1,234 | +12%  │
│   H:59° L:26°    │  Week: $0        │  Savings: 34% | Au: +$45  │
├──────────────────┴──────────────────┼───────────────────────────┤
│        🛒 SHOPPING LIST             │    🎯 SAVINGS & METALS    │
│        (6 cols, 2 rows)             │    (6 cols, 2 rows)       │
│   ┌─────────────────────────────┐   │  ┌─────────────────────┐  │
│   │ + Add item...               │   │  │ 🏠 House    $0/$20k │  │
│   ├─────────────────────────────┤   │  │ 🛡️ Emergency  $1k   │  │
│   │ ☐ Milk                      │   │  │ 💰 Gold/Silver +$45 │  │
│   │ ☐ Eggs                      │   │  │    Au:$2,311 Ag:$62 │  │
│   │ ☑ Bread (done)              │   │  └─────────────────────┘  │
│   └─────────────────────────────┘   │                           │
├─────────────────────────────────────┴───────────────────────────┤
│                      💳 EXPENSES (This Month)                   │
│                      (12 cols, 1 row)                           │
│  ┌────────┬────────┬────────┬────────┬────────┬────────┐       │
│  │🛒 $0   │⛽ $0   │🏠 $0   │🍽️ $0   │✈️ $0   │👕 $0   │       │
│  │Grocery │ Gas    │ House  │ Dining │ Travel │Clothing│       │
│  └────────┴────────┴────────┴────────┴────────┴────────┘       │
│                         Total: $0.00   [This Month ▼]          │
└─────────────────────────────────────────────────────────────────┘
```

### Widget Grid Configuration (react-grid-layout)
```javascript
const defaultLayout = [
  { i: 'weather', x: 0, y: 0, w: 3, h: 2, minW: 2, minH: 2 },
  { i: 'income', x: 3, y: 0, w: 3, h: 2, minW: 2, minH: 2 },
  { i: 'quickStats', x: 6, y: 0, w: 6, h: 2, minW: 4, minH: 2 },
  { i: 'shopping', x: 0, y: 2, w: 6, h: 3, minW: 4, minH: 2 },
  { i: 'savings', x: 6, y: 2, w: 6, h: 3, minW: 4, minH: 2 },
  { i: 'expenses', x: 0, y: 5, w: 12, h: 2, minW: 6, minH: 2 },
];
```

### Color Palette
```css
/* Widgets */
--weather-gradient: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
--expenses-gradient: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
--income-bg: #E8F5E9;
--savings-bg: #FFF8E1;
--shopping-bg: #FFFFFF;

/* Categories */
--groceries: #4CAF50;
--gas: #2196F3;
--housing: #FF9800;
--dining: #E91E63;
--travel: #9C27B0;
--clothing: #00BCD4;

/* Status */
--positive: #4CAF50;
--negative: #F44336;
--neutral: #9E9E9E;
```

---

## Widget Specifications

### 1. Weather Widget
- **Display:** Current temp, high/low, conditions, rain chance
- **Click:** Expand to 7-day forecast modal
- **API:** Open-Meteo (free, no key)
- **Refresh:** Every 30 minutes (Convex scheduled function)

### 2. Shopping List Widget
- **Display:** List of items with checkboxes
- **Actions:** Add item, check/uncheck, delete (swipe)
- **Optimistic:** Check/uncheck updates UI immediately
- **Sort:** Uncompleted first, then by priority

### 3. Expenses Widget
- **Display:** Category grid with totals
- **Click category:** Modal to add expense to that category
- **Click total:** Full expenses modal with:
  - Table view (all transactions)
  - Chart view (pie chart by category, bar chart over time)
  - Calendar view (spending by day)
  - Time toggle: This month / This year / Last year

### 4. Income Widget
- **Display:** Today's income, week total
- **Click:** Full income modal with:
  - Person toggle: Dan / Esther / Combined
  - Calendar view (weekly default)
  - Table view (history)
  - Chart view (by source, by month)
  - Add income form with source multi-select

### 5. Savings & Metals Widget (Combined)
- **Display:** List of goals with progress bars + Gold/Silver summary
- **Click goal:** Goal modal with:
  - Progress visualization
  - Add/subtract funds
  - History of contributions
  - Edit goal (target, icon, color)
- **Click Gold/Silver:** Metal portfolio modal with:
  - Holdings list with gain/loss per item
  - Total invested vs current value
  - Add buy/sell transaction
  - Price history chart

### 6. Quick Stats Widget
- **Display:** Key metrics at a glance
  - This month expenses + trend vs last month
  - Savings progress (% of all goals)
  - Gold/Silver gain/loss
- **Click any stat:** Opens relevant modal

---

## API Integrations

### Weather - Open-Meteo
```
GET https://api.open-meteo.com/v1/forecast
  ?latitude={lat}
  &longitude={lon}
  &current=temperature_2m,weather_code,...
  &daily=temperature_2m_max,temperature_2m_min,...
  &temperature_unit=fahrenheit
  &timezone=America/New_York
```

### Metal Prices - metals.live
```
GET https://api.metals.live/v1/spot
Returns: { gold: 2311.50, silver: 62.12, platinum: 1756.20, palladium: 1245.00 }
```

---

## File Structure

```
kitchen-dashboard-app/
├── app/
│   ├── layout.tsx                 # Root layout
│   ├── page.tsx                   # Dashboard page
│   ├── globals.css                # Global styles
│   └── api/
│       └── weather/
│           └── route.ts           # Weather API proxy
│
├── components/
│   ├── layout/
│   │   ├── Dashboard.tsx          # Main grid layout container
│   │   ├── Header.tsx             # Greeting + date
│   │   └── WidgetWrapper.tsx      # Wrapper for drag/resize
│   │
│   ├── widgets/
│   │   ├── WeatherWidget.tsx      # Weather display
│   │   ├── ShoppingWidget.tsx     # Shopping list
│   │   ├── ExpensesWidget.tsx     # Expense categories
│   │   ├── IncomeWidget.tsx       # Income summary
│   │   ├── SavingsWidget.tsx      # Goals + metals
│   │   └── QuickStatsWidget.tsx   # At-a-glance metrics
│   │
│   ├── modals/
│   │   ├── Modal.tsx              # Base modal component
│   │   ├── ExpensesModal.tsx      # Full expenses view
│   │   ├── IncomeModal.tsx        # Full income view
│   │   ├── GoalModal.tsx          # Single goal detail
│   │   ├── MetalsModal.tsx        # Gold/silver portfolio
│   │   ├── AddExpenseModal.tsx    # Add expense form
│   │   ├── AddIncomeModal.tsx     # Add income form
│   │   └── WeatherModal.tsx       # 7-day forecast
│   │
│   ├── forms/
│   │   ├── ExpenseForm.tsx        # Expense input form
│   │   ├── IncomeForm.tsx         # Income input form
│   │   ├── GoalForm.tsx           # Goal edit form
│   │   ├── MetalBuyForm.tsx       # Buy metal form
│   │   └── ShoppingItemForm.tsx   # Add shopping item
│   │
│   ├── charts/
│   │   ├── ExpensesPieChart.tsx   # Spending by category
│   │   ├── ExpensesBarChart.tsx   # Spending over time
│   │   ├── IncomeBarChart.tsx     # Income over time
│   │   ├── IncomeSourceChart.tsx  # Income by source
│   │   └── GoalProgressChart.tsx  # Savings progress
│   │
│   ├── views/
│   │   ├── CalendarView.tsx       # Weekly/monthly calendar
│   │   ├── TableView.tsx          # Data table with sorting
│   │   └── ChartView.tsx          # Chart container
│   │
│   └── ui/
│       ├── Button.tsx             # Reusable button
│       ├── Input.tsx              # Form input
│       ├── Select.tsx             # Dropdown select
│       ├── MultiSelect.tsx        # Tag-style multi-select
│       ├── ProgressBar.tsx        # Progress indicator
│       ├── Toggle.tsx             # Toggle switch
│       ├── Badge.tsx              # Status badge
│       └── Card.tsx               # Card container
│
├── convex/
│   ├── _generated/                # Auto-generated by Convex
│   ├── schema.ts                  # Database schema
│   ├── transactions.ts            # Expense mutations/queries
│   ├── income.ts                  # Income mutations/queries
│   ├── savingsGoals.ts            # Goals mutations/queries
│   ├── savingsHistory.ts          # Goal history
│   ├── metalHoldings.ts           # Metals mutations/queries
│   ├── shoppingList.ts            # Shopping mutations/queries
│   ├── dashboardLayout.ts         # Layout persistence
│   ├── settings.ts                # App settings
│   └── crons.ts                   # Scheduled functions
│
├── hooks/
│   ├── useWeather.ts              # Weather data hook
│   ├── useExpenses.ts             # Expenses queries
│   ├── useIncome.ts               # Income queries
│   ├── useSavings.ts              # Savings queries
│   ├── useMetals.ts               # Metals + prices
│   ├── useShopping.ts             # Shopping list
│   └── useLayout.ts               # Dashboard layout
│
├── lib/
│   ├── utils.ts                   # Utility functions
│   ├── formatters.ts              # Currency, date formatters
│   ├── constants.ts               # App constants
│   └── categories.ts              # Category definitions
│
├── types/
│   └── index.ts                   # TypeScript types
│
├── public/
│   └── icons/                     # Static assets
│
├── convex.json                    # Convex config
├── package.json
├── tailwind.config.js
├── tsconfig.json
└── README.md
```

---

## Development Workflow

### Before Starting ANY Work

1. **Read this README.md** - Understand the full scope
2. **Check the database schema** - Know table/field names exactly
3. **Review file structure** - Know where code belongs

### Feature Development Process

```
┌─────────────────────────────────────────────────────────────────┐
│  1. PLAN                                                        │
│     - Identify which files need to be created/modified          │
│     - Check schema for correct field names                      │
│     - List all components needed                                │
├─────────────────────────────────────────────────────────────────┤
│  2. IMPLEMENT (One feature at a time)                           │
│     - Create Convex functions first (mutations/queries)         │
│     - Create hook to consume Convex data                        │
│     - Create UI component(s)                                    │
│     - Wire up the component to the hook                         │
├─────────────────────────────────────────────────────────────────┤
│  3. TEST                                                        │
│     - Test Convex functions via Convex dashboard                │
│     - Make actual API calls (not just code review)              │
│     - Test UI interactions                                      │
│     - Verify data persists correctly                            │
├─────────────────────────────────────────────────────────────────┤
│  4. BUILD                                                       │
│     - Run: npm run build                                        │
│     - Fix any TypeScript/lint errors                            │
│     - Verify no console errors                                  │
├─────────────────────────────────────────────────────────────────┤
│  5. COMMIT                                                      │
│     - Only after feature is complete + tested + builds          │
│     - Write descriptive commit message                          │
│     - Push to GitHub                                            │
└─────────────────────────────────────────────────────────────────┘
```

### Code Principles

#### Modularity
- **One component per file** - Never combine unrelated components
- **Small files** - If a file exceeds 200 lines, split it
- **Single responsibility** - Each file does ONE thing well

#### Naming Conventions
```typescript
// Components: PascalCase
WeatherWidget.tsx
ExpenseForm.tsx

// Hooks: camelCase with 'use' prefix
useExpenses.ts
useWeather.ts

// Convex functions: camelCase
getTransactions
createTransaction

// Types: PascalCase with descriptive names
Transaction
SavingsGoal
MetalHolding

// Constants: SCREAMING_SNAKE_CASE
EXPENSE_CATEGORIES
DEFAULT_LAYOUT
```

#### Data Flow
```
Convex DB ←→ Convex Functions ←→ React Hooks ←→ Components
                   ↑
            Optimistic Updates
            (UI updates first, then syncs)
```

### Testing Checklist

Before marking a feature complete:

- [ ] Convex mutation creates data correctly
- [ ] Convex query returns expected data
- [ ] UI displays data correctly
- [ ] Forms validate input
- [ ] Optimistic updates work (UI updates before server confirms)
- [ ] Error states are handled
- [ ] Loading states are shown
- [ ] `npm run build` succeeds
- [ ] No console errors in browser

---

## Setup Instructions

### Prerequisites
- Node.js 18+
- npm or yarn
- Convex account (free at https://convex.dev)
- Vercel account (for deployment)

### Installation

```bash
# Clone the repo
git clone https://github.com/dantcacenco/kitchen-dashboard-app.git
cd kitchen-dashboard-app

# Install dependencies
npm install
```

### Convex Setup

#### Option A: Fresh Setup (New Developer)
```bash
# 1. Install Convex
npm install convex

# 2. Login to Convex via Vercel (recommended)
npx convex login --vercel

# 3. Initialize Convex and link to existing project
npx convex dev

# This will:
# - Create the convex/ folder if it doesn't exist
# - Generate types in convex/_generated/
# - Start the Convex dev server
# - Auto-update .env.local with NEXT_PUBLIC_CONVEX_URL
```

#### Option B: Existing Project (Already Set Up)
```bash
# Just run the dev server - it will use existing .env.local
npx convex dev
```

### Environment Variables

The `.env.local` file should contain:
```env
# Convex Database
# Production deploy key - used for Vercel deployments
CONVEX_DEPLOY_KEY=prod:usable-peacock-188|eyJ2MiI6IjI4Y2E4YTI0OWI4ZDQ5YjM4YTBjNzJkODc5NmMwMjVjIn0=

# Convex URL (auto-set by npx convex dev)
NEXT_PUBLIC_CONVEX_URL=https://usable-peacock-188.convex.cloud

# Weather Location (Candler, NC)
NEXT_PUBLIC_WEATHER_LAT=35.5407
NEXT_PUBLIC_WEATHER_LON=-82.6909
NEXT_PUBLIC_LOCATION_NAME=Candler, NC
```

### Running the App

```bash
# Terminal 1: Start Convex dev server (watches for schema changes)
npx convex dev

# Terminal 2: Start Next.js dev server
npm run dev
```

Or run both together:
```bash
# If you have concurrently installed
npm run dev:all
```

### Convex Dashboard
- **Dashboard:** https://dashboard.convex.dev
- **Project:** usable-peacock-188
- Use dashboard to:
  - View/edit data in tables
  - Test queries and mutations
  - Monitor function logs
  - View scheduled jobs (crons)

### Deployment (Vercel)

The app auto-deploys to Vercel when pushing to main branch.
Convex functions deploy automatically via the `CONVEX_DEPLOY_KEY`.

#### Setting Up Vercel Environment Variables (Required for First Deploy)

```bash
# 1. Link project to Vercel (one-time setup)
vercel link --yes

# 2. Add required environment variables
echo "https://usable-peacock-188.convex.cloud" | vercel env add NEXT_PUBLIC_CONVEX_URL production
echo "35.5407" | vercel env add NEXT_PUBLIC_WEATHER_LAT production
echo "-82.6909" | vercel env add NEXT_PUBLIC_WEATHER_LON production
echo "Candler, NC" | vercel env add NEXT_PUBLIC_LOCATION_NAME production

# 3. View all environment variables
vercel env ls

# 4. Pull env vars to local (optional - to sync local with production)
vercel env pull .env.local
```

#### Manual Deploy Commands
```bash
# Deploy Convex functions
npx convex deploy

# Deploy to Vercel manually (if auto-deploy is disabled)
vercel --prod
```

#### Environment Variables Required on Vercel

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXT_PUBLIC_CONVEX_URL` | Convex deployment URL | `https://usable-peacock-188.convex.cloud` |
| `NEXT_PUBLIC_WEATHER_LAT` | Weather location latitude | `35.5407` |
| `NEXT_PUBLIC_WEATHER_LON` | Weather location longitude | `-82.6909` |
| `NEXT_PUBLIC_LOCATION_NAME` | Display name for location | `Candler, NC` |

---

## Implementation Order

### Phase 1: Foundation
1. [ ] Set up Convex with schema
2. [ ] Create base layout with react-grid-layout
3. [ ] Implement layout persistence
4. [ ] Create base Modal component
5. [ ] Create UI primitives (Button, Input, Card, etc.)

### Phase 2: Widgets (Core)
6. [ ] Weather widget (already partially done)
7. [ ] Shopping list with optimistic updates
8. [ ] Expenses widget + modal + forms
9. [ ] Savings goals widget + modal

### Phase 3: Financial Tracking
10. [ ] Income tracking widget + modal
11. [ ] Gold/Silver portfolio
12. [ ] Charts and visualizations

### Phase 4: Polish
13. [ ] Time range toggles
14. [ ] Quick stats widget
15. [ ] Mobile responsiveness
16. [ ] Error handling + offline queue

---

## Notes

- All amounts stored in **cents** (e.g., $45.23 = 4523) to avoid floating point issues
- Timestamps use **Unix milliseconds** for consistency
- Categories are defined as constants in `lib/categories.ts` for easy updates
- The grid uses 12 columns for flexibility (like Bootstrap)

---

*Last updated: December 13, 2025*
