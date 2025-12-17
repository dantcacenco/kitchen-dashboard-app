"use client";

import { useMemo } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { MetalType } from "@/types";

export function useMetals() {
  const holdings = useQuery(api.metalHoldings.listActive);
  const allHoldings = useQuery(api.metalHoldings.list);
  const prices = useQuery(api.metalHoldings.getCurrentPrices);
  const stats = useQuery(api.metalHoldings.getPortfolioStats);
  const addHolding = useMutation(api.metalHoldings.add);
  const sellHolding = useMutation(api.metalHoldings.sell);
  const removeHolding = useMutation(api.metalHoldings.remove);

  // Calculate per-holding gains
  const holdingsWithGains = useMemo(() => {
    if (!holdings || !prices) return [];
    return holdings.map((h) => {
      const currentPrice = h.metal === "gold" ? prices.gold : prices.silver;
      const invested = h.quantityOz * h.purchasePricePerOz;
      const currentValue = h.quantityOz * currentPrice;
      const gainLoss = currentValue - invested;
      const gainLossPercent = invested > 0 ? (gainLoss / invested) * 100 : 0;

      return {
        ...h,
        currentPrice,
        invested,
        currentValue,
        gainLoss,
        gainLossPercent,
      };
    });
  }, [holdings, prices]);

  const add = async (data: {
    metal: string;
    quantityOz: number;
    purchasePricePerOz: number;
    purchaseDate: number;
    note?: string;
  }) => {
    return addHolding(data);
  };

  const sell = async (id: Id<"metalHoldings">, soldPricePerOz: number) => {
    return sellHolding({ id, soldPricePerOz });
  };

  const remove = async (id: Id<"metalHoldings">) => {
    return removeHolding({ id });
  };

  return {
    holdings: holdingsWithGains,
    allHoldings: allHoldings || [],
    prices: prices || { gold: 0, silver: 0, updatedAt: null },
    stats: stats || {
      totalInvested: 0,
      totalCurrentValue: 0,
      gainLoss: 0,
      gainLossPercent: 0,
      goldOz: 0,
      silverOz: 0,
      goldPrice: 0,
      silverPrice: 0,
      pricesUpdatedAt: null,
    },
    loading: holdings === undefined || prices === undefined,
    add,
    sell,
    remove,
  };
}
