"use client";

import { useState, useMemo } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Modal, Button, Select } from "@/components/ui";
import { formatCurrency, formatDate } from "@/lib/formatters";
import { TIME_RANGES, DEFAULT_INCOME_SOURCES } from "@/lib/constants";
import {
  Plus,
  Table,
  BarChart3,
  Calendar,
  Trash2,
  User,
  DollarSign,
} from "lucide-react";

interface IncomeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddNew: () => void;
}

function getDateRange(range: string): { start: number; end: number } {
  const now = new Date();
  const end = now.getTime();

  switch (range) {
    case "this_month": {
      const start = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
      return { start, end };
    }
    case "this_year": {
      const start = new Date(now.getFullYear(), 0, 1).getTime();
      return { start, end };
    }
    case "last_year": {
      const start = new Date(now.getFullYear() - 1, 0, 1).getTime();
      const yearEnd = new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59).getTime();
      return { start, end: yearEnd };
    }
    default:
      return { start: 0, end };
  }
}

function getSourceColor(source: string): string {
  const found = DEFAULT_INCOME_SOURCES.find(
    (s) => s.name.toLowerCase() === source.toLowerCase()
  );
  return found?.color || "#9E9E9E";
}

export function IncomeModal({ isOpen, onClose, onAddNew }: IncomeModalProps) {
  const [view, setView] = useState<"table" | "chart" | "calendar">("table");
  const [timeRange, setTimeRange] = useState("this_month");
  const [userFilter, setUserFilter] = useState<string>("all");

  const { start, end } = getDateRange(timeRange);

  const users = useQuery(api.users.list);
  const allIncome = useQuery(api.income.listByDateRange, { start, end });
  const incomeSources = useQuery(api.incomeSources.list);
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

  // Group income by date for calendar view
  const incomeByDate = useMemo(() => {
    const grouped: Record<string, typeof income> = {};
    for (const i of income) {
      const dateKey = formatDate(i.date, "yyyy-MM-dd");
      if (!grouped[dateKey]) grouped[dateKey] = [];
      grouped[dateKey].push(i);
    }
    return grouped;
  }, [income]);

  const handleDelete = async (id: Id<"income">) => {
    if (!confirm("Delete this income entry?")) return;
    await removeIncome({ id });
  };

  const userOptions = [
    { value: "all", label: "All Users" },
    ...(users || []).map((u) => ({ value: u._id, label: u.name })),
  ];

  const getUserName = (userId: Id<"users">) => {
    return users?.find((u) => u._id === userId)?.name || "Unknown";
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Income" size="lg">
      <div className="space-y-4">
        {/* Controls */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex gap-2">
            <Select
              options={Object.entries(TIME_RANGES).map(([value, label]) => ({
                value,
                label,
              }))}
              value={timeRange}
              onChange={setTimeRange}
            />
            <Select
              options={userOptions}
              value={userFilter}
              onChange={setUserFilter}
            />
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setView("table")}
              className={`p-2 rounded-lg transition-colors ${
                view === "table"
                  ? "bg-blue-100 text-blue-600"
                  : "text-gray-400 hover:bg-gray-100"
              }`}
            >
              <Table className="w-5 h-5" />
            </button>
            <button
              onClick={() => setView("chart")}
              className={`p-2 rounded-lg transition-colors ${
                view === "chart"
                  ? "bg-blue-100 text-blue-600"
                  : "text-gray-400 hover:bg-gray-100"
              }`}
            >
              <BarChart3 className="w-5 h-5" />
            </button>
            <button
              onClick={() => setView("calendar")}
              className={`p-2 rounded-lg transition-colors ${
                view === "calendar"
                  ? "bg-blue-100 text-blue-600"
                  : "text-gray-400 hover:bg-gray-100"
              }`}
            >
              <Calendar className="w-5 h-5" />
            </button>
          </div>
        </div>

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
        {view === "chart" ? (
          <div className="space-y-3">
            {chartData.length > 0 ? (
              chartData.map((item) => (
                <div key={item.source} className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: `${item.color}20` }}
                  >
                    <DollarSign
                      className="w-5 h-5"
                      style={{ color: item.color }}
                    />
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium capitalize">
                        {item.source}
                      </span>
                      <span className="text-sm text-gray-600">
                        {formatCurrency(item.amount)} ({item.percent.toFixed(1)}
                        %)
                      </span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${item.percent}%`,
                          backgroundColor: item.color,
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-400 text-sm text-center py-8">
                No income for this period
              </p>
            )}
          </div>
        ) : view === "calendar" ? (
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {Object.entries(incomeByDate)
              .sort(([a], [b]) => b.localeCompare(a))
              .map(([date, entries]) => {
                const dayTotal = entries.reduce((sum, e) => sum + e.amount, 0);
                return (
                  <div key={date} className="bg-gray-50 rounded-xl p-3">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium">
                        {formatDate(new Date(date).getTime(), "EEEE, MMM d")}
                      </span>
                      <span className="text-green-600 font-semibold">
                        {formatCurrency(dayTotal)}
                      </span>
                    </div>
                    <div className="space-y-2">
                      {entries.map((entry) => (
                        <div
                          key={entry._id}
                          className="flex items-center justify-between text-sm bg-white rounded-lg px-3 py-2"
                        >
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-gray-400" />
                            <span>{getUserName(entry.userId)}</span>
                            <span className="text-gray-400">•</span>
                            <span className="capitalize">{entry.source}</span>
                          </div>
                          <span className="font-medium text-green-600">
                            +{formatCurrency(entry.amount)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            {Object.keys(incomeByDate).length === 0 && (
              <p className="text-gray-400 text-sm text-center py-8">
                No income for this period
              </p>
            )}
          </div>
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

        {/* Add Button */}
        <Button onClick={onAddNew} className="w-full">
          <Plus className="w-4 h-4 mr-2" />
          Add Income
        </Button>
      </div>
    </Modal>
  );
}
