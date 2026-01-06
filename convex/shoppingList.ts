import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// List all shopping items
export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("shoppingList").collect();
  },
});

// Add a new shopping item
export const add = mutation({
  args: {
    item: v.string(),
    quantity: v.optional(v.string()),
    category: v.string(),
    priority: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("shoppingList", {
      item: args.item,
      quantity: args.quantity,
      category: args.category,
      priority: args.priority,
      completed: false,
      createdAt: Date.now(),
    });
  },
});

// Toggle item completion
export const toggle = mutation({
  args: {
    id: v.id("shoppingList"),
    completed: v.boolean(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      completed: args.completed,
      completedAt: args.completed ? Date.now() : undefined,
    });
  },
});

// Remove an item
export const remove = mutation({
  args: {
    id: v.id("shoppingList"),
  },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

// Clear completed items
export const clearCompleted = mutation({
  args: {},
  handler: async (ctx) => {
    const completed = await ctx.db
      .query("shoppingList")
      .filter((q) => q.eq(q.field("completed"), true))
      .collect();

    for (const item of completed) {
      await ctx.db.delete(item._id);
    }

    return completed.length;
  },
});

// Clear all items
export const clearAll = mutation({
  args: {},
  handler: async (ctx) => {
    const allItems = await ctx.db.query("shoppingList").collect();

    // Delete items sequentially (Convex requirement)
    for (const item of allItems) {
      await ctx.db.delete(item._id);
    }

    return allItems.length;
  },
});
