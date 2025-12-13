"use node";

import { internalAction } from "./_generated/server";
import { api } from "./_generated/api";

export const updatePrices = internalAction({
  args: {},
  handler: async (ctx) => {
    try {
      // Fetch prices from metals.live
      const response = await fetch("https://api.metals.live/v1/spot");

      if (!response.ok) {
        console.error(`Metals API error: ${response.status}`);
        return;
      }

      const data = await response.json();
      const latestPrices = data[0];

      if (!latestPrices) {
        console.error("No price data available from metals.live");
        return;
      }

      // Convert to cents and update database
      const goldCents = Math.round(latestPrices.gold * 100);
      const silverCents = Math.round(latestPrices.silver * 100);

      await ctx.runMutation(api.metalHoldings.updatePrices, {
        gold: goldCents,
        silver: silverCents,
      });

      console.log(
        `Metal prices updated: Gold $${(goldCents / 100).toFixed(2)}, Silver $${(silverCents / 100).toFixed(2)}`
      );
    } catch (error) {
      console.error("Failed to update metal prices:", error);
    }
  },
});
