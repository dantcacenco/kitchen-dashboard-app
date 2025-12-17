"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { formatCurrency } from "@/lib/formatters";
import { format } from "date-fns";

interface HistoryEntry {
  _id: string;
  amount: number;
  date: number;
  note?: string;
}

interface GoalProgressChartProps {
  history: HistoryEntry[];
  targetAmount: number;
  currentAmount: number;
  color: string;
}

export function GoalProgressChart({
  history,
  targetAmount,
  currentAmount,
  color,
}: GoalProgressChartProps) {
  if (history.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-gray-400">
        No history data to display
      </div>
    );
  }

  // Sort history by date and calculate running total
  const sortedHistory = [...history].sort((a, b) => a.date - b.date);

  let runningTotal = 0;
  const chartData = sortedHistory.map((entry) => {
    runningTotal += entry.amount;
    return {
      date: format(new Date(entry.date), "MMM d"),
      timestamp: entry.date,
      balance: runningTotal / 100, // Convert cents to dollars
      change: entry.amount / 100,
      note: entry.note,
    };
  });

  // Add starting point if needed
  if (chartData.length > 0) {
    chartData.unshift({
      date: "Start",
      timestamp: chartData[0].timestamp - 1,
      balance: 0,
      change: 0,
      note: "Starting balance",
    });
  }

  const targetDollars = targetAmount / 100;

  return (
    <div className="h-48">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id={`goalGradient-${color}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.3} />
              <stop offset="95%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="date"
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 10 }}
          />
          <YAxis
            tickFormatter={(value) => `$${value}`}
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 10 }}
            domain={[0, Math.max(targetDollars * 1.1, currentAmount / 100 * 1.1)]}
          />
          <Tooltip
            formatter={(value: number, name: string) => {
              if (name === "balance") return [formatCurrency(value * 100), "Balance"];
              return [value, name];
            }}
            labelFormatter={(label) => label}
          />
          <ReferenceLine
            y={targetDollars}
            stroke={color}
            strokeDasharray="5 5"
            label={{
              value: `Goal: ${formatCurrency(targetAmount)}`,
              position: "right",
              fontSize: 10,
              fill: color,
            }}
          />
          <Area
            type="monotone"
            dataKey="balance"
            stroke={color}
            strokeWidth={2}
            fill={`url(#goalGradient-${color})`}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
