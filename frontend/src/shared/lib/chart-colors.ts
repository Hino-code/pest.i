// Chart colors for light and dark modes
// These are used directly in chart stroke/fill props

export const chartColors = {
  // Primary colors
  primary: "#3b82f6",
  foreground: "#0f172a",
  muted: "#94a3b8",
  
  // Chart palette
  chart1: "#3b82f6",
  chart2: "#8b5cf6",
  chart3: "#ef4444",
  chart4: "#f59e0b",
  chart5: "#10b981",
  chart6: "#06b6d4",
  
  // Semantic colors
  success: "#10b981",
  warning: "#f59e0b",
  destructive: "#ef4444",
  info: "#3b82f6",
  
  // UI elements
  border: "#e2e8f0",
  background: "#f8fafc",
  card: "#ffffff",
};

export const darkChartColors = {
  primary: "#74a6f5",
  foreground: "#f1f5f9",
  muted: "#b3c2d7",

  // softened palette for dark mode to reduce vibrancy
  chart1: "#8cb7ff",
  chart2: "#c8b5ff",
  chart3: "#f28a8a",
  chart4: "#f7c97c",
  chart5: "#66d8b6",
  chart6: "#65d4e8",

  success: "#3ed3a5",
  warning: "#f6c15c",
  destructive: "#f26d6d",
  info: "#8cb7ff",

  border: "#334155",
  background: "#0f172a",
  card: "#1e293b",
};

// Get current theme colors
export const getCurrentChartColors = () => {
  if (typeof window === "undefined") return chartColors;
  const isDark = document.documentElement.classList.contains("dark");
  return isDark ? darkChartColors : chartColors;
};

