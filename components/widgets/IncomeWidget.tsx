"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { DollarSign, TrendingUp } from "lucide-react";
import { Card } from "@/components/ui";
import { formatCurrency } from "@/lib/formatters";
import { getCurrentMonthRange, sum } from "@/lib/utils";
import { startOfWeek, endOfWeek } from "date-fns";

export function IncomeWidget() {
  // Get this week's range
  const now = new Date();
  const weekStart = startOfWeek(now, { weekStartsOn: 0 }).getTime();
  const weekEnd = endOfWeek(now, { weekStartsOn: 0 }).getTime();

  // Get today's range
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const todayEnd = todayStart + 24 * 60 * 60 * 1000 - 1;

  // Queries
  const weekIncome = useQuery(api.income.listByDateRange, {
    start: weekStart,
    end: weekEnd,
  });

  const todayIncome = useQuery(api.income.listByDateRange, {
    start: todayStart,
    end: todayEnd,
  });

  const todayTotal = sum(todayIncome?.map((i) => i.amount) || []);
  const weekTotal = sum(weekIncome?.map((i) => i.amount) || []);

  return (
    <Card className="h-full bg-green-50 border-green-100">
      <div className="widget-drag-handle h-full flex flex-col">
        {/* Header */}
        <div className="flex items-center gap-2 mb-3">
          <div className="p-2 bg-green-100 rounded-lg">
            <DollarSign className="w-5 h-5 text-green-600" />
          </div>
          <h3 className="font-semibold text-gray-900">Income</h3>
        </div>

        {/* Stats */}
        <div className="space-y-3 flex-1">
          <div>
            <p className="text-xs text-gray-500 uppercase">Today</p>
            <p className="text-2xl font-bold text-gray-900">
              {formatCurrency(todayTotal)}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase">This Week</p>
            <p className="text-lg font-semibold text-gray-700">
              {formatCurrency(weekTotal)}
            </p>
          </div>
        </div>

        {/* Click hint */}
        <div className="flex items-center gap-1 text-xs text-green-600">
          <TrendingUp className="w-3 h-3" />
          <span>Click for details</span>
        </div>
      </div>
    </Card>
  );
}
