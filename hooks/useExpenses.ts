"use client";

import { useMemo } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { TimeRange, Transaction, ExpenseCategory } from "@/types";
import { getTimeRange } from "@/lib/utils";
import { EXPENSE_CATEGORIES } from "@/lib/constants";

export function useExpenses(timeRange: TimeRange = "this_month") {
  const { start, end } = getTimeRange(timeRange);

  const transactions = useQuery(api.transactions.listByDateRange, { start, end });
  const addTransaction = useMutation(api.transactions.add);
  const updateTransaction = useMutation(api.transactions.update);
  const removeTransaction = useMutation(api.transactions.remove);

  const totals = useMemo(() => {
    if (!transactions) return {};
    const result: Record<string, number> = {};
    for (const t of transactions) {
      result[t.category] = (result[t.category] || 0) + t.amount;
    }
    return result;
  }, [transactions]);

  const totalAmount = useMemo(() => {
    return Object.values(totals).reduce((sum, v) => sum + v, 0);
  }, [totals]);

  const chartData = useMemo(() => {
    return Object.entries(totals)
      .map(([category, amount]) => ({
        category,
        amount,
        label: EXPENSE_CATEGORIES[category as ExpenseCategory]?.label || category,
        color: EXPENSE_CATEGORIES[category as ExpenseCategory]?.color || "#9E9E9E",
        percent: totalAmount > 0 ? (amount / totalAmount) * 100 : 0,
      }))
      .sort((a, b) => b.amount - a.amount);
  }, [totals, totalAmount]);

  const add = async (data: {
    amount: number;
    category: string;
    description: string;
    date: number;
    userId?: Id<"users">;
  }) => {
    return addTransaction(data);
  };

  const update = async (
    id: Id<"transactions">,
    data: {
      amount?: number;
      category?: string;
      description?: string;
      date?: number;
    }
  ) => {
    return updateTransaction({ id, ...data });
  };

  const remove = async (id: Id<"transactions">) => {
    return removeTransaction({ id });
  };

  return {
    transactions: transactions || [],
    loading: transactions === undefined,
    totals,
    totalAmount,
    chartData,
    add,
    update,
    remove,
  };
}
