"use client";

import { useState, useCallback, useEffect } from "react";
import GridLayout, { Layout } from "react-grid-layout";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { DEFAULT_LAYOUT, GRID_CONFIG, MOBILE_LAYOUT, MOBILE_GRID_CONFIG } from "@/lib/constants";
import { WeatherWidget } from "@/components/widgets/WeatherWidget";
import { ShoppingWidget } from "@/components/widgets/ShoppingWidget";
import { ExpensesWidget } from "@/components/widgets/ExpensesWidget";
import { IncomeWidget } from "@/components/widgets/IncomeWidget";
import { SavingsWidget } from "@/components/widgets/SavingsWidget";
import { QuickStatsWidget } from "@/components/widgets/QuickStatsWidget";
import {
  AddExpenseModal,
  AddIncomeModal,
  AddGoalModal,
  GoalModal,
  MetalsModal,
  ExpensesModal,
  IncomeModal,
  WeatherModal,
} from "@/components/modals";
import { Weather } from "@/types";

import "react-grid-layout/css/styles.css";

interface DashboardProps {
  isEditing?: boolean;
}

export function Dashboard({ isEditing = false }: DashboardProps) {
  const [containerWidth, setContainerWidth] = useState(1200);
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile breakpoint
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Modal states
  const [showAddExpenseModal, setShowAddExpenseModal] = useState(false);
  const [showExpensesModal, setShowExpensesModal] = useState(false);
  const [expenseCategory, setExpenseCategory] = useState<string | undefined>();
  const [selectedExpenseTimeRange, setSelectedExpenseTimeRange] = useState<"this_month" | "this_year">("this_month");
  const [showAddIncomeModal, setShowAddIncomeModal] = useState(false);
  const [showIncomeModal, setShowIncomeModal] = useState(false);
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [selectedGoalId, setSelectedGoalId] = useState<Id<"savingsGoals"> | null>(null);
  const [showMetalsModal, setShowMetalsModal] = useState(false);
  const [showWeatherModal, setShowWeatherModal] = useState(false);
  const [selectedWeather, setSelectedWeather] = useState<Weather | null>(null);
  const [showAddGoalModal, setShowAddGoalModal] = useState(false);

  // Fetch saved layout from Convex
  const savedLayout = useQuery(api.dashboardLayout.get);
  const saveLayout = useMutation(api.dashboardLayout.save);

  // Parse saved layout or use default/mobile layout
  const currentLayout: Layout[] = isMobile
    ? MOBILE_LAYOUT
    : (savedLayout?.layouts ? JSON.parse(savedLayout.layouts) : DEFAULT_LAYOUT);

  // Use mobile or desktop grid config
  const gridConfig = isMobile ? MOBILE_GRID_CONFIG : GRID_CONFIG;

  // Handle layout changes (disabled on mobile)
  const handleLayoutChange = useCallback(
    (newLayout: Layout[]) => {
      if (isEditing && !isMobile) {
        saveLayout({ layouts: JSON.stringify(newLayout) });
      }
    },
    [isEditing, isMobile, saveLayout]
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
  const handleWeatherClick = (weather: Weather) => {
    setSelectedWeather(weather);
    setShowWeatherModal(true);
  };
  const handleAddGoalClick = () => setShowAddGoalModal(true);

  // Widget components map
  const widgets: Record<string, React.ReactNode> = {
    weather: <WeatherWidget onClick={handleWeatherClick} />,
    income: <IncomeWidget onClick={handleIncomeClick} />,
    quickStats: <QuickStatsWidget />,
    shopping: <ShoppingWidget />,
    savings: (
      <SavingsWidget
        onGoalClick={handleGoalClick}
        onMetalsClick={handleMetalsClick}
        onAddGoal={handleAddGoalClick}
      />
    ),
    expenses: (
      <ExpensesWidget
        onClick={handleExpenseClick}
        onCategoryClick={handleCategoryClick}
        onTimeRangeClick={(range) => setSelectedExpenseTimeRange(range === "month" ? "this_month" : "this_year")}
      />
    ),
  };

  return (
    <>
      <div ref={containerRef} className="w-full">
        <GridLayout
          className="layout"
          layout={currentLayout}
          cols={gridConfig.cols}
          rowHeight={gridConfig.rowHeight}
          width={containerWidth}
          margin={gridConfig.margin}
          containerPadding={gridConfig.containerPadding}
          isDraggable={isEditing && !isMobile}
          isResizable={isEditing && !isMobile}
          onLayoutChange={handleLayoutChange}
          draggableHandle=".widget-drag-handle"
          useCSSTransforms={true}
        >
          {currentLayout.map((item) => (
            <div
              key={item.i}
              className={`${isEditing && !isMobile ? "ring-2 ring-blue-400 ring-opacity-50" : ""}`}
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
        initialTimeRange={selectedExpenseTimeRange}
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

      <WeatherModal
        isOpen={showWeatherModal}
        onClose={() => {
          setShowWeatherModal(false);
          setSelectedWeather(null);
        }}
        weather={selectedWeather}
      />

      <AddGoalModal
        isOpen={showAddGoalModal}
        onClose={() => setShowAddGoalModal(false)}
      />
    </>
  );
}
