"use client";

import { useState, useMemo } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Modal, Button, Select } from "@/components/ui";
import { formatCurrency, formatDate } from "@/lib/formatters";
import { EXPENSE_CATEGORIES, TIME_RANGES } from "@/lib/constants";
import { ExpensesPieChart, ExpensesLineChart } from "@/components/charts";
import { ChartView } from "@/components/views";
import {
  Plus,
  Table,
  PieChart,
  BarChart3,
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
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
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

type SortField = "price" | "category" | "date" | "description";
type SortOrder = "asc" | "desc";

export function ExpensesModal({
  isOpen,
  onClose,
  onAddNew,
}: ExpensesModalProps) {
  const [view, setView] = useState<"table" | "pie" | "trend">("table");
  const [timeRange, setTimeRange] = useState("this_month");
  const [sortField, setSortField] = useState<SortField>("date");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");

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

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("desc");
    }
  };

  const sortedTransactions = useMemo(() => {
    if (!transactions) return [];
    const sorted = [...transactions];
    sorted.sort((a, b) => {
      let aVal, bVal;
      switch (sortField) {
        case "price":
          aVal = a.amount;
          bVal = b.amount;
          break;
        case "category":
          aVal = a.category;
          bVal = b.category;
          break;
        case "date":
          aVal = a.date;
          bVal = b.date;
          break;
        case "description":
          aVal = a.description.toLowerCase();
          bVal = b.description.toLowerCase();
          break;
        default:
          return 0;
      }
      if (aVal < bVal) return sortOrder === "asc" ? -1 : 1;
      if (aVal > bVal) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });
    return sorted;
  }, [transactions, sortField, sortOrder]);

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
              title="Table view"
            >
              <Table className="w-5 h-5" />
            </button>
            <button
              onClick={() => setView("pie")}
              className={`p-2 rounded-lg transition-colors ${
                view === "pie"
                  ? "bg-blue-100 text-blue-600"
                  : "text-gray-400 hover:bg-gray-100"
              }`}
              title="Pie chart"
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

        {/* Total */}
        <div className="bg-gray-50 rounded-xl p-4 text-center">
          <div className="text-sm text-gray-500 mb-1">Total Expenses</div>
          <div className="text-3xl font-bold text-gray-900">
            {formatCurrency(totalAmount)}
          </div>
        </div>

        {/* View Content */}
        {view === "pie" ? (
          <ChartView title="Spending by Category">
            <ExpensesPieChart data={chartData} />
          </ChartView>
        ) : view === "trend" ? (
          <ChartView title="Monthly Expense Trend">
            <ExpensesLineChart
              expenses={transactions?.map((t) => ({
                amount: t.amount,
                date: t.date,
                category: t.category,
              })) || []}
            />
          </ChartView>
        ) : (
          <div className="space-y-2">
            {/* Table Header */}
            {sortedTransactions.length > 0 && (
              <div className="grid grid-cols-12 gap-2 px-3 py-2 bg-gray-100 rounded-lg text-sm font-medium text-gray-600">
                <button
                  onClick={() => handleSort("description")}
                  className="col-span-4 flex items-center gap-1 hover:text-gray-900 transition-colors text-left"
                >
                  Description
                  {sortField === "description" ? (
                    sortOrder === "asc" ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                  ) : (
                    <ArrowUpDown className="w-3 h-3 opacity-40" />
                  )}
                </button>
                <button
                  onClick={() => handleSort("category")}
                  className="col-span-2 flex items-center gap-1 hover:text-gray-900 transition-colors text-left"
                >
                  Category
                  {sortField === "category" ? (
                    sortOrder === "asc" ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                  ) : (
                    <ArrowUpDown className="w-3 h-3 opacity-40" />
                  )}
                </button>
                <button
                  onClick={() => handleSort("date")}
                  className="col-span-3 flex items-center gap-1 hover:text-gray-900 transition-colors text-left"
                >
                  Date
                  {sortField === "date" ? (
                    sortOrder === "asc" ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                  ) : (
                    <ArrowUpDown className="w-3 h-3 opacity-40" />
                  )}
                </button>
                <button
                  onClick={() => handleSort("price")}
                  className="col-span-2 flex items-center gap-1 hover:text-gray-900 transition-colors text-left"
                >
                  Price
                  {sortField === "price" ? (
                    sortOrder === "asc" ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                  ) : (
                    <ArrowUpDown className="w-3 h-3 opacity-40" />
                  )}
                </button>
                <div className="col-span-1"></div>
              </div>
            )}

            {/* Table Rows */}
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {sortedTransactions.length > 0 ? (
                sortedTransactions.map((t) => {
                  const category = EXPENSE_CATEGORIES[t.category as keyof typeof EXPENSE_CATEGORIES];
                  const Icon = iconMap[category?.icon] || MoreHorizontal;
                  return (
                    <div
                      key={t._id}
                      className="grid grid-cols-12 gap-2 items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div className="col-span-4 flex items-center gap-2">
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                          style={{ backgroundColor: `${category?.color}20` }}
                        >
                          <Icon
                            className="w-4 h-4"
                            style={{ color: category?.color }}
                          />
                        </div>
                        <div className="font-medium truncate">{t.description}</div>
                      </div>
                      <div className="col-span-2 text-sm text-gray-600">
                        {category?.label || t.category}
                      </div>
                      <div className="col-span-3 text-sm text-gray-600">
                        {formatDate(t.date)}
                      </div>
                      <div className="col-span-2 font-medium text-red-600">
                        -{formatCurrency(t.amount)}
                      </div>
                      <div className="col-span-1 flex justify-end">
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
