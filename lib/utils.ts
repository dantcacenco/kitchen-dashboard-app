import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merge Tailwind CSS classes with clsx
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/**
 * Get start and end of current month in milliseconds
 */
export function getCurrentMonthRange(): { start: number; end: number } {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999).getTime();
  return { start, end };
}

/**
 * Get start and end of current year in milliseconds
 */
export function getCurrentYearRange(): { start: number; end: number } {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 1).getTime();
  const end = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999).getTime();
  return { start, end };
}

/**
 * Get start and end of last year in milliseconds
 */
export function getLastYearRange(): { start: number; end: number } {
  const now = new Date();
  const start = new Date(now.getFullYear() - 1, 0, 1).getTime();
  const end = new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59, 999).getTime();
  return { start, end };
}

/**
 * Get start and end of last month in milliseconds
 */
export function getLastMonthRange(): { start: number; end: number } {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() - 1, 1).getTime();
  const end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999).getTime();
  return { start, end };
}

/**
 * Get time range based on selection
 */
export function getTimeRange(range: "this_month" | "this_year" | "last_year" | "all_time"): { start: number; end: number } {
  switch (range) {
    case "this_month":
      return getCurrentMonthRange();
    case "this_year":
      return getCurrentYearRange();
    case "last_year":
      return getLastYearRange();
    case "all_time":
      return { start: 0, end: Date.now() };
  }
}

/**
 * Debounce function
 */
export function debounce<Args extends unknown[]>(
  fn: (...args: Args) => void,
  delay: number
): (...args: Args) => void {
  let timeoutId: NodeJS.Timeout;
  return (...args: Args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

/**
 * Generate a unique ID
 */
export function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

/**
 * Sleep for a given number of milliseconds
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Calculate percentage
 */
export function calculatePercentage(current: number, total: number): number {
  if (total === 0) return 0;
  return Math.min((current / total) * 100, 100);
}

/**
 * Group array by key
 */
export function groupBy<T>(array: T[], key: keyof T): Record<string, T[]> {
  return array.reduce((result, item) => {
    const groupKey = String(item[key]);
    if (!result[groupKey]) {
      result[groupKey] = [];
    }
    result[groupKey].push(item);
    return result;
  }, {} as Record<string, T[]>);
}

/**
 * Sum array of numbers
 */
export function sum(numbers: number[]): number {
  return numbers.reduce((acc, n) => acc + n, 0);
}
