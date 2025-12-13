"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Target, TrendingUp, TrendingDown, Plus } from "lucide-react";
import { Card, ProgressBar } from "@/components/ui";
import { formatCurrency, formatCurrencyCompact } from "@/lib/formatters";
import { calculatePercentage } from "@/lib/utils";

interface SavingsWidgetProps {
  onGoalClick?: (goalId: Id<"savingsGoals">) => void;
  onMetalsClick?: () => void;
  onAddGoal?: () => void;
}

export function SavingsWidget({ onGoalClick, onMetalsClick, onAddGoal }: SavingsWidgetProps) {
  const goals = useQuery(api.savingsGoals.list);
  const metalPrices = useQuery(api.metalHoldings.getCurrentPrices);
  const holdings = useQuery(api.metalHoldings.list);

  // Calculate metal portfolio value
  const metalPortfolio = holdings?.reduce(
    (acc, h) => {
      if (!h.soldDate) {
        const currentPrice =
          h.metal === "gold"
            ? (metalPrices?.gold || 0)
            : (metalPrices?.silver || 0);
        const invested = h.quantityOz * h.purchasePricePerOz;
        const current = h.quantityOz * currentPrice;
        acc.invested += invested;
        acc.current += current;
      }
      return acc;
    },
    { invested: 0, current: 0 }
  ) || { invested: 0, current: 0 };

  const metalGainLoss = metalPortfolio.current - metalPortfolio.invested;
  const metalGainPercent =
    metalPortfolio.invested > 0
      ? (metalGainLoss / metalPortfolio.invested) * 100
      : 0;

  return (
    <Card className="h-full bg-amber-50 border-amber-100">
      <div className="widget-drag-handle h-full flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5 text-amber-600" />
            <h3 className="font-semibold text-gray-900">Savings & Metals</h3>
          </div>
          <button
            className="p-1 hover:bg-amber-100 rounded"
            onClick={onAddGoal}
          >
            <Plus className="w-4 h-4 text-amber-600" />
          </button>
        </div>

        {/* Goals list */}
        <div className="flex-1 space-y-3 overflow-y-auto">
          {goals?.slice(0, 4).map((goal) => {
            const progress = calculatePercentage(
              goal.currentAmount,
              goal.targetAmount
            );
            return (
              <button
                key={goal._id}
                className="w-full text-left hover:bg-amber-100/50 rounded-lg p-2 -m-2 transition-colors"
                onClick={() => onGoalClick?.(goal._id)}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium flex items-center gap-1.5">
                    <span>{goal.icon}</span>
                    <span className="truncate">{goal.name}</span>
                  </span>
                  <span className="text-xs text-gray-500">
                    {formatCurrencyCompact(goal.currentAmount)} /{" "}
                    {formatCurrencyCompact(goal.targetAmount)}
                  </span>
                </div>
                <ProgressBar
                  value={progress}
                  size="sm"
                  color={goal.color}
                />
              </button>
            );
          })}

          {/* Gold & Silver summary */}
          <div className="pt-2 border-t border-amber-200">
            <button
              className="w-full text-left hover:bg-amber-100/50 rounded-lg p-2 -m-2 transition-colors"
              onClick={onMetalsClick}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium flex items-center gap-1.5">
                  <span>💰</span>
                  <span>Gold & Silver</span>
                </span>
                <div className="flex items-center gap-1">
                  {metalGainLoss >= 0 ? (
                    <TrendingUp className="w-3 h-3 text-green-500" />
                  ) : (
                    <TrendingDown className="w-3 h-3 text-red-500" />
                  )}
                  <span
                    className={`text-sm font-semibold ${metalGainLoss >= 0 ? "text-green-600" : "text-red-600"}`}
                  >
                    {metalGainLoss >= 0 ? "+" : ""}
                    {formatCurrency(metalGainLoss)}
                  </span>
                </div>
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Au: ${((metalPrices?.gold || 0) / 100).toFixed(0)}/oz | Ag: $
                {((metalPrices?.silver || 0) / 100).toFixed(2)}/oz
              </div>
            </button>
          </div>
        </div>
      </div>
    </Card>
  );
}
