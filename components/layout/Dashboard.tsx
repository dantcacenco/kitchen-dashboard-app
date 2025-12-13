"use client";

import { useState, useCallback } from "react";
import GridLayout, { Layout } from "react-grid-layout";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { DEFAULT_LAYOUT, GRID_CONFIG } from "@/lib/constants";
import { WeatherWidget } from "@/components/widgets/WeatherWidget";
import { ShoppingWidget } from "@/components/widgets/ShoppingWidget";
import { ExpensesWidget } from "@/components/widgets/ExpensesWidget";
import { IncomeWidget } from "@/components/widgets/IncomeWidget";
import { SavingsWidget } from "@/components/widgets/SavingsWidget";
import { QuickStatsWidget } from "@/components/widgets/QuickStatsWidget";
import {
  AddExpenseModal,
  AddIncomeModal,
  GoalModal,
  MetalsModal,
  ExpensesModal,
  IncomeModal,
} from "@/components/modals";

import "react-grid-layout/css/styles.css";

interface DashboardProps {
  isEditing?: boolean;
}

export function Dashboard({ isEditing = false }: DashboardProps) {
  const [containerWidth, setContainerWidth] = useState(1200);

  // Modal states
  const [showAddExpenseModal, setShowAddExpenseModal] = useState(false);
  const [showExpensesModal, setShowExpensesModal] = useState(false);
  const [expenseCategory, setExpenseCategory] = useState<string | undefined>();
  const [showAddIncomeModal, setShowAddIncomeModal] = useState(false);
  const [showIncomeModal, setShowIncomeModal] = useState(false);
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [selectedGoalId, setSelectedGoalId] = useState<Id<"savingsGoals"> | null>(null);
  const [showMetalsModal, setShowMetalsModal] = useState(false);

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

  // Modal handlers
  const handleExpenseClick = () => setShowExpensesModal(true);
  const handleCategoryClick = (category: string) => {
    setExpenseCategory(category);
    setShowAddExpenseModal(true);
  };
  const handleIncomeClick = () => setShowIncomeModal(true);
  const handleGoalClick = (goalId: Id<"savingsGoals">) => {
    setSelectedGoalId(goalId);
    setShowGoalModal(true);
  };
  const handleMetalsClick = () => setShowMetalsModal(true);

  // Widget components map
  const widgets: Record<string, React.ReactNode> = {
    weather: <WeatherWidget />,
    income: <IncomeWidget onClick={handleIncomeClick} />,
    quickStats: <QuickStatsWidget />,
    shopping: <ShoppingWidget />,
    savings: (
      <SavingsWidget
        onGoalClick={handleGoalClick}
        onMetalsClick={handleMetalsClick}
      />
    ),
    expenses: (
      <ExpensesWidget
        onClick={handleExpenseClick}
        onCategoryClick={handleCategoryClick}
      />
    ),
  };

  return (
    <>
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

      {/* Modals */}
      <AddExpenseModal
        isOpen={showAddExpenseModal}
        onClose={() => {
          setShowAddExpenseModal(false);
          setExpenseCategory(undefined);
        }}
        initialCategory={expenseCategory}
      />

      <ExpensesModal
        isOpen={showExpensesModal}
        onClose={() => setShowExpensesModal(false)}
        onAddNew={() => {
          setShowExpensesModal(false);
          setShowAddExpenseModal(true);
        }}
      />

      <AddIncomeModal
        isOpen={showAddIncomeModal}
        onClose={() => setShowAddIncomeModal(false)}
      />

      <IncomeModal
        isOpen={showIncomeModal}
        onClose={() => setShowIncomeModal(false)}
        onAddNew={() => {
          setShowIncomeModal(false);
          setShowAddIncomeModal(true);
        }}
      />

      <GoalModal
        isOpen={showGoalModal}
        onClose={() => {
          setShowGoalModal(false);
          setSelectedGoalId(null);
        }}
        goalId={selectedGoalId}
      />

      <MetalsModal
        isOpen={showMetalsModal}
        onClose={() => setShowMetalsModal(false)}
      />
    </>
  );
}
