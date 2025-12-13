"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  ShoppingCart,
  Fuel,
  Home,
  Utensils,
  Plane,
  Shirt,
} from "lucide-react";
import { Card, Badge } from "@/components/ui";
import { formatCurrency } from "@/lib/formatters";
import { EXPENSE_CATEGORIES } from "@/lib/constants";
import { getCurrentMonthRange, sum } from "@/lib/utils";

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  groceries: <ShoppingCart className="w-5 h-5" />,
  gas: <Fuel className="w-5 h-5" />,
  housing: <Home className="w-5 h-5" />,
  dining: <Utensils className="w-5 h-5" />,
  travel: <Plane className="w-5 h-5" />,
  clothing: <Shirt className="w-5 h-5" />,
};

interface ExpensesWidgetProps {
  onClick?: () => void;
  onCategoryClick?: (category: string) => void;
}

export function ExpensesWidget({ onClick, onCategoryClick }: ExpensesWidgetProps) {
  const { start, end } = getCurrentMonthRange();
  const transactions = useQuery(api.transactions.listByDateRange, { start, end });

  // Calculate totals by category
  const categoryTotals = transactions?.reduce((acc, t) => {
    acc[t.category] = (acc[t.category] || 0) + t.amount;
    return acc;
  }, {} as Record<string, number>) || {};

  const total = sum(Object.values(categoryTotals));

  // Top 6 categories to display
  const displayCategories = ["groceries", "gas", "housing", "dining", "travel", "clothing"];

  return (
    <Card
      variant="gradient"
      gradient="linear-gradient(135deg, #f093fb 0%, #f5576c 100%)"
      className="h-full text-white cursor-pointer"
      onClick={onClick}
    >
      <div className="widget-drag-handle h-full flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-lg">EXPENSES</h3>
          <Badge className="bg-white/20 text-white border-0">This Month</Badge>
        </div>

        {/* Total */}
        <div className="text-3xl font-bold mb-4">{formatCurrency(total)}</div>

        {/* Category grid */}
        <div className="grid grid-cols-3 gap-3 flex-1">
          {displayCategories.map((cat) => (
            <button
              key={cat}
              className="bg-white/10 hover:bg-white/20 rounded-lg p-3 text-center transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                onCategoryClick?.(cat);
              }}
            >
              <div className="flex justify-center mb-1">
                {CATEGORY_ICONS[cat]}
              </div>
              <div className="text-xs opacity-80 truncate">
                {EXPENSE_CATEGORIES[cat as keyof typeof EXPENSE_CATEGORIES]?.label || cat}
              </div>
              <div className="text-sm font-semibold">
                {formatCurrency(categoryTotals[cat] || 0)}
              </div>
            </button>
          ))}
        </div>
      </div>
    </Card>
  );
}
