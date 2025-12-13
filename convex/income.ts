import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// List all income entries
export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("income").order("desc").collect();
  },
});

// List income by date range
export const listByDateRange = query({
  args: {
    start: v.number(),
    end: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("income")
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

// List income by user
export const listByUser = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("income")
      .withIndex("byUserId", (q) => q.eq("userId", args.userId))
      .order("desc")
      .collect();
  },
});

// List income by user and date range
export const listByUserAndDateRange = query({
  args: {
    userId: v.id("users"),
    start: v.number(),
    end: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("income")
      .withIndex("byUserId", (q) => q.eq("userId", args.userId))
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

// Add income entry
export const add = mutation({
  args: {
    amount: v.number(),
    source: v.string(),
    description: v.optional(v.string()),
    date: v.number(),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("income", {
      amount: args.amount,
      source: args.source,
      description: args.description,
      date: args.date,
      userId: args.userId,
      createdAt: Date.now(),
    });
  },
});

// Update income entry
export const update = mutation({
  args: {
    id: v.id("income"),
    amount: v.optional(v.number()),
    source: v.optional(v.string()),
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

// Delete income entry
export const remove = mutation({
  args: {
    id: v.id("income"),
  },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

// Get totals by source for a date range
export const getTotalsBySource = query({
  args: {
    start: v.number(),
    end: v.number(),
  },
  handler: async (ctx, args) => {
    const income = await ctx.db
      .query("income")
      .filter((q) =>
        q.and(
          q.gte(q.field("date"), args.start),
          q.lte(q.field("date"), args.end)
        )
      )
      .collect();

    const totals: Record<string, number> = {};
    for (const i of income) {
      totals[i.source] = (totals[i.source] || 0) + i.amount;
    }
    return totals;
  },
});
