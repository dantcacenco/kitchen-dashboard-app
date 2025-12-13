import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// List all savings goals
export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("savingsGoals").collect();
  },
});

// Get a single goal by ID
export const get = query({
  args: {
    id: v.id("savingsGoals"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

// Add a new savings goal
export const add = mutation({
  args: {
    name: v.string(),
    targetAmount: v.number(),
    currentAmount: v.number(),
    icon: v.string(),
    color: v.string(),
    priority: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("savingsGoals", {
      ...args,
      createdAt: Date.now(),
    });
  },
});

// Update a savings goal
export const update = mutation({
  args: {
    id: v.id("savingsGoals"),
    name: v.optional(v.string()),
    targetAmount: v.optional(v.number()),
    currentAmount: v.optional(v.number()),
    icon: v.optional(v.string()),
    color: v.optional(v.string()),
    priority: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    const filteredUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, v]) => v !== undefined)
    );
    await ctx.db.patch(id, filteredUpdates);
  },
});

// Add to a savings goal (creates history entry)
export const addFunds = mutation({
  args: {
    goalId: v.id("savingsGoals"),
    amount: v.number(), // positive for deposit, negative for withdrawal
    note: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Get current goal
    const goal = await ctx.db.get(args.goalId);
    if (!goal) throw new Error("Goal not found");

    // Update current amount
    await ctx.db.patch(args.goalId, {
      currentAmount: goal.currentAmount + args.amount,
    });

    // Create history entry
    await ctx.db.insert("savingsHistory", {
      goalId: args.goalId,
      amount: args.amount,
      note: args.note,
      date: Date.now(),
      createdAt: Date.now(),
    });
  },
});

// Delete a savings goal
export const remove = mutation({
  args: {
    id: v.id("savingsGoals"),
  },
  handler: async (ctx, args) => {
    // Delete associated history
    const history = await ctx.db
      .query("savingsHistory")
      .withIndex("byGoalId", (q) => q.eq("goalId", args.id))
      .collect();

    for (const entry of history) {
      await ctx.db.delete(entry._id);
    }

    await ctx.db.delete(args.id);
  },
});

// Get history for a goal
export const getHistory = query({
  args: {
    goalId: v.id("savingsGoals"),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("savingsHistory")
      .withIndex("byGoalId", (q) => q.eq("goalId", args.goalId))
      .order("desc")
      .collect();
  },
});
