"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { formatCurrency } from "@/lib/formatters";

interface ExpensesPieChartProps {
  data: {
    category: string;
    amount: number;
    label: string;
    color: string;
    percent: number;
  }[];
}

export function ExpensesPieChart({ data }: ExpensesPieChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400">
        No expense data to display
      </div>
    );
  }

  const chartData = data.map((item) => ({
    name: item.label,
    value: item.amount,
    color: item.color,
    percent: item.percent,
  }));

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={80}
            paddingAngle={2}
            dataKey="value"
            label={({ name, percent }) => `${name} (${percent.toFixed(0)}%)`}
            labelLine={false}
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value: number) => formatCurrency(value)}
            labelFormatter={(name) => name}
          />
          <Legend
            formatter={(value) => <span className="text-sm text-gray-600">{value}</span>}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
