import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { api } from "./_generated/api";

const http = httpRouter();

// Endpoint to update metal prices - can be called by a cron job or manually
http.route({
  path: "/update-metal-prices",
  method: "POST",
  handler: httpAction(async (ctx) => {
    try {
      // Fetch prices from metals.live
      const response = await fetch("https://api.metals.live/v1/spot");

      if (!response.ok) {
        throw new Error(`Metals API error: ${response.status}`);
      }

      const data = await response.json();
      const latestPrices = data[0];

      if (!latestPrices) {
        throw new Error("No price data available");
      }

      // Convert to cents and update database
      const goldCents = Math.round(latestPrices.gold * 100);
      const silverCents = Math.round(latestPrices.silver * 100);

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
