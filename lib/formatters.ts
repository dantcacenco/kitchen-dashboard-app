import { format, formatDistanceToNow, isToday, isYesterday } from "date-fns";

/**
 * Format cents to dollar string
 * @param cents - Amount in cents (e.g., 4523)
 * @returns Formatted string (e.g., "$45.23")
 */
export function formatCurrency(cents: number): string {
  const dollars = cents / 100;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(dollars);
}

/**
 * Format cents to compact dollar string (for large amounts)
 * @param cents - Amount in cents
 * @returns Formatted string (e.g., "$20K", "$1.5M")
 */
export function formatCurrencyCompact(cents: number): string {
  const dollars = cents / 100;
  if (dollars >= 1000000) {
    return `$${(dollars / 1000000).toFixed(1)}M`;
  }
  if (dollars >= 1000) {
    return `$${(dollars / 1000).toFixed(dollars >= 10000 ? 0 : 1)}K`;
  }
  return formatCurrency(cents);
}

/**
 * Parse dollar string to cents
 * @param dollarString - Dollar string (e.g., "45.23" or "$45.23")
 * @returns Amount in cents
 */
export function parseToCents(dollarString: string): number {
  const cleaned = dollarString.replace(/[$,]/g, "");
  const dollars = parseFloat(cleaned);
  if (isNaN(dollars)) return 0;
  return Math.round(dollars * 100);
}

/**
 * Format date for display
 * @param timestamp - Unix timestamp in milliseconds
 * @param formatStr - date-fns format string
 */
export function formatDate(
  timestamp: number,
  formatStr: string = "MMM d, yyyy"
): string {
  return format(new Date(timestamp), formatStr);
}

/**
 * Format date with relative time for recent dates
 * @param timestamp - Unix timestamp in milliseconds
 */
export function formatDateRelative(timestamp: number): string {
  const date = new Date(timestamp);

  if (isToday(date)) {
    return `Today at ${format(date, "h:mm a")}`;
  }

  if (isYesterday(date)) {
    return `Yesterday at ${format(date, "h:mm a")}`;
  }

  // Within last 7 days
  const daysDiff = Math.floor((Date.now() - timestamp) / (1000 * 60 * 60 * 24));
  if (daysDiff < 7) {
    return formatDistanceToNow(date, { addSuffix: true });
  }

  return format(date, "MMM d, yyyy");
}

/**
 * Format time only
 * @param timestamp - Unix timestamp in milliseconds
 */
export function formatTime(timestamp: number): string {
  return format(new Date(timestamp), "h:mm a");
}

/**
 * Format percentage
 * @param value - Decimal value (e.g., 0.1523 for 15.23%)
 * @param decimals - Number of decimal places
 */
export function formatPercent(value: number, decimals: number = 1): string {
  return `${(value * 100).toFixed(decimals)}%`;
}

/**
 * Format percentage change with sign
 * @param current - Current value
 * @param previous - Previous value
 */
export function formatPercentChange(current: number, previous: number): string {
  if (previous === 0) return current > 0 ? "+100%" : "0%";
  const change = ((current - previous) / Math.abs(previous)) * 100;
  const sign = change >= 0 ? "+" : "";
  return `${sign}${change.toFixed(1)}%`;
}

/**
 * Format ounces with proper precision
 * @param oz - Ounces value
 */
export function formatOunces(oz: number): string {
  if (oz === Math.floor(oz)) {
    return `${oz}oz`;
  }
  return `${oz.toFixed(2)}oz`;
}

/**
 * Format metal price per ounce
 * @param priceInCents - Price in cents
 */
export function formatMetalPrice(priceInCents: number): string {
  const dollars = priceInCents / 100;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(dollars) + "/oz";
}

/**
 * Get greeting based on time of day
 */
export function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good Morning";
  if (hour < 17) return "Good Afternoon";
  return "Good Evening";
}

/**
 * Format temperature with degree symbol
 * @param temp - Temperature value
 * @param unit - "F" or "C"
 */
export function formatTemperature(temp: number, unit: "F" | "C" = "F"): string {
  return `${Math.round(temp)}°${unit}`;
}
