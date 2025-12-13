import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Get the current dashboard layout
export const get = query({
  args: {},
  handler: async (ctx) => {
    const layouts = await ctx.db.query("dashboardLayout").first();
    return layouts;
  },
});

// Save dashboard layout
export const save = mutation({
  args: {
    layouts: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.query("dashboardLayout").first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        layouts: args.layouts,
        updatedAt: Date.now(),
      });
      return existing._id;
    }

    return await ctx.db.insert("dashboardLayout", {
      layouts: args.layouts,
      updatedAt: Date.now(),
    });
  },
});
