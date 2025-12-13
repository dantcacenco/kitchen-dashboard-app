import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// List all transactions
export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("transactions").order("desc").collect();
  },
});

// List transactions by date range
export const listByDateRange = query({
  args: {
    start: v.number(),
    end: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("transactions")
      .filter((q) =>
        q.and(
          q.gte(q.field("date"), args.start),
          q.lte(q.field("date"), args.end)
        )
      )
      .order("desc")
      .collect();
  },
});

// List transactions by category
export const listByCategory = query({
  args: {
    category: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("transactions")
      .withIndex("byCategory", (q) => q.eq("category", args.category))
      .order("desc")
      .collect();
  },
});

// Add a new transaction
export const add = mutation({
  args: {
    amount: v.number(),
    category: v.string(),
    description: v.string(),
    date: v.number(),
    userId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("transactions", {
      amount: args.amount,
      category: args.category,
      description: args.description,
      date: args.date,
      userId: args.userId,
      createdAt: Date.now(),
    });
  },
});

// Update a transaction
export const update = mutation({
  args: {
    id: v.id("transactions"),
    amount: v.optional(v.number()),
    category: v.optional(v.string()),
    description: v.optional(v.string()),
    date: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    const filteredUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, v]) => v !== undefined)
    );
    await ctx.db.patch(id, filteredUpdates);
  },
});

// Delete a transaction
export const remove = mutation({
  args: {
    id: v.id("transactions"),
  },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

// Get totals by category for a date range
export const getTotalsByCategory = query({
  args: {
    start: v.number(),
    end: v.number(),
  },
  handler: async (ctx, args) => {
    const transactions = await ctx.db
      .query("transactions")
      .filter((q) =>
        q.and(
          q.gte(q.field("date"), args.start),
          q.lte(q.field("date"), args.end)
        )
      )
      .collect();

    const totals: Record<string, number> = {};
    for (const t of transactions) {
      totals[t.category] = (totals[t.category] || 0) + t.amount;
    }
    return totals;
  },
});
