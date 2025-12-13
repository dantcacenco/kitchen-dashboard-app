import { NextResponse } from "next/server";

interface MetalPrice {
  gold: number;
  silver: number;
  timestamp: number;
}

interface GoldPriceResponse {
  items: Array<{
    curr: string;
    xauPrice: number;
    xagPrice: number;
  }>;
}

export async function GET() {
  try {
    // goldprice.org provides free spot prices (no API key required)
    const response = await fetch("https://data-asg.goldprice.org/dbXRates/USD", {
      next: { revalidate: 300 }, // Cache for 5 minutes
    });

    if (!response.ok) {
      throw new Error(`Gold Price API error: ${response.status}`);
    }

    const data: GoldPriceResponse = await response.json();

    if (!data.items || data.items.length === 0) {
      throw new Error("No price data available");
    }

    const latestPrices = data.items[0];

    // Convert to cents for consistency with our database
    const prices: MetalPrice = {
      gold: Math.round(latestPrices.xauPrice * 100),
      silver: Math.round(latestPrices.xagPrice * 100),
      timestamp: Date.now(),
    };

    return NextResponse.json(prices);
  } catch (error) {
    console.error("Metal prices API error:", error);

    // Return error - frontend should use cached Convex data
    return NextResponse.json(
      {
        error: "Failed to fetch live prices. Using last known prices from database.",
        timestamp: Date.now(),
      },
      { status: 503 }
    );
  }
}
