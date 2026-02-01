"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { formatCurrency } from "@/lib/formatters";
import { EXPENSE_CATEGORIES } from "@/lib/constants";
import { format, startOfMonth, endOfMonth, eachMonthOfInterval, subMonths } from "date-fns";

interface ExpenseEntry {
  amount: number;
  date: number;
  category: string;
}

interface ExpensesLineChartProps {
  expenses: ExpenseEntry[];
  monthsToShow?: number;
}

export function ExpensesLineChart({ expenses, monthsToShow = 6 }: ExpensesLineChartProps) {
  if (expenses.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400">
        No expense data to display
      </div>
    );
  }

  // Generate months for x-axis
  const now = new Date();
  const months = eachMonthOfInterval({
    start: subMonths(startOfMonth(now), monthsToShow - 1),
    end: endOfMonth(now),
  });

  // Get all unique categories from expenses
  const categories = Array.from(new Set(expenses.map((e) => e.category)));

  // Group expenses by month and category
  const chartData = months.map((month) => {
    const monthStart = startOfMonth(month).getTime();
    const monthEnd = endOfMonth(month).getTime();

    const monthExpenses = expenses.filter(
      (e) => e.date >= monthStart && e.date <= monthEnd
    );

    // Calculate total for each category
    const dataPoint: Record<string, number | string> = {
      month: format(month, "MMM"),
    };

    categories.forEach((category) => {
      const categoryTotal = monthExpenses
        .filter((e) => e.category === category)
        .reduce((sum, e) => sum + e.amount, 0) / 100;

      dataPoint[category] = categoryTotal;
    });

    return dataPoint;
  });

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="month"
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 12 }}
          />
          <YAxis
            tickFormatter={(value) => `$${value}`}
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 12 }}
          />
          <Tooltip
            formatter={(value: number) => formatCurrency(value * 100)}
            contentStyle={{
              backgroundColor: "white",
              border: "1px solid #e5e7eb",
              borderRadius: "8px",
              boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
            }}
          />
          <Legend />
          {categories.map((category) => {
            const categoryInfo = EXPENSE_CATEGORIES[category as keyof typeof EXPENSE_CATEGORIES];
            const color = categoryInfo?.color || "#9E9E9E";
            const label = categoryInfo?.label || category;

            return (
              <Line
                key={category}
                type="monotone"
                dataKey={category}
                name={label}
                stroke={color}
                strokeWidth={2}
                dot={{ fill: color, strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6 }}
                connectNulls
              />
            );
          })}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
