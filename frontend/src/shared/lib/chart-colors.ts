// Chart colors for light and dark modes
// These use CSS variables to match the theme system

// Helper to get CSS variable value
const getCSSVariable = (varName: string): string => {
  if (typeof window === "undefined") return "";
  return getComputedStyle(document.documentElement)
    .getPropertyValue(varName)
    .trim();
};

// Get current theme colors using CSS variables
export const getCurrentChartColors = () => {
  if (typeof window === "undefined") {
    // Fallback for SSR
    return {
      primary: "#5e6ad2",
      foreground: "#18181b",
      muted: "#71717a",
      chart1: "#5e6ad2",
      chart2: "#22c55e",
      chart3: "#f97316",
      chart4: "#8b5cf6",
      chart5: "#06b6d4",
      chart6: "#e11d48",
  success: "#10b981",
  warning: "#f59e0b",
      destructive: "#e11d48",
  info: "#3b82f6",
      border: "#e4e4e7",
      background: "#fdfdfd",
  card: "#ffffff",
};
  }

  const isDark = document.documentElement.classList.contains("dark");
  
  return {
    // Primary colors from CSS variables
    primary: getCSSVariable("--primary") || (isDark ? "#6366f1" : "#5e6ad2"),
    foreground: getCSSVariable("--foreground") || (isDark ? "#fafafa" : "#18181b"),
    muted: getCSSVariable("--muted-foreground") || (isDark ? "#a1a1aa" : "#71717a"),
    
    // Chart palette from CSS variables
    chart1: getCSSVariable("--chart-1") || (isDark ? "#6366f1" : "#5e6ad2"),
    chart2: getCSSVariable("--chart-2") || (isDark ? "#34d399" : "#22c55e"),
    chart3: getCSSVariable("--chart-3") || (isDark ? "#fb923c" : "#f97316"),
    chart4: getCSSVariable("--chart-4") || (isDark ? "#a78bfa" : "#8b5cf6"),
    chart5: getCSSVariable("--chart-5") || (isDark ? "#22d3ee" : "#06b6d4"),
    chart6: getCSSVariable("--chart-6") || (isDark ? "#f43f5e" : "#e11d48"),
    
    // Semantic colors from CSS variables
    success: getCSSVariable("--success") || (isDark ? "#34d399" : "#10b981"),
    warning: getCSSVariable("--warning") || (isDark ? "#fbbf24" : "#f59e0b"),
    destructive: getCSSVariable("--destructive") || (isDark ? "#f43f5e" : "#e11d48"),
    info: getCSSVariable("--info") || (isDark ? "#60a5fa" : "#3b82f6"),
    
    // UI elements from CSS variables
    border: getCSSVariable("--border") || (isDark ? "#27272a" : "#e4e4e7"),
    background: getCSSVariable("--background") || (isDark ? "#09090b" : "#fdfdfd"),
    card: getCSSVariable("--card") || (isDark ? "#121215" : "#ffffff"),
  };
};

// Legacy exports for backward compatibility
// These are getters that always return current theme colors
export const chartColors = new Proxy({} as ReturnType<typeof getCurrentChartColors>, {
  get(_, prop: string) {
    const colors = getCurrentChartColors();
    return colors[prop as keyof typeof colors];
  }
});

export const darkChartColors = chartColors; // Same, theme is detected automatically

