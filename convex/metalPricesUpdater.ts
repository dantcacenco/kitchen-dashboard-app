"use node";

import { internalAction } from "./_generated/server";
import { api } from "./_generated/api";

interface GoldPriceResponse {
  items: Array<{
    curr: string;
    xauPrice: number; // Gold price per oz in USD
    xagPrice: number; // Silver price per oz in USD
  }>;
}

export const updatePrices = internalAction({
  args: {},
  handler: async (ctx) => {
    try {
      // Fetch prices from goldprice.org (free, no API key required)
      const response = await fetch("https://data-asg.goldprice.org/dbXRates/USD");

      if (!response.ok) {
        console.error(`Gold Price API error: ${response.status}`);
        return;
      }

      const data: GoldPriceResponse = await response.json();

      if (!data.items || data.items.length === 0) {
        console.error("No price data available from goldprice.org");
        return;
      }

      const prices = data.items[0];

      // Convert to cents and update database
      const goldCents = Math.round(prices.xauPrice * 100);
      const silverCents = Math.round(prices.xagPrice * 100);

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
