import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// List all metal holdings
export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("metalHoldings").order("desc").collect();
  },
});

// List active holdings (not sold)
export const listActive = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("metalHoldings")
      .filter((q) => q.eq(q.field("soldDate"), undefined))
      .order("desc")
      .collect();
  },
});

// Get holdings by metal type
export const listByMetal = query({
  args: {
    metal: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("metalHoldings")
      .withIndex("byMetal", (q) => q.eq("metal", args.metal))
      .order("desc")
      .collect();
  },
});

// Get current metal prices (from external API, cached)
// This will be called by a scheduled function to update prices
export const getCurrentPrices = query({
  args: {},
  handler: async (ctx) => {
    // Get from settings table
    const goldSetting = await ctx.db
      .query("settings")
      .withIndex("byKey", (q) => q.eq("key", "gold_price"))
      .first();
    const silverSetting = await ctx.db
      .query("settings")
      .withIndex("byKey", (q) => q.eq("key", "silver_price"))
      .first();

    return {
      gold: goldSetting ? parseInt(goldSetting.value) : 0,
      silver: silverSetting ? parseInt(silverSetting.value) : 0,
    };
  },
});

// Add a new metal purchase
export const add = mutation({
  args: {
    metal: v.string(),
    quantityOz: v.number(),
    purchasePricePerOz: v.number(),
    purchaseDate: v.number(),
    note: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("metalHoldings", {
      ...args,
      createdAt: Date.now(),
    });
  },
});

// Record a sale
export const sell = mutation({
  args: {
    id: v.id("metalHoldings"),
    soldPricePerOz: v.number(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      soldDate: Date.now(),
      soldPricePerOz: args.soldPricePerOz,
    });
  },
});

// Delete a holding
export const remove = mutation({
  args: {
    id: v.id("metalHoldings"),
  },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

// Update metal prices (called by scheduled function)
export const updatePrices = mutation({
  args: {
    gold: v.number(),
    silver: v.number(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Update gold price
    const goldSetting = await ctx.db
      .query("settings")
      .withIndex("byKey", (q) => q.eq("key", "gold_price"))
      .first();

    if (goldSetting) {
      await ctx.db.patch(goldSetting._id, {
        value: args.gold.toString(),
        updatedAt: now,
      });
    } else {
      await ctx.db.insert("settings", {
        key: "gold_price",
        value: args.gold.toString(),
        updatedAt: now,
      });
    }

    // Update silver price
    const silverSetting = await ctx.db
      .query("settings")
      .withIndex("byKey", (q) => q.eq("key", "silver_price"))
      .first();

    if (silverSetting) {
      await ctx.db.patch(silverSetting._id, {
        value: args.silver.toString(),
        updatedAt: now,
      });
    } else {
      await ctx.db.insert("settings", {
        key: "silver_price",
        value: args.silver.toString(),
        updatedAt: now,
      });
    }
  },
});

// Calculate portfolio stats
export const getPortfolioStats = query({
  args: {},
  handler: async (ctx) => {
    const holdings = await ctx.db
      .query("metalHoldings")
      .filter((q) => q.eq(q.field("soldDate"), undefined))
      .collect();

    const goldSetting = await ctx.db
      .query("settings")
      .withIndex("byKey", (q) => q.eq("key", "gold_price"))
      .first();
    const silverSetting = await ctx.db
      .query("settings")
      .withIndex("byKey", (q) => q.eq("key", "silver_price"))
      .first();

    const goldPrice = goldSetting ? parseInt(goldSetting.value) : 0;
    const silverPrice = silverSetting ? parseInt(silverSetting.value) : 0;

    let totalInvested = 0;
    let totalCurrentValue = 0;
    let goldOz = 0;
    let silverOz = 0;

    for (const h of holdings) {
      const currentPrice = h.metal === "gold" ? goldPrice : silverPrice;
      totalInvested += h.quantityOz * h.purchasePricePerOz;
      totalCurrentValue += h.quantityOz * currentPrice;

      if (h.metal === "gold") {
        goldOz += h.quantityOz;
      } else {
        silverOz += h.quantityOz;
      }
    }

    return {
      totalInvested,
      totalCurrentValue,
      gainLoss: totalCurrentValue - totalInvested,
      gainLossPercent:
        totalInvested > 0
          ? ((totalCurrentValue - totalInvested) / totalInvested) * 100
          : 0,
      goldOz,
      silverOz,
      goldPrice,
      silverPrice,
    };
  },
});
