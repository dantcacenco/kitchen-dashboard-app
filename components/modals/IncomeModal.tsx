"use client";

import { useState, useMemo } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Modal, Button } from "@/components/ui";
import { formatCurrency, formatDate } from "@/lib/formatters";
import { DEFAULT_INCOME_SOURCES } from "@/lib/constants";
import { IncomeSourceChart, IncomeBarChart } from "@/components/charts";
import { ChartView } from "@/components/views";
import {
  Plus,
  Table,
  BarChart3,
  PieChart,
  Trash2,
  User,
  DollarSign,
  Users,
} from "lucide-react";
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear } from "date-fns";

interface IncomeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddNew: () => void;
}

type TimeRange = "this_week" | "this_month" | "this_year" | "all_time";
type UserFilter = "all" | "dan" | "esther";

const TIME_RANGE_LABELS: Record<TimeRange, string> = {
  this_week: "This Week",
  this_month: "This Month",
  this_year: "This Year",
  all_time: "All Time",
};

function getDateRange(range: TimeRange): { start: number; end: number } {
  const now = new Date();

  switch (range) {
    case "this_week": {
      return {
        start: startOfWeek(now, { weekStartsOn: 0 }).getTime(),
        end: endOfWeek(now, { weekStartsOn: 0 }).getTime(),
      };
    }
    case "this_month": {
      return {
        start: startOfMonth(now).getTime(),
        end: endOfMonth(now).getTime(),
      };
    }
    case "this_year": {
      return {
        start: startOfYear(now).getTime(),
        end: endOfYear(now).getTime(),
      };
    }
    case "all_time":
    default:
      return { start: 0, end: Date.now() + 86400000 }; // +1 day buffer
  }
}

function getSourceColor(source: string): string {
  const found = DEFAULT_INCOME_SOURCES.find(
    (s) => s.name.toLowerCase() === source.toLowerCase()
  );
  return found?.color || "#9E9E9E";
}

export function IncomeModal({ isOpen, onClose, onAddNew }: IncomeModalProps) {
  const [view, setView] = useState<"table" | "source" | "trend">("table");
  const [timeRange, setTimeRange] = useState<TimeRange>("this_month");
  const [userFilter, setUserFilter] = useState<UserFilter>("all");

  // Use the simple list query - fetch ALL income
  const allIncomeData = useQuery(api.income.list);
  const users = useQuery(api.users.list);
  const removeIncome = useMutation(api.income.remove);

  // Get date range for filtering
  const { start, end } = getDateRange(timeRange);

  // Filter income by date range (client-side)
  const dateFilteredIncome = useMemo(() => {
    if (!allIncomeData) return [];
    return allIncomeData.filter((i) => i.date >= start && i.date <= end);
  }, [allIncomeData, start, end]);

  // Filter by user
  const income = useMemo(() => {
    if (userFilter === "all") return dateFilteredIncome;

    const targetUser = users?.find(
      (u) => u.name.toLowerCase() === userFilter.toLowerCase()
    );
    if (!targetUser) return dateFilteredIncome;

    return dateFilteredIncome.filter((i) => i.userId === targetUser._id);
  }, [dateFilteredIncome, userFilter, users]);

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

  // Calculate totals by user (for the filtered date range)
  const userTotals = useMemo(() => {
    if (!users) return {};
    const totals: Record<string, number> = {};
    for (const i of dateFilteredIncome) {
      totals[i.userId] = (totals[i.userId] || 0) + i.amount;
    }
    return totals;
  }, [dateFilteredIncome, users]);

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

  const handleDelete = async (id: Id<"income">) => {
    if (!confirm("Delete this income entry?")) return;
    await removeIncome({ id });
  };

  const getUserName = (userId: Id<"users">) => {
    return users?.find((u) => u._id === userId)?.name || "Unknown";
  };

  // Cycle through time ranges
  const cycleTimeRange = () => {
    const ranges: TimeRange[] = ["this_week", "this_month", "this_year", "all_time"];
    const currentIndex = ranges.indexOf(timeRange);
    const nextIndex = (currentIndex + 1) % ranges.length;
    setTimeRange(ranges[nextIndex]);
  };

  // Cycle through user filters
  const cycleUserFilter = () => {
    const filters: UserFilter[] = ["all", "dan", "esther"];
    const currentIndex = filters.indexOf(userFilter);
    const nextIndex = (currentIndex + 1) % filters.length;
    setUserFilter(filters[nextIndex]);
  };

  const getUserFilterLabel = () => {
    switch (userFilter) {
      case "dan": return "Dan";
      case "esther": return "Esther";
      default: return "All";
    }
  };

  const isLoading = allIncomeData === undefined || users === undefined;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Income" size="lg">
      <div className="space-y-4">
        {/* Controls */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex gap-2">
            {/* Time Range Toggle Button */}
            <button
              onClick={cycleTimeRange}
              className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg font-medium hover:bg-blue-200 transition-colors min-w-[120px]"
            >
              {TIME_RANGE_LABELS[timeRange]}
            </button>

            {/* User Filter Toggle Button */}
            <button
              onClick={cycleUserFilter}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors flex items-center gap-2 min-w-[100px]"
            >
              <Users className="w-4 h-4" />
              {getUserFilterLabel()}
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setView("table")}
              className={`p-2 rounded-lg transition-colors ${
                view === "table"
                  ? "bg-blue-100 text-blue-600"
                  : "text-gray-400 hover:bg-gray-100"
              }`}
              title="Table view"
            >
              <Table className="w-5 h-5" />
            </button>
            <button
              onClick={() => setView("source")}
              className={`p-2 rounded-lg transition-colors ${
                view === "source"
                  ? "bg-blue-100 text-blue-600"
                  : "text-gray-400 hover:bg-gray-100"
              }`}
              title="By source"
            >
              <PieChart className="w-5 h-5" />
            </button>
            <button
              onClick={() => setView("trend")}
              className={`p-2 rounded-lg transition-colors ${
                view === "trend"
                  ? "bg-blue-100 text-blue-600"
                  : "text-gray-400 hover:bg-gray-100"
              }`}
              title="Monthly trend"
            >
              <BarChart3 className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Loading State */}
        {isLoading ? (
          <div className="text-center py-8 text-gray-500">Loading...</div>
        ) : (
          <>
            {/* Total and User Breakdown */}
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4">
              <div className="text-center mb-3">
                <div className="text-sm text-gray-500 mb-1">Total Income</div>
                <div className="text-3xl font-bold text-green-600">
                  {formatCurrency(totalAmount)}
                </div>
              </div>
              {users && users.length > 0 && userFilter === "all" && (
                <div className="flex justify-center gap-6 pt-2 border-t border-green-100">
                  {users.map((user) => (
                    <div key={user._id} className="text-center">
                      <div className="text-xs text-gray-500">{user.name}</div>
                      <div className="font-semibold text-green-700">
                        {formatCurrency(userTotals[user._id] || 0)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* View Content */}
            {view === "source" ? (
              <ChartView title="Income by Source">
                <IncomeSourceChart data={chartData} />
              </ChartView>
            ) : view === "trend" ? (
              <ChartView title="Monthly Income Trend">
                <IncomeBarChart
                  income={income.map((i) => ({
                    amount: i.amount,
                    date: i.date,
                    userId: i.userId,
                  }))}
                  users={users?.map((u) => ({ _id: u._id, name: u.name })) || []}
                />
              </ChartView>
            ) : (
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {income.length > 0 ? (
                  income.map((i) => (
                    <div
                      key={i._id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                          <DollarSign className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                          <div className="font-medium capitalize">{i.source}</div>
                          <div className="text-xs text-gray-500">
                            {getUserName(i.userId)} • {formatDate(i.date)}
                            {i.description && ` • ${i.description}`}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-medium text-green-600">
                          +{formatCurrency(i.amount)}
                        </span>
                        <button
                          onClick={() => handleDelete(i._id)}
                          className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-400 text-sm text-center py-8">
                    No income for this period
                  </p>
                )}
              </div>
            )}
          </>
        )}

        {/* Add Button */}
        <Button onClick={onAddNew} className="w-full">
          <Plus className="w-4 h-4 mr-2" />
          Add Income
        </Button>
      </div>
    </Modal>
  );
}
