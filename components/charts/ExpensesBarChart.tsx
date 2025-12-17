"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { formatCurrency, formatCurrencyCompact } from "@/lib/formatters";

interface ExpensesBarChartProps {
  data: {
    category: string;
    amount: number;
    label: string;
    color: string;
  }[];
}

export function ExpensesBarChart({ data }: ExpensesBarChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400">
        No expense data to display
      </div>
    );
  }

  const chartData = data.map((item) => ({
    name: item.label,
    amount: item.amount / 100, // Convert cents to dollars for display
    color: item.color,
  }));

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} layout="vertical" margin={{ left: 20, right: 20 }}>
          <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
          <XAxis
            type="number"
            tickFormatter={(value) => `$${value}`}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            type="category"
            dataKey="name"
            width={80}
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 12 }}
          />
          <Tooltip
            formatter={(value: number) => formatCurrency(value * 100)}
            labelFormatter={(name) => name}
            cursor={{ fill: "rgba(0,0,0,0.05)" }}
          />
          <Bar dataKey="amount" radius={[0, 4, 4, 0]}>
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
