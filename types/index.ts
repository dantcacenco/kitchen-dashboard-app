import { Id } from "../convex/_generated/dataModel";

// User types
export type User = {
  _id: Id<"users">;
  name: string;
  createdAt: number;
};

// Transaction (Expense) types
export type Transaction = {
  _id: Id<"transactions">;
  amount: number;
  category: ExpenseCategory;
  description: string;
  date: number;
  createdAt: number;
  userId?: Id<"users">;
};

export type ExpenseCategory =
  | "groceries"
  | "gas"
  | "housing"
  | "dining"
  | "travel"
  | "clothing"
  | "healthcare"
  | "utilities"
  | "other";

// Income types
export type Income = {
  _id: Id<"income">;
  amount: number;
  source: string;
  description?: string;
  date: number;
  userId: Id<"users">;
  createdAt: number;
};

export type IncomeSource = {
  _id: Id<"incomeSources">;
  name: string;
  color: string;
  createdAt: number;
};

// Savings types
export type SavingsGoal = {
  _id: Id<"savingsGoals">;
  name: string;
  targetAmount: number;
  currentAmount: number;
  icon: string;
  color: string;
  priority: Priority;
  createdAt: number;
};

export type SavingsHistoryEntry = {
  _id: Id<"savingsHistory">;
  goalId: Id<"savingsGoals">;
  amount: number;
  note?: string;
  date: number;
  createdAt: number;
};

export type Priority = "critical" | "high" | "medium" | "low";

// Metal types
export type MetalHolding = {
  _id: Id<"metalHoldings">;
  metal: MetalType;
  quantityOz: number;
  purchasePricePerOz: number;
  purchaseDate: number;
  note?: string;
  soldDate?: number;
  soldPricePerOz?: number;
  createdAt: number;
};

export type MetalType = "gold" | "silver";

export type MetalPrices = {
  gold: number;
  silver: number;
  platinum?: number;
  palladium?: number;
};

// Shopping types
export type ShoppingItem = {
  _id: Id<"shoppingList">;
  item: string;
  quantity?: string;
  category: ShoppingCategory;
  completed: boolean;
  priority: ShoppingPriority;
  createdAt: number;
  completedAt?: number;
};

export type ShoppingCategory = "groceries" | "household" | "personal" | "other";
export type ShoppingPriority = "urgent" | "normal" | "low";

// Layout types
export type LayoutItem = {
  i: string;
  x: number;
  y: number;
  w: number;
  h: number;
  minW?: number;
  minH?: number;
  maxW?: number;
  maxH?: number;
};

export type DashboardLayout = {
  _id: Id<"dashboardLayout">;
  layouts: string;
  updatedAt: number;
};

// Weather types
export type Weather = {
  current: {
    temp: number;
    feels_like: number;
    humidity: number;
    wind_speed: number;
    weather_code: number;
    description: string;
  };
  daily: DailyForecast[];
};

export type DailyForecast = {
  date: string;
  temp_max: number;
  temp_min: number;
  weather_code: number;
  precipitation_probability: number;
  description: string;
};

// Time range for filtering
export type TimeRange = "this_month" | "this_year" | "last_year" | "all_time";

// Modal types
export type ModalType =
  | "expenses"
  | "income"
  | "goal"
  | "metals"
  | "weather"
  | "add_expense"
  | "add_income"
  | null;
