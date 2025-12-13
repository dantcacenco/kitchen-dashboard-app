"use client";

import { useState, useCallback } from "react";
import GridLayout, { Layout } from "react-grid-layout";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { DEFAULT_LAYOUT, GRID_CONFIG } from "@/lib/constants";
import { WeatherWidget } from "@/components/widgets/WeatherWidget";
import { ShoppingWidget } from "@/components/widgets/ShoppingWidget";
import { ExpensesWidget } from "@/components/widgets/ExpensesWidget";
import { IncomeWidget } from "@/components/widgets/IncomeWidget";
import { SavingsWidget } from "@/components/widgets/SavingsWidget";
import { QuickStatsWidget } from "@/components/widgets/QuickStatsWidget";

import "react-grid-layout/css/styles.css";

interface DashboardProps {
  isEditing?: boolean;
}

export function Dashboard({ isEditing = false }: DashboardProps) {
  const [containerWidth, setContainerWidth] = useState(1200);

  // Fetch saved layout from Convex
  const savedLayout = useQuery(api.dashboardLayout.get);
  const saveLayout = useMutation(api.dashboardLayout.save);

  // Parse saved layout or use default
  const currentLayout: Layout[] = savedLayout?.layouts
    ? JSON.parse(savedLayout.layouts)
    : DEFAULT_LAYOUT;

  // Handle layout changes
  const handleLayoutChange = useCallback(
    (newLayout: Layout[]) => {
      if (isEditing) {
        saveLayout({ layouts: JSON.stringify(newLayout) });
      }
    },
    [isEditing, saveLayout]
  );

  // Measure container width on mount
  const containerRef = useCallback((node: HTMLDivElement | null) => {
    if (node) {
      const resizeObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
          setContainerWidth(entry.contentRect.width);
        }
      });
      resizeObserver.observe(node);
      return () => resizeObserver.disconnect();
    }
  }, []);

  // Widget components map
  const widgets: Record<string, React.ReactNode> = {
    weather: <WeatherWidget />,
    income: <IncomeWidget />,
    quickStats: <QuickStatsWidget />,
    shopping: <ShoppingWidget />,
    savings: <SavingsWidget />,
    expenses: <ExpensesWidget />,
  };

  return (
    <div ref={containerRef} className="w-full">
      <GridLayout
        className="layout"
        layout={currentLayout}
        cols={GRID_CONFIG.cols}
        rowHeight={GRID_CONFIG.rowHeight}
        width={containerWidth}
        margin={GRID_CONFIG.margin}
        containerPadding={GRID_CONFIG.containerPadding}
        isDraggable={isEditing}
        isResizable={isEditing}
        onLayoutChange={handleLayoutChange}
        draggableHandle=".widget-drag-handle"
        useCSSTransforms={true}
      >
        {currentLayout.map((item) => (
          <div
            key={item.i}
            className={`${isEditing ? "ring-2 ring-blue-400 ring-opacity-50" : ""}`}
          >
            {widgets[item.i] || (
              <div className="bg-gray-100 rounded-xl h-full flex items-center justify-center">
                <span className="text-gray-400">Widget: {item.i}</span>
              </div>
            )}
          </div>
        ))}
      </GridLayout>
    </div>
  );
}
