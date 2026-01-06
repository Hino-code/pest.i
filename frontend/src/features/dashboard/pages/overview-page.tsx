import { useMemo, useEffect } from "react";
import { Card } from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import { SharedFilters } from "@/shared/components/filters/shared-filters";
import { useDashboardStore } from "@/state/store";
import { useChartColors } from "@/shared/hooks/use-chart-colors";
import type { FilterValues } from "@/shared/types/filters";
import {
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  ComposedChart,
  Area,
  Legend,
  RadialBarChart,
  RadialBar,
  PolarAngleAxis,
  ReferenceLine,
  ReferenceArea,
} from "recharts";
import {
  Droplet,
  Leaf,
  Trash,
  WarningTriangle,
  InfoCircle,
  CheckCircle,
} from "iconoir-react";
import type { TooltipProps, DotProps } from "recharts";
import {
  chartAxisStyle,
  chartGridStyle,
  chartTooltipStyle,
} from "@/shared/components/charting/chart-styles";
import { KpiCards } from "../components/kpi-cards";
import { DashboardSkeleton } from "../components/loading-skeleton";

type ForecastPoint = {
  date: string;
  fullDate: string;
  dateLabel: string;
  dateValue: number;
  actual: number | null;
  predicted: number | null;
  lowerBound: number | null;
  upperBound: number | null;
  confidenceLower: number | null;
  confidenceUpper: number | null;
  confidenceBandHeight: number | null;
  bandBase: number;
  bandSize: number;
  confidence: number | null;
  exceedsThreshold: boolean;
  isHistorical: boolean;
  isForecast: boolean;
};

export function Overview() {
  const filters = useDashboardStore((state) => state.filters);
  const setFilters = useDashboardStore((state) => state.setFilters);
  const initialize = useDashboardStore((state) => state.initialize);
  // Forecast horizon is fixed at 7 days and not affected by filters
  const forecastHorizon = 7;
  const filteredData = useDashboardStore((state) => state.filteredObservations);
  const allObservations = useDashboardStore((state) => state.observations);
  const alerts = useDashboardStore((state) => state.alerts);
  const kpis = useDashboardStore((state) => state.kpis);
  const loading = useDashboardStore((state) => state.loading);
  const error = useDashboardStore((state) => state.error);
  const allForecasts = useDashboardStore((state) => state.forecasts);
  const chartColors = useChartColors();

  // Custom dot component for threshold-aware highlighting
  const ThresholdAwareDot = useMemo(() => {
    return (props: DotProps & { payload?: any }) => {
      const { cx, cy, payload } = props;
      const exceedsThreshold = payload?.exceedsThreshold;

      if (cx === undefined || cy === undefined) return null;

      return (
        <circle
          cx={cx}
          cy={cy}
          r={exceedsThreshold ? 5 : 4}
          fill={exceedsThreshold ? chartColors.destructive : "#9333ea"}
          stroke={exceedsThreshold ? chartColors.destructive : "#9333ea"}
          strokeWidth={exceedsThreshold ? 2 : 1}
        />
      );
    };
  }, [chartColors]);

  useEffect(() => {
    initialize();
  }, [initialize]);

  const handleFilterChange = (nextFilters: FilterValues) => {
    setFilters(nextFilters);
  };

  // Filter forecasts to exactly 7 days (not affected by date filters)
  // Forecasts are for future dates starting from the day after the last data point
  // Simply take the first 7 forecasts since they're already sorted by date from backend
  const forecasts = useMemo(() => {
    // Take first 7 forecasts - they should already be sorted chronologically
    // This is more reliable than date filtering which can have timezone issues
    return allForecasts.slice(0, 7);
  }, [allForecasts]);

  // Calculate week-over-week changes and history for sparklines
  const kpiData = useMemo(() => {
    const now = new Date();
    // Use last 14 days for history/sparklines
    const historyDays = 14;
    const historyStart = new Date(
      now.getTime() - historyDays * 24 * 60 * 60 * 1000
    );

    // For trends (WoW)
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    const thisWeek = filteredData.filter(
      (obs) => new Date(obs.date) >= oneWeekAgo
    );
    const lastWeek = filteredData.filter((obs) => {
      const date = new Date(obs.date);
      return date >= twoWeeksAgo && date < oneWeekAgo;
    });

    const calculateChange = (current: number, previous: number) => {
      if (previous === 0) return 0;
      return Math.round(((current - previous) / previous) * 100);
    };

    // --- Trend Values ---
    const aboveThresholdThis = thisWeek.filter((o) => o.aboveThreshold).length;
    const aboveThresholdLast = lastWeek.filter((o) => o.aboveThreshold).length;
    const aboveThresholdPct =
      thisWeek.length > 0
        ? Math.round((aboveThresholdThis / thisWeek.length) * 100)
        : 0;
    const aboveThresholdPctLast =
      lastWeek.length > 0
        ? Math.round((aboveThresholdLast / lastWeek.length) * 100)
        : 0;

    const actionsTakenThis = thisWeek.filter((o) => o.actionTaken).length;
    const actionsTakenLast = lastWeek.filter((o) => o.actionTaken).length;

    const avgCountThis =
      thisWeek.length > 0
        ? Math.round(
            thisWeek.reduce((sum, o) => sum + o.count, 0) / thisWeek.length
          )
        : 0;
    const avgCountLast =
      lastWeek.length > 0
        ? Math.round(
            lastWeek.reduce((sum, o) => sum + o.count, 0) / lastWeek.length
          )
        : 0;

    // --- History / Sparklines (Daily aggregation for last 14 days) ---
    const dailyHistory: Record<
      string,
      { count: number; totalPest: number; above: number; actions: number }
    > = {};

    // Initialize last 14 days with 0
    for (let i = 0; i < historyDays; i++) {
      const d = new Date(
        now.getTime() - (historyDays - 1 - i) * 24 * 60 * 60 * 1000
      );
      const key = d.toISOString().split("T")[0];
      dailyHistory[key] = { count: 0, totalPest: 0, above: 0, actions: 0 };
    }

    // Fill with data
    filteredData.forEach((obs) => {
      const key = obs.date.split("T")[0];
      if (dailyHistory[key]) {
        dailyHistory[key].count += 1;
        dailyHistory[key].totalPest += obs.count;
        if (obs.aboveThreshold) dailyHistory[key].above += 1;
        if (obs.actionTaken) dailyHistory[key].actions += 1;
      }
    });

    const sortedKeys = Object.keys(dailyHistory).sort();

    const obsHistory = sortedKeys.map((k) => dailyHistory[k].count);
    const avgHistory = sortedKeys.map((k) =>
      dailyHistory[k].count > 0
        ? Math.round(dailyHistory[k].totalPest / dailyHistory[k].count)
        : 0
    );
    const aboveHistory = sortedKeys.map((k) =>
      dailyHistory[k].count > 0
        ? Math.round((dailyHistory[k].above / dailyHistory[k].count) * 100)
        : 0
    );
    const actionHistory = sortedKeys.map((k) =>
      dailyHistory[k].count > 0
        ? Math.round((dailyHistory[k].actions / dailyHistory[k].count) * 100)
        : 0
    );

    // --- Insights Logic (2025 "Actionable" Principle) ---
    const getInsight = (
      trendVal: number,
      metricName: string,
      context: "moreIsBad" | "moreIsGood" | "neutral"
    ): {
      label: string;
      sentiment: "neutral" | "warning" | "good" | "critical";
    } => {
      const absTrend = Math.abs(trendVal);
      const isUp = trendVal > 0;

      // Small changes are neutral
      if (absTrend < 5)
        return { label: "Stable vs last week", sentiment: "neutral" };

      if (context === "moreIsBad") {
        if (isUp) {
          return absTrend > 15
            ? { label: "Significant spike detected", sentiment: "critical" }
            : { label: "Rising trend observed", sentiment: "warning" };
        } else {
          return { label: "Improved vs last week", sentiment: "good" };
        }
      } else if (context === "moreIsGood") {
        if (isUp) {
          return { label: "Performance improving", sentiment: "good" };
        } else {
          return absTrend > 15
            ? { label: "Sharp decline needs review", sentiment: "critical" }
            : { label: "Falling below average", sentiment: "warning" };
        }
      }

      // Neutral context (e.g. Total Observations - just activity volume)
      return {
        label: isUp ? "Increased field activity" : "Lower reporting volume",
        sentiment: "neutral",
      };
    };

    return {
      observations: {
        trend: {
          value: calculateChange(thisWeek.length, lastWeek.length),
          history: obsHistory,
        },
        ...getInsight(
          calculateChange(thisWeek.length, lastWeek.length),
          "Observations",
          "neutral"
        ),
      },
      avgCount: {
        trend: {
          value: calculateChange(avgCountThis, avgCountLast),
          history: avgHistory,
        },
        ...getInsight(
          calculateChange(avgCountThis, avgCountLast),
          "Avg Count",
          "moreIsBad"
        ),
      },
      aboveThreshold: {
        trend: {
          value: aboveThresholdPct - aboveThresholdPctLast,
          history: aboveHistory,
        },
        ...getInsight(
          aboveThresholdPct - aboveThresholdPctLast,
          "Critical %",
          "moreIsBad"
        ),
      },
      actionRate: {
        trend: {
          value: Math.round(
            kpis.actionRate -
              (lastWeek.length > 0
                ? Math.round((actionsTakenLast / lastWeek.length) * 100)
                : 0)
          ),
          history: actionHistory,
        },
        ...getInsight(
          kpis.actionRate -
            (lastWeek.length > 0
              ? Math.round((actionsTakenLast / lastWeek.length) * 100)
              : 0),
          "Action Rate",
          "moreIsGood"
        ),
      },
    };
  }, [filteredData, kpis]);

  // Prepare chart data
  const thresholdStackData = useMemo(() => {
    let critical = 0;
    let warning = 0;
    let normal = 0;
    filteredData.forEach((obs) => {
      if (obs.count >= obs.threshold) {
        critical += 1;
      } else if (obs.count >= obs.threshold * 0.7) {
        warning += 1;
      } else {
        normal += 1;
      }
    });
    const data = [
      {
        name: "Critical",
        count: critical,
        fill: chartColors.destructive,
      },
      {
        name: "Warning",
        count: warning,
        fill: chartColors.chart4,
      },
      {
        name: "Normal",
        count: normal,
        fill: chartColors.success,
      },
    ];
    // Sort so largest rings are outer? Or specific order?
    // Usually Critical outer is good for visibility.
    // Recharts RadialBar renders in order.
    return { data, summary: { critical, warning, normal } };
  }, [filteredData, chartColors]);

  const actionTrackerData = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredData
      .filter((obs) => obs.actionTaken)
      .forEach((obs) => {
        const type = obs.actionType?.trim() || "Unspecified";
        counts[type] = (counts[type] || 0) + 1;
      });
    return Object.entries(counts)
      .map(([type, value]) => ({ type, value }))
      .sort((a, b) => b.value - a.value);
  }, [filteredData]);

  const recentCriticalAlerts = useMemo(() => {
    return alerts
      .filter((a) => a.priority === "high")
      .sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      )
      .slice(0, 3);
  }, [alerts]);

  // Economic Threshold and Injury Level constants
  const economicThreshold = 50; // ET for Black Rice Bug
  const economicInjuryLevel = 75; // EIL = 1.5x ET
  const operationalBaseline = 0;

  const forecastSeries = useMemo<ForecastPoint[]>(() => {
    // Get the most recent observations to show historical trend before forecast
    // Similar to forecast page: get all observations, group by date, then take most recent
    const grouped: Record<
      string,
      { date: string; count: number; observations: number }
    > = {};

    // Filter observations by pest type and get recent ones (sorted by date, most recent first)
    const recentObs = allObservations
      .filter(
        (o) => filters.pestType === "All" || o.pestType === filters.pestType
      )
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 500); // Last 500 observations

    // Group by date
    recentObs.forEach((obs) => {
      if (!grouped[obs.date]) {
        grouped[obs.date] = { date: obs.date, count: 0, observations: 0 };
      }
      grouped[obs.date].count += obs.count;
      grouped[obs.date].observations += 1;
    });

    // Convert to historical points and sort by date
    let historicalPoints = Object.values(grouped)
      .map((g) => {
        const dateValue = new Date(g.date).getTime();
        const actual = Math.round(g.count / g.observations);
        return {
          date: new Date(g.date).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          }),
          fullDate: g.date,
          dateLabel: new Date(g.date).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          }),
          dateValue,
          actual,
          predicted: null,
          lowerBound: null,
          upperBound: null,
          confidenceLower: null,
          confidenceUpper: null,
          confidenceBandHeight: null,
          bandBase: 0,
          bandSize: 0,
          confidence: null,
          exceedsThreshold: actual > economicThreshold,
          isHistorical: true,
          isForecast: false,
        } as ForecastPoint;
      })
      .sort((a, b) => a.dateValue - b.dateValue);

    // Get the most recent date from historical data
    const mostRecentHistoricalDate =
      historicalPoints.length > 0
        ? new Date(historicalPoints[historicalPoints.length - 1].fullDate)
        : null;

    // Filter to show last 7-14 days of historical data (before forecast starts)
    // This ensures we show a balanced view: ~7-14 days historical + 7 days forecast
    if (mostRecentHistoricalDate) {
      const cutoffDate = new Date(mostRecentHistoricalDate);
      cutoffDate.setDate(cutoffDate.getDate() - 14); // Last 14 days
      historicalPoints = historicalPoints.filter(
        (p) => new Date(p.fullDate) >= cutoffDate
      );
    }

    // If we still have too many, take the most recent 7 days
    if (historicalPoints.length > 7) {
      historicalPoints = historicalPoints.slice(-7);
    }

    // Debug: Log historical points to verify data
    if (historicalPoints.length > 0) {
      console.log(
        "Historical points for forecast chart:",
        historicalPoints.length,
        historicalPoints
      );
    } else {
      console.warn(
        "No historical points found for forecast chart. Total observations:",
        allObservations.length,
        "Filtered observations:",
        recentObs.length
      );
    }

    // Get last historical point for bridge
    const lastHistoricalPoint =
      historicalPoints.length > 0
        ? historicalPoints[historicalPoints.length - 1]
        : null;
    const lastHistoricalValue = lastHistoricalPoint?.actual ?? 0;
    const lastHistoricalDate = lastHistoricalPoint?.fullDate ?? null;

    // Filter forecasts by pest type only (not date range)
    const filteredForecasts = forecasts.filter(
      (f) => filters.pestType === "All" || f.pestType === filters.pestType
    );

    // Create bridge point for smooth transition
    const firstForecast = filteredForecasts[0];
    const bridgePoint =
      lastHistoricalPoint && firstForecast
        ? ({
            date: lastHistoricalPoint.date,
            fullDate: lastHistoricalPoint.fullDate,
            dateLabel: lastHistoricalPoint.dateLabel,
            dateValue: lastHistoricalPoint.dateValue,
            actual: lastHistoricalValue,
            predicted: lastHistoricalValue, // Use historical value as bridge
            lowerBound: Math.max(
              0,
              lastHistoricalValue -
                (firstForecast.upperBound - firstForecast.lowerBound) / 2
            ),
            upperBound:
              lastHistoricalValue +
              (firstForecast.upperBound - firstForecast.lowerBound) / 2,
            confidenceLower: Math.max(
              0,
              lastHistoricalValue -
                (firstForecast.upperBound - firstForecast.lowerBound) / 2
            ),
            confidenceUpper:
              lastHistoricalValue +
              (firstForecast.upperBound - firstForecast.lowerBound) / 2,
            confidenceBandHeight:
              firstForecast.upperBound - firstForecast.lowerBound,
            bandBase: 0,
            bandSize: 0,
            confidence: null,
            exceedsThreshold: lastHistoricalValue > economicThreshold,
            isHistorical: false,
            isForecast: true, // Mark as forecast so it connects to forecast line
          } as ForecastPoint)
        : null;

    const forecastPoints = filteredForecasts.map((f) => {
      const lower = Math.max(0, f.lowerBound);
      const upper = Math.max(lower, f.upperBound);
      const bandHeight = upper - lower;
      // Clamp negative predictions to 0 - XGBoost can output negatives
      const predicted = Math.max(0, f.predicted);
      const exceedsThreshold = predicted > economicThreshold;

      return {
        date: new Date(f.date).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        }),
        fullDate: f.date,
        dateLabel: new Date(f.date).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        }),
        dateValue: new Date(f.date).getTime(),
        actual: null,
        predicted: predicted,
        lowerBound: lower,
        upperBound: upper,
        confidenceLower: lower,
        confidenceUpper: upper,
        confidenceBandHeight: bandHeight,
        bandBase: 0,
        bandSize: 0,
        confidence: f.confidence,
        exceedsThreshold: exceedsThreshold,
        isHistorical: false,
        isForecast: true,
      } as ForecastPoint;
    });

    // Combine: historical + bridge + forecast
    return bridgePoint
      ? [...historicalPoints, bridgePoint, ...forecastPoints].sort(
          (a, b) => a.dateValue - b.dateValue
        )
      : [...historicalPoints, ...forecastPoints].sort(
          (a, b) => a.dateValue - b.dateValue
        );
  }, [allObservations, forecasts, filters.pestType, economicThreshold]);

  // Calculate Y-axis domain with padding, ensuring threshold is visible
  const yAxisDomain = useMemo(() => {
    const allValues: number[] = [];

    forecastSeries.forEach((d) => {
      if (d.actual !== null) allValues.push(d.actual);
      if (d.predicted !== null) allValues.push(d.predicted);
      if (d.lowerBound !== null) allValues.push(d.lowerBound);
      if (d.upperBound !== null) allValues.push(d.upperBound);
    });

    // Always include threshold values to ensure they're visible
    allValues.push(economicThreshold, economicInjuryLevel);

    if (allValues.length === 0) return [0, Math.max(100, economicInjuryLevel)];

    const min = Math.min(...allValues);
    const max = Math.max(...allValues);
    const range = max - min;
    const padding = range * 0.15; // 15% padding

    // Always start at 0 for correct perspective, round to integers
    return [0, Math.ceil(max + padding)];
  }, [forecastSeries, economicThreshold, economicInjuryLevel]);

  // Find the index where forecast starts (for vertical divider)
  const forecastStartIndex = useMemo(() => {
    return forecastSeries.findIndex((d) => d.isForecast);
  }, [forecastSeries]);

  const benchmarkSeries = useMemo(() => {
    // Get the most recent 7 days of observations for benchmarks (not affected by date filters)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(today.getDate() - 7);

    const recentObservationsForBenchmark = allObservations.filter((obs) => {
      const obsDate = new Date(obs.date);
      obsDate.setHours(0, 0, 0, 0);
      const matchesPestType =
        filters.pestType === "All" || obs.pestType === filters.pestType;
      return obsDate >= sevenDaysAgo && obsDate <= yesterday && matchesPestType;
    });

    // Build lookup by day-of-year for last year's averages
    const groupByDay = (
      observations: typeof allObservations,
      offsetYears: number
    ) => {
      const grouped: Record<number, { total: number; count: number }> = {};
      observations.forEach((obs) => {
        const d = new Date(obs.date);
        d.setFullYear(d.getFullYear() + offsetYears);
        const dayOfYear = Math.floor(
          (Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) -
            Date.UTC(d.getFullYear(), 0, 0)) /
            24 /
            60 /
            60 /
            1000
        );
        if (!grouped[dayOfYear]) {
          grouped[dayOfYear] = { total: 0, count: 0 };
        }
        grouped[dayOfYear].total += obs.count;
        grouped[dayOfYear].count += 1;
      });
      return grouped;
    };

    const lastYearGrouped = groupByDay(recentObservationsForBenchmark, -1);
    const overallGrouped = groupByDay(recentObservationsForBenchmark, 0);

    const mergedDates = Array.from(
      new Set(
        forecastSeries
          .filter((f) => f.predicted !== null)
          .map((f) => f.dateValue)
      )
    ).sort((a, b) => a - b);

    const buildSeries = (
      grouped: Record<number, { total: number; count: number }>,
      label: string
    ) => {
      return mergedDates.map((dateValue) => {
        const d = new Date(dateValue);
        const dayOfYear = Math.floor(
          (Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) -
            Date.UTC(d.getFullYear(), 0, 0)) /
            24 /
            60 /
            60 /
            1000
        );
        const bucket = grouped[dayOfYear];
        const value =
          bucket && bucket.count > 0
            ? Math.round(bucket.total / bucket.count)
            : null;
        return {
          dateValue,
          dateLabel: new Date(dateValue).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          }),
          benchmark: value,
          label,
        };
      });
    };

    const lastYearSeries = buildSeries(lastYearGrouped, "Last Year Avg");
    const overallSeries = buildSeries(overallGrouped, "Overall Avg");

    const mergedBenchmarks = forecastSeries.map((point, idx) => {
      const ly = lastYearSeries[idx]?.benchmark ?? null;
      const ov = overallSeries[idx]?.benchmark ?? null;
      return {
        ...point,
        lastYearBenchmark: ly,
        overallBenchmark: ov,
      };
    });

    return { mergedBenchmarks };
  }, [allObservations, forecastSeries, filters.pestType]);

  // Custom tooltip for forecast chart with enhanced context
  const renderForecastTooltip = ({
    active,
    payload,
    label,
  }: TooltipProps<number, string>) => {
    if (!active || !payload || payload.length === 0) return null;

    const data = payload[0].payload;
    const isForecast = data?.isForecast;
    const exceedsThreshold = data?.exceedsThreshold;

    // Calculate confidence level for this point
    const getConfidenceLevel = () => {
      if (
        !isForecast ||
        data.confidenceUpper === null ||
        data.confidenceLower === null
      ) {
        return null;
      }
      const ciWidth = data.confidenceUpper - data.confidenceLower;
      if (ciWidth > economicThreshold * 0.3) return "Low";
      if (ciWidth > economicThreshold * 0.15) return "Medium";
      return "High";
    };

    const confidenceLevel = getConfidenceLevel();

    return (
      <div className="bg-card border border-border rounded-lg shadow-lg p-3 space-y-2 min-w-[180px]">
        <p className="font-medium text-sm border-b border-border pb-1">
          {label}
        </p>
        {isForecast ? (
          <>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Date</p>
              <p className="text-sm font-semibold">{label}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Count</p>
              <p
                className="text-base font-bold"
                style={{
                  color: data.exceedsThreshold
                    ? chartColors.destructive
                    : "#2563eb",
                }}
              >
                {data.predicted !== null && data.predicted !== undefined
                  ? `${data.predicted.toFixed(1)} bugs`
                  : "N/A"}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Status</p>
              <p
                className={`text-xs font-semibold ${
                  data.exceedsThreshold
                    ? "text-destructive"
                    : data.predicted !== null &&
                      data.predicted > economicThreshold * 0.7
                    ? "text-amber-600"
                    : "text-emerald-600"
                }`}
              >
                {data.exceedsThreshold
                  ? "High Risk (Apply Control Measure)"
                  : data.predicted !== null &&
                    data.predicted > economicThreshold * 0.7
                  ? "Moderate Risk (Monitor Closely)"
                  : "Low Risk (Normal Monitoring)"}
              </p>
            </div>
            {data.confidenceLower !== null && data.confidenceUpper !== null && (
              <div className="space-y-1 pt-1 border-t border-border">
                <p className="text-xs text-muted-foreground">
                  Confidence Range
                </p>
                <p className="text-xs font-mono">
                  {data.confidenceLower.toFixed(1)} -{" "}
                  {data.confidenceUpper.toFixed(1)} bugs
                </p>
              </div>
            )}
          </>
        ) : (
          <>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Date</p>
              <p className="text-sm font-semibold">{label}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Count</p>
              <p className="text-base font-bold" style={{ color: "#2563eb" }}>
                {data.actual !== null && data.actual !== undefined
                  ? `${data.actual} bugs`
                  : "N/A"}
              </p>
            </div>
            <p className="text-xs text-muted-foreground italic mt-2 pt-1 border-t border-border">
              Historical (observed)
            </p>
          </>
        )}
      </div>
    );
  };

  const contentReady = !loading && filteredData.length > 0;
  const hasNoData = !loading && !error && filteredData.length === 0;

  const peakForecast = useMemo(() => {
    const predicted = forecasts
      .filter(
        (f) => filters.pestType === "All" || f.pestType === filters.pestType
      )
      .map((f) => f.predicted);
    if (predicted.length === 0) return null;
    const peak = Math.max(...predicted);
    const risk = peak >= 70 ? "Critical" : peak >= 50 ? "Elevated" : "Normal";
    const action =
      risk === "Critical"
        ? "Deploy chemical control within 48 hours"
        : risk === "Elevated"
        ? "Increase scouting and prep interventions"
        : "Maintain routine monitoring";
    return { peak, risk, action };
  }, [forecasts, filters.pestType]);

  return (
    <div className="p-6 space-y-6">
      <SharedFilters
        filters={filters}
        onFilterChange={handleFilterChange}
        compact
        primaryOnly
        showAdvanced
      />
      {error && (
        <Card className="p-4 border-destructive/50 bg-destructive/5 text-destructive">
          <p>{error}</p>
        </Card>
      )}
      {loading && !contentReady ? (
        <DashboardSkeleton />
      ) : hasNoData ? (
        <Card className="p-8 text-center border-border bg-background/50">
          <p className="text-muted-foreground mb-2">No data available</p>
          <p className="text-sm text-muted-foreground/70">
            {error
              ? "There was an error loading the data. Please check the console for details."
              : "No observations match the current filters. Try adjusting your filter criteria."}
          </p>
        </Card>
      ) : (
        <div className="space-y-6">
          <div className="mb-6">
            <KpiCards kpis={kpis} insights={kpiData} />
          </div>

          <Card className="p-6 relative overflow-hidden border border-border bg-white shadow-sm rounded-xl">
            <div className="flex flex-col space-y-6 pt-2">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-xl font-semibold text-foreground">
                      7-Day Pest Forecast (XGBoost)
                    </h3>
                    {(() => {
                      // Calculate max forecast value and determine risk
                      const forecastValues = forecasts
                        .slice(0, 7)
                        .map((f) => f.predicted);
                      const maxValue = Math.max(...forecastValues, 0);
                      const maxDay = forecasts
                        .slice(0, 7)
                        .find((f) => f.predicted === maxValue);
                      const exceedsThreshold = maxValue > economicThreshold;

                      if (exceedsThreshold && maxDay) {
                        const dayIndex =
                          forecasts.slice(0, 7).indexOf(maxDay) + 1;
                        return (
                          <span
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold"
                            style={{
                              background: "#fee2e2",
                              color: "#991b1b",
                            }}
                          >
                            <WarningTriangle className="h-3.5 w-3.5" />
                            Critical Alert Expected (Day {dayIndex})
                          </span>
                        );
                      } else if (maxValue > economicThreshold * 0.7) {
                        return (
                          <span
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold"
                            style={{
                              background: "#fef3c7",
                              color: "#92400e",
                            }}
                          >
                            <WarningTriangle className="h-3.5 w-3.5" />
                            Elevated Risk (Max: {maxValue.toFixed(1)} bugs)
                          </span>
                        );
                      } else {
                        return (
                          <span
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold"
                            style={{
                              background: "#dcfce7",
                              color: "#166534",
                            }}
                          >
                            <CheckCircle className="h-3.5 w-3.5" />
                            Low Risk (Max: {maxValue.toFixed(1)} bugs)
                          </span>
                        );
                      }
                    })()}
                  </div>
                  <p className="text-base text-muted-foreground mt-1 font-medium">
                    AI-powered pest trend projections & confidence intervals
                    using XGBoost model
                  </p>
                </div>
              </div>

              {/* Risk and Peak Badges Row */}
              {peakForecast && (
                <div className="flex flex-wrap items-center gap-3 text-sm font-semibold text-foreground">
                  <Badge
                    variant={
                      peakForecast.risk === "Critical"
                        ? "destructive"
                        : "outline"
                    }
                    className={`text-xs px-3 py-1 font-bold ${
                      peakForecast.risk === "Elevated"
                        ? "bg-amber-50 text-amber-700 border-amber-200"
                        : peakForecast.risk === "Normal"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : ""
                    }`}
                  >
                    {peakForecast.risk}
                  </Badge>
                  <span className="text-muted-foreground">
                    Peak:{" "}
                    <span className="text-foreground font-bold tracking-tight ml-1">
                      {peakForecast.peak}
                    </span>
                  </span>
                </div>
              )}
            </div>

            {forecastSeries.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-[380px] text-muted-foreground">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-3"></div>
                <p className="text-sm font-medium">Loading Forecast...</p>
                <p className="text-xs mt-1">
                  Fetching XGBoost predictions from backend
                </p>
              </div>
            ) : (
              <div className="relative mt-6">
                <ResponsiveContainer width="100%" height={380}>
                  <ComposedChart
                    data={forecastSeries}
                    margin={{ top: 10, right: 30, bottom: 0, left: -20 }}
                  >
                    <defs>
                      {/* Forecast region background tint */}
                      <linearGradient
                        id="forecastRegionTint"
                        x1="0"
                        x2="1"
                        y1="0"
                        y2="0"
                      >
                        <stop
                          offset="0%"
                          stopColor="rgba(139, 92, 246, 0.03)"
                          stopOpacity={1}
                        />
                        <stop
                          offset="100%"
                          stopColor="rgba(139, 92, 246, 0.08)"
                          stopOpacity={1}
                        />
                      </linearGradient>
                      <linearGradient
                        id="forecastGradient"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="#2563EB"
                          stopOpacity={0.15}
                        />
                        <stop
                          offset="95%"
                          stopColor="#2563EB"
                          stopOpacity={0}
                        />
                      </linearGradient>
                      <linearGradient
                        id="historicalGradient"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="#64748B"
                          stopOpacity={0.1}
                        />
                        <stop
                          offset="95%"
                          stopColor="#64748B"
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>

                    {/* Risk Zones - Scientific Agri-Tech Palette */}
                    {/* Safe Zone: Soft Emerald (below threshold) */}
                    <ReferenceArea
                      y1={operationalBaseline}
                      y2={economicThreshold}
                      fill="#D1FAE5"
                      fillOpacity={0.4}
                      stroke="none"
                    />
                    {/* Danger Zone: Soft Rose (above threshold) */}
                    <ReferenceArea
                      y1={economicThreshold}
                      y2={yAxisDomain[1]}
                      fill="#FEE2E2"
                      fillOpacity={0.4}
                      stroke="none"
                    />

                    <CartesianGrid
                      vertical={false}
                      strokeDasharray="3 3"
                      stroke={chartColors.border}
                      opacity={0.4}
                    />

                    <XAxis
                      dataKey="date"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: chartColors.muted, fontSize: 11 }}
                      dy={10}
                      padding={{ left: 10, right: 10 }}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: chartColors.muted, fontSize: 11 }}
                      domain={yAxisDomain}
                      allowDecimals={false}
                      dx={-10}
                    />

                    <Tooltip
                      content={renderForecastTooltip}
                      cursor={{
                        stroke: chartColors.muted,
                        strokeWidth: 1,
                        strokeDasharray: "4 4",
                      }}
                    />

                    <Legend
                      verticalAlign="top"
                      height={40}
                      iconType="circle"
                      iconSize={8}
                      wrapperStyle={{
                        paddingBottom: "20px",
                        fontSize: "12px",
                        fontWeight: 500,
                      }}
                    />

                    {/* Critical Threshold - Alarm Red (the warning barrier) */}
                    <ReferenceLine
                      y={economicThreshold}
                      stroke="#DC2626"
                      strokeDasharray="4 4"
                      strokeWidth={2}
                      label={{
                        value: "CRITICAL THRESHOLD",
                        position: "top",
                        fill: "#DC2626",
                        fontSize: 14,
                        fontWeight: "bold",
                      }}
                    />

                    {/* Forecast Region Background */}
                    {forecastStartIndex !== -1 && (
                      <>
                        <ReferenceArea
                          x1={forecastSeries[forecastStartIndex]?.date}
                          x2={forecastSeries[forecastSeries.length - 1]?.date}
                          y1={0}
                          y2={yAxisDomain[1]}
                          stroke="transparent"
                          fill="url(#forecastRegionTint)"
                          isAnimationActive={false}
                        />
                        <ReferenceLine
                          x={forecastSeries[forecastStartIndex]?.date}
                          stroke={chartColors.muted}
                          strokeDasharray="3 3"
                          strokeOpacity={0.5}
                          label={{
                            value: "FORECAST START",
                            position: "insideTopLeft",
                            angle: -90,
                            fill: chartColors.muted,
                            fontSize: 10,
                            fontWeight: 600,
                            offset: 10,
                          }}
                        />
                      </>
                    )}

                    {/* Historical Data - Slate Gray (recedes visually) */}
                    <Area
                      type="monotone"
                      dataKey="actual"
                      stroke="#64748B"
                      strokeWidth={2}
                      fill="url(#historicalGradient)"
                      dot={{
                        r: 4,
                        fill: "#64748B",
                        strokeWidth: 2,
                        stroke: "#fff",
                      }}
                      activeDot={{ r: 4, strokeWidth: 2 }}
                      name="Historical Data"
                      connectNulls={false}
                      isAnimationActive={false}
                    />

                    {/* Confidence Band - Subtle Royal Blue tint */}
                    <Area
                      type="monotone"
                      dataKey="confidenceLower"
                      stackId="confidence"
                      stroke="none"
                      fill="transparent"
                      connectNulls={false}
                    />
                    <Area
                      type="monotone"
                      dataKey="confidenceBandHeight"
                      stackId="confidence"
                      stroke="none"
                      fill="#2563EB"
                      fillOpacity={0.08}
                      name="Confidence Range"
                      connectNulls={false}
                    />

                    {/* XGBoost Forecast - Royal Blue (the star prediction) */}
                    <Area
                      type="monotone"
                      dataKey="predicted"
                      stroke="#2563EB"
                      strokeWidth={3}
                      fill="url(#forecastGradient)"
                      dot={{
                        r: 4,
                        fill: "#2563EB",
                        strokeWidth: 2,
                        stroke: "#fff",
                      }}
                      activeDot={{ r: 6, strokeWidth: 0 }}
                      name="AI Forecast (XGBoost)"
                      connectNulls={false}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            )}
            <div className="mt-4 pt-3 border-t border-border">
              <p className="text-xs text-muted-foreground text-center">
                Powered by XGBoost Model (v1.0) | Mean Error Margin: ±0.35 bugs
              </p>
            </div>
          </Card>

          {/* Mini-Visuals Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Threshold Status Breakdown */}
            <Card className="p-6 relative overflow-hidden border border-border bg-white shadow-sm rounded-xl">
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-foreground">
                  Threshold Status
                </h3>
                <p className="text-base text-muted-foreground mt-1 font-medium">
                  Critical vs Warning Breakdown
                </p>
              </div>
              {thresholdStackData.summary.critical +
                thresholdStackData.summary.warning +
                thresholdStackData.summary.normal ===
              0 ? (
                <p className="text-base text-muted-foreground">
                  No status data available.
                </p>
              ) : (
                <div className="relative">
                  {/* Center Text Overlay */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-4">
                    <span className="text-3xl font-bold text-foreground">
                      {thresholdStackData.summary.critical +
                        thresholdStackData.summary.warning +
                        thresholdStackData.summary.normal}
                    </span>
                    <span className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
                      Total
                    </span>
                  </div>

                  <ResponsiveContainer width="100%" height={250}>
                    <RadialBarChart
                      innerRadius="65%"
                      outerRadius="100%"
                      barSize={16}
                      data={thresholdStackData.data}
                      startAngle={90}
                      endAngle={-270}
                    >
                      <RadialBar
                        background={{ fill: chartColors.muted, opacity: 0.1 }}
                        dataKey="count"
                        cornerRadius={10}
                      />
                      <Legend
                        iconSize={8}
                        layout="horizontal"
                        verticalAlign="bottom"
                        align="center"
                        wrapperStyle={{
                          fontSize: 11,
                          fontWeight: 500,
                          paddingTop: "20px",
                        }}
                      />
                      <Tooltip
                        cursor={false}
                        contentStyle={{
                          backgroundColor: chartColors.card,
                          border: `1px solid ${chartColors.border}`,
                          borderRadius: "12px",
                          boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                        }}
                      />
                    </RadialBarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </Card>

            {/* Action Tracker */}
            <Card className="p-6 relative overflow-hidden border border-border bg-white shadow-sm rounded-xl">
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-foreground">
                  Action Tracker
                </h3>
                <p className="text-base text-muted-foreground mt-1 font-medium">
                  Interventions taken by type
                </p>
              </div>
              {actionTrackerData.length === 0 ? (
                <p className="text-base text-muted-foreground">
                  No actions recorded in this period.
                </p>
              ) : (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart
                    data={actionTrackerData}
                    layout="vertical"
                    margin={{ top: 0, right: 30, left: 10, bottom: 0 }}
                    barSize={20}
                  >
                    <defs>
                      <linearGradient
                        id="actionGradient"
                        x1="0"
                        y1="0"
                        x2="1"
                        y2="0"
                      >
                        <stop
                          offset="0%"
                          stopColor="#7c3aed"
                          stopOpacity={0.8}
                        />
                        <stop
                          offset="100%"
                          stopColor="#9333ea"
                          stopOpacity={1}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke={chartColors.border}
                      opacity={0.3}
                      horizontal={false}
                    />
                    <XAxis type="number" hide />
                    <YAxis
                      type="category"
                      dataKey="type"
                      tick={{
                        fontSize: 11,
                        fill: chartColors.muted,
                        fontWeight: 600,
                      }}
                      width={100}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      cursor={{ fill: chartColors.muted, opacity: 0.05 }}
                      contentStyle={{
                        backgroundColor: chartColors.card,
                        border: `1px solid ${chartColors.border}`,
                        borderRadius: "8px",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                        padding: "8px 12px",
                      }}
                      itemStyle={{
                        fontSize: 12,
                        fontWeight: 600,
                        color: chartColors.foreground,
                      }}
                      labelStyle={{ display: "none" }}
                    />
                    <Bar
                      dataKey="value"
                      fill="url(#actionGradient)"
                      radius={[0, 6, 6, 0]}
                      background={{
                        fill: chartColors.muted,
                        opacity: 0.05,
                      }}
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </Card>

            {/* Recent Alerts - Now Premium Styled */}
            <Card className="p-6 relative overflow-hidden border border-border bg-white shadow-sm rounded-xl">
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-foreground">
                  Recent Alerts
                </h3>
                <p className="text-base text-muted-foreground mt-1 font-medium">
                  Latest critical notifications
                </p>
              </div>
              {recentCriticalAlerts.length === 0 ? (
                <p className="text-base text-muted-foreground">
                  No critical alerts right now.
                </p>
              ) : (
                <div className="space-y-3">
                  {recentCriticalAlerts.map((alert) => (
                    <div
                      key={alert.id}
                      className="flex items-start gap-3 p-3 rounded-lg bg-background/50 border border-border/40 hover:bg-background/80 transition-colors"
                    >
                      {alert.priority === "high" ? (
                        <div className="mt-0.5 p-1.5 rounded-full bg-red-100/50 text-red-600 dark:bg-red-900/20 dark:text-red-400">
                          <WarningTriangle className="h-4 w-4" />
                        </div>
                      ) : (
                        <div className="mt-0.5 p-1.5 rounded-full bg-amber-100/50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400">
                          <InfoCircle className="h-4 w-4" />
                        </div>
                      )}
                      <div>
                        <p className="text-base font-semibold text-foreground leading-none mb-1">
                          {alert.title}
                        </p>
                        <p className="text-sm text-muted-foreground leading-snug line-clamp-2">
                          {alert.message}
                        </p>
                        <p className="text-[11px] text-muted-foreground/60 mt-1.5 font-medium uppercase tracking-wider">
                          {new Date(alert.timestamp).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
