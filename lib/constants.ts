// Expense categories with display info
export const EXPENSE_CATEGORIES = {
  groceries: { label: "Groceries", icon: "ShoppingCart", color: "#4CAF50" },
  gas: { label: "Gas", icon: "Fuel", color: "#2196F3" },
  housing: { label: "Housing", icon: "Home", color: "#FF9800" },
  dining: { label: "Dining", icon: "Utensils", color: "#E91E63" },
  travel: { label: "Travel", icon: "Plane", color: "#9C27B0" },
  clothing: { label: "Clothing", icon: "Shirt", color: "#00BCD4" },
  healthcare: { label: "Healthcare", icon: "Heart", color: "#F44336" },
  utilities: { label: "Utilities", icon: "Zap", color: "#607D8B" },
  other: { label: "Other", icon: "MoreHorizontal", color: "#9E9E9E" },
} as const;

// Shopping categories
export const SHOPPING_CATEGORIES = {
  groceries: { label: "Groceries", color: "#4CAF50" },
  household: { label: "Household", color: "#2196F3" },
  personal: { label: "Personal", color: "#9C27B0" },
  other: { label: "Other", color: "#9E9E9E" },
} as const;

// Default income sources
export const DEFAULT_INCOME_SOURCES = [
  { name: "Hosting", color: "#4CAF50" },
  { name: "DJ", color: "#E91E63" },
  { name: "Coding", color: "#2196F3" },
  { name: "Photography", color: "#9C27B0" },
  { name: "Construction", color: "#FF9800" },
  { name: "Babysitting", color: "#00BCD4" },
  { name: "Cleaning", color: "#8BC34A" },
] as const;

// Priority levels
export const PRIORITIES = {
  critical: { label: "Critical", color: "#F44336" },
  high: { label: "High", color: "#FF9800" },
  medium: { label: "Medium", color: "#FFC107" },
  low: { label: "Low", color: "#9E9E9E" },
} as const;

// Shopping priorities
export const SHOPPING_PRIORITIES = {
  urgent: { label: "Urgent", color: "#F44336" },
  normal: { label: "Normal", color: "#FFC107" },
  low: { label: "Low", color: "#9E9E9E" },
} as const;

// Default dashboard layout (12-column grid)
export const DEFAULT_LAYOUT = [
  { i: "weather", x: 0, y: 0, w: 3, h: 2, minW: 2, minH: 2 },
  { i: "income", x: 3, y: 0, w: 3, h: 2, minW: 2, minH: 2 },
  { i: "quickStats", x: 6, y: 0, w: 6, h: 2, minW: 4, minH: 2 },
  { i: "shopping", x: 0, y: 2, w: 6, h: 3, minW: 4, minH: 2 },
  { i: "savings", x: 6, y: 2, w: 6, h: 3, minW: 4, minH: 2 },
  { i: "expenses", x: 0, y: 5, w: 12, h: 2, minW: 6, minH: 2 },
];

// Grid configuration
export const GRID_CONFIG = {
  cols: 12,
  rowHeight: 100,
  margin: [16, 16] as [number, number],
  containerPadding: [16, 16] as [number, number],
};

// Time ranges for filtering
export const TIME_RANGES = {
  this_month: "This Month",
  this_year: "This Year",
  last_year: "Last Year",
  all_time: "All Time",
} as const;

// Weather codes to icons (for lucide-react)
export const WEATHER_ICONS: Record<number, string> = {
  0: "Sun", // Clear sky
  1: "Sun", // Mainly clear
  2: "CloudSun", // Partly cloudy
  3: "Cloud", // Overcast
  45: "CloudFog", // Foggy
  48: "CloudFog", // Depositing rime fog
  51: "CloudDrizzle", // Light drizzle
  53: "CloudDrizzle", // Moderate drizzle
  55: "CloudDrizzle", // Dense drizzle
  61: "CloudRain", // Slight rain
  63: "CloudRain", // Moderate rain
  65: "CloudRain", // Heavy rain
  71: "CloudSnow", // Slight snow
  73: "CloudSnow", // Moderate snow
  75: "CloudSnow", // Heavy snow
  77: "Snowflake", // Snow grains
  80: "CloudRain", // Slight rain showers
  81: "CloudRain", // Moderate rain showers
  82: "CloudRain", // Violent rain showers
  85: "CloudSnow", // Slight snow showers
  86: "CloudSnow", // Heavy snow showers
  95: "CloudLightning", // Thunderstorm
  96: "CloudLightning", // Thunderstorm with slight hail
  99: "CloudLightning", // Thunderstorm with heavy hail
};

// API endpoints
export const API_ENDPOINTS = {
  weather: "/api/weather",
  metalPrices: "https://api.metals.live/v1/spot",
} as const;
