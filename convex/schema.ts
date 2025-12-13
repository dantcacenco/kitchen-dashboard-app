import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Users table - Dan & Esther
  users: defineTable({
    name: v.string(),
    createdAt: v.number(),
  }),

  // Transactions (Expenses)
  transactions: defineTable({
    amount: v.number(), // in cents (e.g., 4523 = $45.23)
    category: v.string(), // "groceries" | "gas" | "housing" | "dining" | "travel" | "clothing" | "healthcare" | "utilities" | "other"
    description: v.string(),
    date: v.number(), // timestamp
    createdAt: v.number(),
    userId: v.optional(v.id("users")),
  })
    .index("byDate", ["date"])
    .index("byCategory", ["category"])
    .index("byCategoryAndDate", ["category", "date"]),

  // Income
  income: defineTable({
    amount: v.number(), // in cents
    source: v.string(), // "hosting" | "dj" | "coding" | "photography" | "construction" | "babysitting" | "cleaning" | custom
    description: v.optional(v.string()),
    date: v.number(), // timestamp of income
    userId: v.id("users"),
    createdAt: v.number(),
  })
    .index("byDate", ["date"])
    .index("byUserId", ["userId"])
    .index("bySource", ["source"])
    .index("byUserIdAndDate", ["userId", "date"]),

  // Income Sources (for multi-select)
  incomeSources: defineTable({
    name: v.string(),
    color: v.string(), // hex color for charts
    createdAt: v.number(),
  }),

  // Savings Goals
  savingsGoals: defineTable({
    name: v.string(),
    targetAmount: v.number(), // in cents (2000000 = $20,000)
    currentAmount: v.number(), // in cents
    icon: v.string(), // emoji
    color: v.string(), // hex color
    priority: v.string(), // "critical" | "high" | "medium" | "low"
    createdAt: v.number(),
  }),

  // Savings History (contributions/withdrawals per goal)
  savingsHistory: defineTable({
    goalId: v.id("savingsGoals"),
    amount: v.number(), // positive = deposit, negative = withdrawal
    note: v.optional(v.string()),
    date: v.number(),
    createdAt: v.number(),
  })
    .index("byGoalId", ["goalId"])
    .index("byGoalIdAndDate", ["goalId", "date"]),

  // Metal Holdings (Gold & Silver)
  metalHoldings: defineTable({
    metal: v.string(), // "gold" | "silver"
    quantityOz: v.number(), // ounces owned
    purchasePricePerOz: v.number(), // price when bought (in cents)
    purchaseDate: v.number(),
    note: v.optional(v.string()),
    soldDate: v.optional(v.number()), // if sold
    soldPricePerOz: v.optional(v.number()), // price when sold
    createdAt: v.number(),
  }).index("byMetal", ["metal"]),

  // Shopping List
  shoppingList: defineTable({
    item: v.string(),
    quantity: v.optional(v.string()),
    category: v.string(), // "groceries" | "household" | "personal" | "other"
    completed: v.boolean(),
    priority: v.string(), // "urgent" | "normal" | "low"
    createdAt: v.number(),
    completedAt: v.optional(v.number()),
  })
    .index("byCompleted", ["completed"])
    .index("byCategory", ["category"]),

  // Dashboard Layout (for react-grid-layout persistence)
  dashboardLayout: defineTable({
    layouts: v.string(), // JSON string of layout config
    updatedAt: v.number(),
  }),

  // Settings
  settings: defineTable({
    key: v.string(),
    value: v.string(),
    updatedAt: v.number(),
  }).index("byKey", ["key"]),
});
