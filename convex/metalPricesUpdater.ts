"use node";

import { internalAction } from "./_generated/server";
import { api } from "./_generated/api";

interface PriceResult {
  gold: number; // in USD per oz
  silver: number; // in USD per oz
  source: string;
}

interface GoldPriceOrgResponse {
  items: Array<{
    curr: string;
    xauPrice: number;
    xagPrice: number;
  }>;
}

interface GoldApiResponse {
  name: string;
  price: number;
  symbol: string;
  updatedAt: string;
}

// Source 1: goldprice.org - Free, no auth required
// Docs: https://goldprice.org (data endpoint found via network inspection)
async function fetchGoldPriceOrg(): Promise<PriceResult | null> {
  try {
    const response = await fetch("https://data-asg.goldprice.org/dbXRates/USD", {
      headers: { "User-Agent": "Mozilla/5.0" },
    });
    if (!response.ok) return null;

    const data: GoldPriceOrgResponse = await response.json();
    if (!data.items || data.items.length === 0) return null;

    return {
      gold: data.items[0].xauPrice,
      silver: data.items[0].xagPrice,
      source: "goldprice.org",
    };
  } catch (error) {
    console.error("goldprice.org fetch failed:", error);
    return null;
  }
}

// Source 2: gold-api.com - Free, no auth required, no rate limits
// Docs: https://gold-api.com/docs
// Endpoints: /price/XAU (gold), /price/XAG (silver)
async function fetchGoldApi(): Promise<PriceResult | null> {
  try {
    // Fetch gold and silver in parallel
    const [goldRes, silverRes] = await Promise.all([
      fetch("https://api.gold-api.com/price/XAU"),
      fetch("https://api.gold-api.com/price/XAG"),
    ]);

    if (!goldRes.ok || !silverRes.ok) return null;

    const goldData: GoldApiResponse = await goldRes.json();
    const silverData: GoldApiResponse = await silverRes.json();

    if (!goldData.price || !silverData.price) return null;

    return {
      gold: goldData.price,
      silver: silverData.price,
      source: "gold-api.com",
    };
  } catch (error) {
    console.error("gold-api.com fetch failed:", error);
    return null;
  }
}

// Calculate median of an array (robust against outliers)
function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

// Calculate average
function average(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

export const updatePrices = internalAction({
  args: {},
  handler: async (ctx) => {
    try {
      // Fetch from multiple verified sources in parallel
      const results = await Promise.all([
        fetchGoldPriceOrg(),
        fetchGoldApi(),
      ]);

      const validResults = results.filter((r): r is PriceResult => r !== null);

      if (validResults.length === 0) {
        console.error("No price data available from any source");
        return;
      }

      // Log individual source prices
      validResults.forEach((r) => {
        console.log(`${r.source}: Gold $${r.gold.toFixed(2)}, Silver $${r.silver.toFixed(2)}`);
      });

      // Get all valid prices
      const goldPrices = validResults.map((r) => r.gold).filter((p) => p > 0);
      const silverPrices = validResults.map((r) => r.silver).filter((p) => p > 0);

      // Use average for 2 sources, median for 3+ sources
      const goldPrice = goldPrices.length >= 3 ? median(goldPrices) : average(goldPrices);
      const silverPrice = silverPrices.length >= 3 ? median(silverPrices) : average(silverPrices);

      if (goldPrice === 0) {
        console.error("No valid gold prices from any source");
        return;
      }

      // Convert to cents and update database
      const goldCents = Math.round(goldPrice * 100);
      const silverCents = Math.round(silverPrice * 100);

      await ctx.runMutation(api.metalHoldings.updatePrices, {
        gold: goldCents,
        silver: silverCents,
      });

      console.log(
        `Prices updated (avg of ${validResults.length} sources): Gold $${(goldCents / 100).toFixed(2)}, Silver $${(silverCents / 100).toFixed(2)}`
      );
    } catch (error) {
      console.error("Failed to update metal prices:", error);
    }
  },
});
