"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { TrendingUp, TrendingDown, Wallet, PiggyBank, Coins } from "lucide-react";
import { Card } from "@/components/ui";
import { formatCurrency, formatPercentChange } from "@/lib/formatters";
import { getCurrentMonthRange, getLastMonthRange, sum, calculatePercentage } from "@/lib/utils";

export function QuickStatsWidget() {
  // Get this month and last month ranges
  const thisMonth = getCurrentMonthRange();
  const lastMonth = getLastMonthRange();

  // Queries
  const thisMonthExpenses = useQuery(api.transactions.listByDateRange, thisMonth);
  const lastMonthExpenses = useQuery(api.transactions.listByDateRange, lastMonth);
  const goals = useQuery(api.savingsGoals.list);
  const metalStats = useQuery(api.metalHoldings.getPortfolioStats);

  // Calculate stats
  const thisMonthTotal = sum(thisMonthExpenses?.map((t) => t.amount) || []);
  const lastMonthTotal = sum(lastMonthExpenses?.map((t) => t.amount) || []);
  const expenseChange = lastMonthTotal > 0
    ? ((thisMonthTotal - lastMonthTotal) / lastMonthTotal) * 100
    : 0;

  // Savings progress (average of all goals)
  const totalTarget = sum(goals?.map((g) => g.targetAmount) || []);
  const totalCurrent = sum(goals?.map((g) => g.currentAmount) || []);
  const savingsProgress = calculatePercentage(totalCurrent, totalTarget);

  const metalGainLoss = metalStats?.gainLoss || 0;

  return (
    <Card className="h-full">
      <div className="widget-drag-handle h-full">
        <h3 className="text-sm font-medium text-gray-500 mb-4">Quick Stats</h3>

        <div className="grid grid-cols-3 gap-4 h-[calc(100%-2rem)]">
          {/* Expenses */}
          <div className="flex flex-col justify-center">
            <div className="flex items-center gap-2 mb-1">
              <Wallet className="w-4 h-4 text-red-500" />
              <span className="text-xs text-gray-500">Expenses</span>
            </div>
            <div className="text-xl font-bold text-gray-900">
              {formatCurrency(thisMonthTotal)}
            </div>
            <div
              className={`text-xs flex items-center gap-0.5 ${expenseChange > 0 ? "text-red-500" : "text-green-500"}`}
            >
              {expenseChange > 0 ? (
                <TrendingUp className="w-3 h-3" />
              ) : (
                <TrendingDown className="w-3 h-3" />
              )}
              <span>{Math.abs(expenseChange).toFixed(1)}% vs last month</span>
            </div>
          </div>

          {/* Savings */}
          <div className="flex flex-col justify-center">
            <div className="flex items-center gap-2 mb-1">
              <PiggyBank className="w-4 h-4 text-blue-500" />
              <span className="text-xs text-gray-500">Savings</span>
            </div>
            <div className="text-xl font-bold text-gray-900">
              {savingsProgress.toFixed(0)}%
            </div>
            <div className="text-xs text-gray-500">
              of total goals
            </div>
          </div>

          {/* Metals */}
          <div className="flex flex-col justify-center">
            <div className="flex items-center gap-2 mb-1">
              <Coins className="w-4 h-4 text-amber-500" />
              <span className="text-xs text-gray-500">Gold & Silver</span>
            </div>
            <div
              className={`text-xl font-bold ${metalGainLoss >= 0 ? "text-green-600" : "text-red-600"}`}
            >
              {metalGainLoss >= 0 ? "+" : ""}
              {formatCurrency(metalGainLoss)}
            </div>
            <div className="text-xs text-gray-500">
              {metalStats?.goldPrice && metalStats?.silverPrice
                ? `${Math.round(metalStats.goldPrice / metalStats.silverPrice)}:1 Au/Ag`
                : "-- Au/Ag ratio"}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
