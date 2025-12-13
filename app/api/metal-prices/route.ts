import { NextResponse } from "next/server";

interface MetalPrice {
  gold: number;
  silver: number;
  platinum?: number;
  palladium?: number;
  timestamp: number;
}

interface MetalsLiveResponse {
  gold: number;
  silver: number;
  platinum?: number;
  palladium?: number;
}

export async function GET() {
  try {
    // metals.live provides free spot prices
    const response = await fetch("https://api.metals.live/v1/spot", {
      next: { revalidate: 300 }, // Cache for 5 minutes
    });

    if (!response.ok) {
      throw new Error(`Metals API error: ${response.status}`);
    }

    const data: MetalsLiveResponse[] = await response.json();

    // metals.live returns an array with the latest prices
    // Each item has gold, silver, etc. in USD per troy ounce
    const latestPrices = data[0];

    if (!latestPrices) {
      throw new Error("No price data available");
    }

    // Convert to cents for consistency with our database
    const prices: MetalPrice = {
      gold: Math.round(latestPrices.gold * 100),
      silver: Math.round(latestPrices.silver * 100),
      platinum: latestPrices.platinum
        ? Math.round(latestPrices.platinum * 100)
        : undefined,
      palladium: latestPrices.palladium
        ? Math.round(latestPrices.palladium * 100)
        : undefined,
      timestamp: Date.now(),
    };

    return NextResponse.json(prices);
  } catch (error) {
    console.error("Metal prices API error:", error);

    // Return fallback prices if API fails (last known approximate prices)
    return NextResponse.json(
      {
        gold: 260000, // ~$2600/oz
        silver: 3000, // ~$30/oz
        timestamp: Date.now(),
        error: "Using fallback prices",
      },
      { status: 200 }
    );
  }
}
