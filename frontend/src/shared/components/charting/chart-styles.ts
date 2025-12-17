import { getCurrentChartColors } from '@/shared/lib/chart-colors';

// Get current theme colors dynamically
const getChartColors = () => getCurrentChartColors();

// Common chart styling configuration using direct color values
// These functions return styles dynamically based on current theme
export const chartAxisStyle = {
  get tick() {
    return { fontSize: 11, fill: getChartColors().foreground };
  },
  get stroke() {
    return getChartColors().border;
  },
  strokeWidth: 1.5,
};

export const chartGridStyle = {
  strokeDasharray: '3 3',
  get stroke() {
    return getChartColors().border;
  },
  opacity: 0.5,
  vertical: false,
};

export const chartTooltipStyle = {
  get contentStyle() {
    const colors = getChartColors();
    return {
      backgroundColor: colors.card,
      border: `1px solid ${colors.border}`,
      borderRadius: '8px',
      color: colors.foreground,
      padding: '8px 12px',
    };
  },
};

// Export chart colors getter
export const chartColors = new Proxy({} as ReturnType<typeof getCurrentChartColors>, {
  get(_, prop: string) {
    return getChartColors()[prop as keyof ReturnType<typeof getCurrentChartColors>];
  }
});
