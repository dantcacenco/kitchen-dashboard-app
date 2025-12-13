import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { api } from "./_generated/api";

const http = httpRouter();

interface GoldPriceResponse {
  items: Array<{
    curr: string;
    xauPrice: number;
    xagPrice: number;
  }>;
}

// Endpoint to update metal prices - can be called by a cron job or manually
http.route({
  path: "/update-metal-prices",
  method: "POST",
  handler: httpAction(async (ctx) => {
    try {
      // Fetch prices from goldprice.org (free, no API key required)
      const response = await fetch("https://data-asg.goldprice.org/dbXRates/USD");

      if (!response.ok) {
        throw new Error(`Gold Price API error: ${response.status}`);
      }

      const data: GoldPriceResponse = await response.json();

      if (!data.items || data.items.length === 0) {
        throw new Error("No price data available");
      }

      const prices = data.items[0];

      // Convert to cents and update database
      const goldCents = Math.round(prices.xauPrice * 100);
      const silverCents = Math.round(prices.xagPrice * 100);

      await ctx.runMutation(api.metalHoldings.updatePrices, {
        gold: goldCents,
        silver: silverCents,
      });

      return new Response(
        JSON.stringify({
          success: true,
          gold: goldCents,
          silver: silverCents,
          timestamp: Date.now(),
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    } catch (error) {
      console.error("Failed to update metal prices:", error);
      return new Response(
        JSON.stringify({ error: "Failed to update metal prices" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
  }),
});

// GET endpoint to fetch current prices from Convex
http.route({
  path: "/metal-prices",
  method: "GET",
  handler: httpAction(async (ctx) => {
    const prices = await ctx.runQuery(api.metalHoldings.getCurrentPrices, {});

    return new Response(
      JSON.stringify({
        gold: prices.gold,
        silver: prices.silver,
        timestamp: Date.now(),
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  }),
});

export default http;
