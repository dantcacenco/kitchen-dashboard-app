import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// List all users
export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("users").collect();
  },
});

// Get a user by ID
export const get = query({
  args: {
    id: v.id("users"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

// Add a new user
export const add = mutation({
  args: {
    name: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("users", {
      name: args.name,
      createdAt: Date.now(),
    });
  },
});

// Initialize default users (Dan and Esther)
export const initializeDefaults = mutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db.query("users").collect();

    if (existing.length === 0) {
      await ctx.db.insert("users", {
        name: "Dan",
        createdAt: Date.now(),
      });
      await ctx.db.insert("users", {
        name: "Esther",
        createdAt: Date.now(),
      });
    }

    return await ctx.db.query("users").collect();
  },
});
