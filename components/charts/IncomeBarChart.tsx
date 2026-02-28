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
import { format, startOfMonth, endOfMonth, eachMonthOfInterval, subMonths } from "date-fns";

interface IncomeEntry {
  amount: number;
  date: number;
  userId: string;
}

interface User {
  _id: string;
  name: string;
}

interface IncomeBarChartProps {
  income: IncomeEntry[];
  users: User[];
  monthsToShow?: number;
}

const COLORS = {
  Dan: "#4CAF50",      // Green
  Esther: "#E91E63",   // Pink
  Total: "#2196F3",    // Blue
};

export function IncomeBarChart({ income, users, monthsToShow = 6 }: IncomeBarChartProps) {
  if (income.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400">
        No income data to display
      </div>
    );
  }

  // Generate months for x-axis
  const now = new Date();
  const months = eachMonthOfInterval({
    start: subMonths(startOfMonth(now), monthsToShow - 1),
    end: endOfMonth(now),
  });

  // Find Dan and Esther user IDs
  const danUser = users.find((u) => u.name.toLowerCase() === "dan");
  const estherUser = users.find((u) => u.name.toLowerCase() === "esther");

  // Group income by month and calculate totals
  const chartData = months.map((month) => {
    const monthStart = startOfMonth(month).getTime();
    const monthEnd = endOfMonth(month).getTime();

    const monthIncome = income.filter(
      (i) => i.date >= monthStart && i.date <= monthEnd
    );

    const danIncome = danUser
      ? monthIncome
          .filter((i) => i.userId === danUser._id)
          .reduce((sum, i) => sum + i.amount, 0) / 100
      : 0;

    const estherIncome = estherUser
      ? monthIncome
          .filter((i) => i.userId === estherUser._id)
          .reduce((sum, i) => sum + i.amount, 0) / 100
      : 0;

    const total = monthIncome.reduce((sum, i) => sum + i.amount, 0) / 100;

    return {
      month: format(month, "MMM"),
      Dan: danIncome,
      Esther: estherIncome,
      Total: total,
    };
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
            tickFormatter={(value) => `$${value.toLocaleString()}`}
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
          <Line
            type="monotone"
            dataKey="Dan"
            stroke={COLORS.Dan}
            strokeWidth={2}
            dot={{ fill: COLORS.Dan, strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6 }}
          />
          <Line
            type="monotone"
            dataKey="Esther"
            stroke={COLORS.Esther}
            strokeWidth={2}
            dot={{ fill: COLORS.Esther, strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6 }}
          />
          <Line
            type="monotone"
            dataKey="Total"
            stroke={COLORS.Total}
            strokeWidth={2}
            dot={{ fill: COLORS.Total, strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
