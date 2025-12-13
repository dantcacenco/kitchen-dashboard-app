"use client";

import { useState, useMemo } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Modal, Button, Select } from "@/components/ui";
import { formatCurrency, formatDate } from "@/lib/formatters";
import { EXPENSE_CATEGORIES, TIME_RANGES } from "@/lib/constants";
import {
  Plus,
  Table,
  PieChart,
  Trash2,
  ShoppingCart,
  Fuel,
  Home,
  Utensils,
  Plane,
  Shirt,
  Heart,
  Zap,
  MoreHorizontal,
} from "lucide-react";

const iconMap: Record<string, React.ElementType> = {
  ShoppingCart,
  Fuel,
  Home,
  Utensils,
  Plane,
  Shirt,
  Heart,
  Zap,
  MoreHorizontal,
};

interface ExpensesModalProps {
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

export function ExpensesModal({
  isOpen,
  onClose,
  onAddNew,
}: ExpensesModalProps) {
  const [view, setView] = useState<"table" | "chart">("table");
  const [timeRange, setTimeRange] = useState("this_month");

  const { start, end } = getDateRange(timeRange);

  const transactions = useQuery(api.transactions.listByDateRange, { start, end });
  const removeTransaction = useMutation(api.transactions.remove);

  const categoryTotals = useMemo(() => {
    if (!transactions) return {};
    const totals: Record<string, number> = {};
    for (const t of transactions) {
      totals[t.category] = (totals[t.category] || 0) + t.amount;
    }
    return totals;
  }, [transactions]);

  const totalAmount = useMemo(() => {
    return Object.values(categoryTotals).reduce((sum, v) => sum + v, 0);
  }, [categoryTotals]);

  const chartData = useMemo(() => {
    return Object.entries(categoryTotals)
      .map(([category, amount]) => ({
        category,
        amount,
        label: EXPENSE_CATEGORIES[category as keyof typeof EXPENSE_CATEGORIES]?.label || category,
        color: EXPENSE_CATEGORIES[category as keyof typeof EXPENSE_CATEGORIES]?.color || "#9E9E9E",
        percent: totalAmount > 0 ? (amount / totalAmount) * 100 : 0,
      }))
      .sort((a, b) => b.amount - a.amount);
  }, [categoryTotals, totalAmount]);

  const handleDelete = async (id: Id<"transactions">) => {
    if (!confirm("Delete this expense?")) return;
    await removeTransaction({ id });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Expenses" size="lg">
      <div className="space-y-4">
        {/* Controls */}
        <div className="flex items-center justify-between gap-4">
          <Select
            options={Object.entries(TIME_RANGES).map(([value, label]) => ({
              value,
              label,
            }))}
            value={timeRange}
            onChange={setTimeRange}
          />
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
              <PieChart className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Total */}
        <div className="bg-gray-50 rounded-xl p-4 text-center">
          <div className="text-sm text-gray-500 mb-1">Total Expenses</div>
          <div className="text-3xl font-bold text-gray-900">
            {formatCurrency(totalAmount)}
          </div>
        </div>

        {/* View Content */}
        {view === "chart" ? (
          <div className="space-y-4">
            {/* Simple bar chart */}
            <div className="space-y-3">
              {chartData.map((item) => {
                const Icon = iconMap[
                  EXPENSE_CATEGORIES[item.category as keyof typeof EXPENSE_CATEGORIES]?.icon
                ] || MoreHorizontal;
                return (
                  <div key={item.category} className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: `${item.color}20` }}
                    >
                      <Icon className="w-5 h-5" style={{ color: item.color }} />
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium">{item.label}</span>
                        <span className="text-sm text-gray-600">
                          {formatCurrency(item.amount)} ({item.percent.toFixed(1)}%)
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
                );
              })}
            </div>
          </div>
        ) : (
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {transactions && transactions.length > 0 ? (
              transactions.map((t) => {
                const category = EXPENSE_CATEGORIES[t.category as keyof typeof EXPENSE_CATEGORIES];
                const Icon = iconMap[category?.icon] || MoreHorizontal;
                return (
                  <div
                    key={t._id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: `${category?.color}20` }}
                      >
                        <Icon
                          className="w-5 h-5"
                          style={{ color: category?.color }}
                        />
                      </div>
                      <div>
                        <div className="font-medium">{t.description}</div>
                        <div className="text-xs text-gray-500">
                          {category?.label || t.category} • {formatDate(t.date)}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-medium text-red-600">
                        -{formatCurrency(t.amount)}
                      </span>
                      <button
                        onClick={() => handleDelete(t._id)}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-gray-400 text-sm text-center py-8">
                No expenses for this period
              </p>
            )}
          </div>
        )}

        {/* Add Button */}
        <Button onClick={onAddNew} className="w-full">
          <Plus className="w-4 h-4 mr-2" />
          Add Expense
        </Button>
      </div>
    </Modal>
  );
}
