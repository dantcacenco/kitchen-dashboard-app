"use client";

import { useMemo } from "react";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
} from "date-fns";

interface CalendarEntry {
  date: number;
  amount: number;
  label?: string;
}

interface CalendarViewProps {
  entries: CalendarEntry[];
  month: Date;
  onDateClick?: (date: Date, entries: CalendarEntry[]) => void;
  formatAmount?: (amount: number) => string;
  colorClass?: string;
}

export function CalendarView({
  entries,
  month,
  onDateClick,
  formatAmount = (amount) => `$${(amount / 100).toFixed(0)}`,
  colorClass = "text-green-600 bg-green-50",
}: CalendarViewProps) {
  const monthStart = startOfMonth(month);
  const monthEnd = endOfMonth(month);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);

  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const entriesByDate = useMemo(() => {
    const map: Record<string, CalendarEntry[]> = {};
    for (const entry of entries) {
      const dateKey = format(new Date(entry.date), "yyyy-MM-dd");
      if (!map[dateKey]) map[dateKey] = [];
      map[dateKey].push(entry);
    }
    return map;
  }, [entries]);

  const getDayTotal = (date: Date): number => {
    const dateKey = format(date, "yyyy-MM-dd");
    const dayEntries = entriesByDate[dateKey] || [];
    return dayEntries.reduce((sum, e) => sum + e.amount, 0);
  };

  const getDayEntries = (date: Date): CalendarEntry[] => {
    const dateKey = format(date, "yyyy-MM-dd");
    return entriesByDate[dateKey] || [];
  };

  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div className="space-y-2">
      {/* Month Header */}
      <div className="text-center font-semibold text-gray-900">
        {format(month, "MMMM yyyy")}
      </div>

      {/* Week Day Headers */}
      <div className="grid grid-cols-7 gap-1">
        {weekDays.map((day) => (
          <div
            key={day}
            className="text-center text-xs font-medium text-gray-500 py-2"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1">
        {days.map((day) => {
          const dayTotal = getDayTotal(day);
          const dayEntries = getDayEntries(day);
          const isCurrentMonth = isSameMonth(day, month);
          const isCurrentDay = isToday(day);
          const hasEntries = dayTotal > 0;

          return (
            <div
              key={day.toISOString()}
              className={`
                min-h-[60px] p-1 rounded-lg border transition-colors
                ${isCurrentMonth ? "bg-white" : "bg-gray-50"}
                ${isCurrentDay ? "border-blue-500" : "border-gray-100"}
                ${hasEntries && onDateClick ? "cursor-pointer hover:border-gray-300" : ""}
              `}
              onClick={() => {
                if (hasEntries && onDateClick) {
                  onDateClick(day, dayEntries);
                }
              }}
            >
              <div
                className={`text-xs ${
                  isCurrentMonth ? "text-gray-900" : "text-gray-400"
                } ${isCurrentDay ? "font-bold" : ""}`}
              >
                {format(day, "d")}
              </div>
              {hasEntries && isCurrentMonth && (
                <div
                  className={`text-xs font-medium mt-1 px-1 py-0.5 rounded ${colorClass}`}
                >
                  {formatAmount(dayTotal)}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
