"use client";

import { useMemo } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { TimeRange, Income } from "@/types";
import { getTimeRange } from "@/lib/utils";
import { DEFAULT_INCOME_SOURCES } from "@/lib/constants";

function getSourceColor(source: string): string {
  const found = DEFAULT_INCOME_SOURCES.find(
    (s) => s.name.toLowerCase() === source.toLowerCase()
  );
  return found?.color || "#9E9E9E";
}

export function useIncome(
  timeRange: TimeRange = "this_month",
  userFilter: string = "all"
) {
  const { start, end } = getTimeRange(timeRange);

  const users = useQuery(api.users.list);
  const allIncome = useQuery(api.income.listByDateRange, { start, end });
  const incomeSources = useQuery(api.incomeSources.list);
  const addIncome = useMutation(api.income.add);
  const removeIncome = useMutation(api.income.remove);

  // Filter income by user
  const income = useMemo(() => {
    if (!allIncome) return [];
    if (userFilter === "all") return allIncome;
    return allIncome.filter((i) => i.userId === userFilter);
  }, [allIncome, userFilter]);

  // Calculate totals by source
  const sourceTotals = useMemo(() => {
    const totals: Record<string, number> = {};
    for (const i of income) {
      const sources = i.source.split(", ");
      const perSourceAmount = i.amount / sources.length;
      for (const s of sources) {
        totals[s] = (totals[s] || 0) + perSourceAmount;
      }
    }
    return totals;
  }, [income]);

  // Calculate totals by user
  const userTotals = useMemo(() => {
    if (!allIncome || !users) return {};
    const totals: Record<string, number> = {};
    for (const i of allIncome) {
      totals[i.userId] = (totals[i.userId] || 0) + i.amount;
    }
    return totals;
  }, [allIncome, users]);

  const totalAmount = useMemo(() => {
    return income.reduce((sum, i) => sum + i.amount, 0);
  }, [income]);

  const chartData = useMemo(() => {
    return Object.entries(sourceTotals)
      .map(([source, amount]) => ({
        source,
        amount,
        color: getSourceColor(source),
        percent: totalAmount > 0 ? (amount / totalAmount) * 100 : 0,
      }))
      .sort((a, b) => b.amount - a.amount);
  }, [sourceTotals, totalAmount]);

  const add = async (data: {
    amount: number;
    source: string;
    description?: string;
    date: number;
    userId: Id<"users">;
  }) => {
    return addIncome(data);
  };

  const remove = async (id: Id<"income">) => {
    return removeIncome({ id });
  };

  const getUserName = (userId: Id<"users">) => {
    return users?.find((u) => u._id === userId)?.name || "Unknown";
  };

  return {
    income,
    allIncome: allIncome || [],
    users: users || [],
    incomeSources: incomeSources || [],
    loading: allIncome === undefined || users === undefined,
    sourceTotals,
    userTotals,
    totalAmount,
    chartData,
    add,
    remove,
    getUserName,
  };
}
