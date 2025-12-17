"use client";

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";
import { formatCurrency } from "@/lib/formatters";
import { DEFAULT_INCOME_SOURCES } from "@/lib/constants";

interface IncomeSourceChartProps {
  data: {
    source: string;
    amount: number;
    color: string;
    percent: number;
  }[];
}

function getSourceColor(source: string): string {
  const found = DEFAULT_INCOME_SOURCES.find(
    (s) => s.name.toLowerCase() === source.toLowerCase()
  );
  return found?.color || "#9E9E9E";
}

export function IncomeSourceChart({ data }: IncomeSourceChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400">
        No income data to display
      </div>
    );
  }

  const chartData = data.map((item) => ({
    name: item.source,
    value: item.amount,
    color: item.color || getSourceColor(item.source),
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
            formatter={(value) => (
              <span className="text-sm text-gray-600 capitalize">{value}</span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
