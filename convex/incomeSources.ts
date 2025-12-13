import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// List all income sources
export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("incomeSources").collect();
  },
});

// Add a new income source
export const add = mutation({
  args: {
    name: v.string(),
    color: v.string(),
  },
  handler: async (ctx, args) => {
    // Check if source already exists
    const existing = await ctx.db.query("incomeSources").collect();
    const exists = existing.some(
      (s) => s.name.toLowerCase() === args.name.toLowerCase()
    );

    if (exists) {
      throw new Error("Income source already exists");
    }

    return await ctx.db.insert("incomeSources", {
      name: args.name,
      color: args.color,
      createdAt: Date.now(),
    });
  },
});

// Delete an income source
export const remove = mutation({
  args: {
    id: v.id("incomeSources"),
  },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});
