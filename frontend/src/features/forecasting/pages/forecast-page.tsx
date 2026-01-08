import { useState, useMemo, useEffect } from "react";
import { Card } from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { useDashboardStore } from "@/state/store";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
  ComposedChart,
  ReferenceLine,
  ReferenceArea,
  Bar,
  BarChart,
  Cell,
} from "recharts";
import {
  GraphUp,
  WarningTriangle,
  Calendar,
  Timer,
  Brain,
  Flash,
  CheckCircle,
} from "iconoir-react";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/shared/components/ui/alert";
import {
  chartAxisStyle,
  chartGridStyle,
  chartTooltipStyle,
} from "@/shared/components/charting/chart-styles";
import { useChartColors } from "@/shared/hooks/use-chart-colors";
import type { TooltipProps } from "recharts";
import type { DotProps } from "recharts";

export function ForecastEarlyWarning() {
  const [selectedPest, setSelectedPest] =
    useState<"Black Rice Bug">("Black Rice Bug");
  const [forecastDays, setForecastDays] = useState(7);
  const chartColors = useChartColors();
  
  // Detect dark mode for chart styling (reactive to theme changes)
  const [isDark, setIsDark] = useState(() => 
    typeof window !== "undefined" && document.documentElement.classList.contains("dark")
  );
  
  useEffect(() => {
    const checkTheme = () => {
      setIsDark(document.documentElement.classList.contains("dark"));
    };
    
    // Check on mount and when theme changes
    checkTheme();
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    
    return () => observer.disconnect();
  }, []);

  // Get data from store (100% backend data)
  const forecasts = useDashboardStore((state) => state.forecasts);
  const observations = useDashboardStore((state) => state.observations);
  const initialize = useDashboardStore((state) => state.initialize);
  const refreshData = useDashboardStore((state) => state.refreshData);
  const setForecastHorizon = useDashboardStore(
    (state) => state.setForecastHorizon
  );

  // Initialize data on mount
  useEffect(() => {
    initialize();
  }, [initialize]);

  // Update backend forecast horizon when forecastDays changes
  useEffect(() => {
    // Map forecastDays (7 or 14) to forecastHorizon
    const horizon = forecastDays as 7 | 14 | 30;
    setForecastHorizon(horizon);
    // Refetch data with new horizon
    refreshData();
  }, [forecastDays, setForecastHorizon, refreshData]);

  // Custom dot component for threshold-aware highlighting
  const ThresholdAwareDot = (props: DotProps & { payload?: any }) => {
    const { cx, cy, payload } = props;
    const exceedsThreshold = payload?.exceedsThreshold;

    if (cx === undefined || cy === undefined) return null;

    return (
      <circle
        cx={cx}
        cy={cy}
        r={exceedsThreshold ? 5 : 4}
        fill={exceedsThreshold ? chartColors.destructive : chartColors.chart2}
        stroke={exceedsThreshold ? chartColors.destructive : chartColors.chart2}
        strokeWidth={exceedsThreshold ? 2 : 1}
      />
    );
  };

  // Filter forecasts by selected pest and days
  // Sort by date to ensure correct order (in case forecasts aren't pre-sorted)
  const filteredForecasts = useMemo(() => {
    return forecasts
      .filter((f) => f.pestType === selectedPest)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(0, forecastDays);
  }, [forecasts, selectedPest, forecastDays]);

  // Define reference line values (Operational Baseline, Economic Threshold, Economic Injury Level)
  // Must be defined early as it's used in combinedData
  const referenceLines = useMemo(() => {
    const economicThreshold = selectedPest === "Black Rice Bug" ? 50 : 40;
    const economicInjuryLevel = economicThreshold * 1.5; // EIL is typically 1.5x ET
    const operationalBaseline = 0;

    return {
      operationalBaseline,
      economicThreshold,
      economicInjuryLevel,
    };
  }, [selectedPest]);

  // Historical data for comparison (last 30 days)
  const historicalData = useMemo(() => {
    const grouped: Record<
      string,
      { date: string; count: number; observations: number }
    > = {};

    const recentObs = observations
      .filter((o) => o.pestType === selectedPest)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 500); // Last observations

    recentObs.forEach((obs) => {
      if (!grouped[obs.date]) {
        grouped[obs.date] = { date: obs.date, count: 0, observations: 0 };
      }
      grouped[obs.date].count += obs.count;
      grouped[obs.date].observations += 1;
    });

    const sorted = Object.values(grouped)
      .map((g) => ({
        date: new Date(g.date).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        }),
        fullDate: g.date,
        actual: Math.round(g.count / g.observations),
        type: "historical" as const,
      }))
      .sort(
        (a, b) =>
          new Date(a.fullDate).getTime() - new Date(b.fullDate).getTime()
      );

    // Filter by date range (last 90 days from most recent date) instead of item count
    if (sorted.length === 0) return [];

    const mostRecentDate = new Date(sorted[sorted.length - 1].fullDate);
    const cutoffDate = new Date(mostRecentDate);
    cutoffDate.setDate(cutoffDate.getDate() - 90);

    return sorted.filter((item) => new Date(item.fullDate) >= cutoffDate);
  }, [observations, selectedPest]);

  // Calculate actual historical data range for subtitle
  const historicalDateRange = useMemo(() => {
    if (historicalData.length === 0) return 0;
    const firstDate = new Date(historicalData[0].fullDate);
    const lastDate = new Date(
      historicalData[historicalData.length - 1].fullDate
    );
    const diffTime = Math.abs(lastDate.getTime() - firstDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }, [historicalData]);

  // Combined historical + forecast data with continuity and proper scaling
  const combinedData = useMemo(() => {
    const threshold = referenceLines.economicThreshold;

    const historical = historicalData.map((h) => ({
      date: h.date,
      fullDate: h.fullDate,
      actual: h.actual,
      predicted: null as number | null,
      lowerBound: null as number | null,
      upperBound: null as number | null,
      confidenceLower: null as number | null,
      confidenceUpper: null as number | null,
      confidenceBandHeight: null as number | null,
      exceedsThreshold: false,
      isHistorical: true,
      isForecast: false,
    }));

    // Get last historical point for stitching
    const lastHistoricalPoint =
      historical.length > 0 ? historical[historical.length - 1] : null;
    const lastHistoricalValue = lastHistoricalPoint?.actual ?? 0;
    const lastHistoricalDate = lastHistoricalPoint?.fullDate ?? null;
    const firstForecast = filteredForecasts[0];

    // Validation: Check for forecast discontinuity
    if (
      firstForecast &&
      Math.abs(lastHistoricalValue - firstForecast.predicted) > threshold * 0.5
    ) {
      console.warn(
        `Forecast discontinuity detected: Historical=${lastHistoricalValue}, Forecast=${
          firstForecast.predicted
        }, Difference=${Math.abs(
          lastHistoricalValue - firstForecast.predicted
        )}`
      );
    }

    // Stitch forecast to historical: Add a bridge point at the last historical date
    // This closes the gap between historical and forecast lines
    const bridgePoint =
      lastHistoricalPoint && firstForecast
        ? {
            date: lastHistoricalPoint.date,
            fullDate: lastHistoricalPoint.fullDate,
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
            exceedsThreshold: lastHistoricalValue > threshold,
            isHistorical: false,
            isForecast: true, // Mark as forecast so it connects to forecast line
          }
        : null;

    const forecast = filteredForecasts.map((f) => {
      const lower = Math.max(0, f.lowerBound);
      const upper = Math.max(lower, f.upperBound);
      const bandHeight = upper - lower;
      // Clamp negative predictions to 0 - XGBoost can output negatives
      const predicted = Math.max(0, f.predicted);
      const exceedsThreshold = predicted > threshold;

      return {
        date: new Date(f.date).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        }),
        fullDate: f.date,
        actual: null as number | null,
        predicted: predicted,
        lowerBound: lower,
        upperBound: upper,
        confidenceLower: lower,
        confidenceUpper: upper,
        confidenceBandHeight: bandHeight,
        exceedsThreshold: exceedsThreshold,
        isHistorical: false,
        isForecast: true,
      };
    });

    // Stitch data: historical + bridge point + forecast
    return bridgePoint
      ? [...historical, bridgePoint, ...forecast]
      : [...historical, ...forecast];
  }, [historicalData, filteredForecasts, referenceLines.economicThreshold]);

  // Calculate Y-axis domain with padding (prevent auto-scaling to zero)
  const yAxisDomain = useMemo(() => {
    const allValues: number[] = [];

    combinedData.forEach((d) => {
      if (d.actual !== null) allValues.push(d.actual);
      if (d.predicted !== null) allValues.push(d.predicted);
      if (d.lowerBound !== null) allValues.push(d.lowerBound);
      if (d.upperBound !== null) allValues.push(d.upperBound);
    });

    // Always include threshold values to ensure they're visible
    allValues.push(
      referenceLines.economicThreshold,
      referenceLines.economicInjuryLevel
    );

    if (allValues.length === 0) return [0, 100];

    const min = Math.min(...allValues);
    const max = Math.max(...allValues);
    const range = max - min;
    const padding = range * 0.15; // 15% padding

    // Always start at 0 for correct perspective, round to integers
    return [0, Math.ceil(max + padding)];
  }, [combinedData, referenceLines]);

  // Find the index where forecast starts (for vertical divider)
  const forecastStartIndex = useMemo(() => {
    return combinedData.findIndex((d) => d.isForecast);
  }, [combinedData]);

  // Calculate risk metrics with improved risk classification logic
  const riskMetrics = useMemo(() => {
    const threshold = referenceLines.economicThreshold;
    const aboveThreshold = filteredForecasts.filter(
      (f) => f.predicted > threshold
    );
    const highRiskDays = filteredForecasts.filter(
      (f) => f.predicted > threshold * 1.5
    );
    const avgPredicted =
      filteredForecasts.reduce((sum, f) => sum + f.predicted, 0) /
      filteredForecasts.length;
    const peakDay = filteredForecasts.reduce(
      (max, f) => (f.predicted > max.predicted ? f : max),
      filteredForecasts[0]
    );

    // Enhanced risk classification based on upper confidence interval
    const maxUpperCI = Math.max(...filteredForecasts.map((f) => f.upperBound));
    const meanForecast = avgPredicted;

    let riskLevel: "Low" | "Moderate" | "High" = "Low";
    let confidenceLevel: "Low" | "Medium" | "High" = "Medium";

    // Risk classification logic: prioritize upper CI
    if (maxUpperCI > threshold) {
      riskLevel = "High";
    } else if (meanForecast > threshold) {
      riskLevel = "Moderate";
    } else {
      riskLevel = "Low";
    }

    // Confidence level based on CI width relative to threshold
    const avgCIWidth =
      filteredForecasts.reduce(
        (sum, f) => sum + (f.upperBound - f.lowerBound),
        0
      ) / filteredForecasts.length;
    if (avgCIWidth > threshold * 0.3) {
      confidenceLevel = "Low";
    } else if (avgCIWidth > threshold * 0.15) {
      confidenceLevel = "Medium";
    } else {
      confidenceLevel = "High";
    }

    return {
      daysAboveThreshold: aboveThreshold.length,
      highRiskDays: highRiskDays.length,
      avgPredicted: Number(avgPredicted.toFixed(1)),
      peakDay: peakDay
        ? {
            date: new Date(peakDay.date).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            }),
            count: Number(peakDay.predicted.toFixed(1)),
          }
        : null,
      riskLevel,
      confidenceLevel,
      threshold,
      maxUpperCI,
    };
  }, [filteredForecasts, selectedPest, referenceLines.economicThreshold]);

  // Suggested action mapping based on risk level
  const suggestedAction = useMemo(() => {
    const actionMap: Record<"Low" | "Moderate" | "High", string> = {
      Low: "Continue routine monitoring",
      Moderate: "Increase scouting frequency",
      High: "Prepare or apply control measures",
    };
    return actionMap[riskMetrics.riskLevel];
  }, [riskMetrics.riskLevel]);

  // Seasonal prediction based on historical data
  const seasonalPrediction = useMemo(() => {
    const seasonalCounts: Record<
      string,
      { count: number; observations: number }
    > = {
      Dry: { count: 0, observations: 0 },
      Wet: { count: 0, observations: 0 },
    };

    observations
      .filter((o) => o.pestType === selectedPest)
      .forEach((obs) => {
        seasonalCounts[obs.season].count += obs.count;
        seasonalCounts[obs.season].observations += 1;
      });

    const dryAvg =
      seasonalCounts["Dry"].observations > 0
        ? Math.round(
            seasonalCounts["Dry"].count / seasonalCounts["Dry"].observations
          )
        : 0;
    const wetAvg =
      seasonalCounts["Wet"].observations > 0
        ? Math.round(
            seasonalCounts["Wet"].count / seasonalCounts["Wet"].observations
          )
        : 0;

    return {
      peakSeason: wetAvg > dryAvg ? "Wet Season" : "Dry Season",
      dryAvg,
      wetAvg,
    };
  }, [observations, selectedPest]);

  // Recommended actions
  const recommendations = useMemo(() => {
    const actions: Array<{
      priority: "High" | "Medium" | "Low";
      action: string;
      reason: string;
    }> = [];

    if (riskMetrics.daysAboveThreshold > 0) {
      actions.push({
        priority: "High",
        action: "Prepare intervention resources",
        reason: `${riskMetrics.daysAboveThreshold} day(s) forecasted above threshold`,
      });
    }

    if (riskMetrics.highRiskDays > 0) {
      actions.push({
        priority: "High",
        action: "Schedule immediate field inspection",
        reason: `${riskMetrics.highRiskDays} day(s) with critically high pest count predicted`,
      });
    }

    if (riskMetrics.riskLevel === "High") {
      actions.push({
        priority: "High",
        action: "Activate emergency response protocol",
        reason: "Overall risk level is HIGH based on forecast",
      });
    }

    if (
      riskMetrics.peakDay &&
      riskMetrics.peakDay.count > riskMetrics.threshold
    ) {
      actions.push({
        priority: "Medium",
        action: `Target intervention on ${riskMetrics.peakDay.date}`,
        reason: `Peak pest activity predicted (${riskMetrics.peakDay.count.toFixed(
          1
        )} count)`,
      });
    }

    if (riskMetrics.avgPredicted > riskMetrics.threshold * 0.8) {
      actions.push({
        priority: "Medium",
        action: "Increase monitoring frequency",
        reason: "Average predicted count approaching threshold",
      });
    }

    if (actions.length === 0) {
      actions.push({
        priority: "Low",
        action: "Maintain regular monitoring",
        reason: "Forecast indicates normal pest levels",
      });
    }

    return actions;
  }, [riskMetrics]);

  // Confidence levels by day
  const confidenceData = useMemo(() => {
    return filteredForecasts.map((f) => ({
      date: new Date(f.date).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
      confidence: f.confidence,
    }));
  }, [filteredForecasts]);

  // Custom tooltip for forecast chart with enhanced context
  const ForecastTooltip = ({
    active,
    payload,
    label,
  }: TooltipProps<number, string>) => {
    if (!active || !payload || payload.length === 0) return null;

    const data = payload[0].payload;
    const isForecast = data?.isForecast;
    const threshold = referenceLines.economicThreshold;
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
      if (ciWidth > threshold * 0.3) return "Low";
      if (ciWidth > threshold * 0.15) return "Medium";
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
                      data.predicted > threshold * 0.7
                    ? "text-amber-600"
                    : "text-emerald-600"
                }`}
              >
                {data.exceedsThreshold
                  ? "High Risk (Apply Control Measure)"
                  : data.predicted !== null && data.predicted > threshold * 0.7
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

  return (
    <div className="p-3 md:p-6 space-y-4 md:space-y-6">
      {/* Controls */}
      <Card className="p-3 md:p-4">
        <div className="flex flex-col md:flex-row gap-3 md:gap-4">
          <div className="flex-1 space-y-2">
            <label className="text-sm text-muted-foreground">Pest Type</label>
            <Select
              value={selectedPest}
              onValueChange={(val: string) =>
                setSelectedPest(val as "Black Rice Bug")
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Black Rice Bug">Black Rice Bug</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex-1 space-y-2">
            <label className="text-sm text-muted-foreground">
              Forecast Period
            </label>
            <Select
              value={forecastDays.toString()}
              onValueChange={(val: string) => setForecastDays(parseInt(val))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">7 Days</SelectItem>
                <SelectItem value="14">14 Days</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* Risk Alert */}
      {riskMetrics.riskLevel === "High" && (
        <Alert variant="destructive">
          <WarningTriangle className="h-4 w-4" />
          <AlertTitle>High Risk Alert</AlertTitle>
          <AlertDescription>
            Forecast indicates {riskMetrics.daysAboveThreshold} day(s) above
            threshold in the next {forecastDays} days. Immediate action
            recommended.
          </AlertDescription>
        </Alert>
      )}

      {riskMetrics.riskLevel === "Moderate" && (
        <Alert className="border-warning bg-warning/10">
          <WarningTriangle className="h-4 w-4 text-warning" />
          <AlertTitle className="text-warning">Moderate Risk Alert</AlertTitle>
          <AlertDescription className="text-warning-foreground">
            Forecast shows elevated pest levels. Monitor closely and prepare
            intervention resources.
          </AlertDescription>
        </Alert>
      )}

      {/* Risk Metrics KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        <Card className="p-4">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Risk Level</p>
              <Badge
                variant={
                  riskMetrics.riskLevel === "High"
                    ? "destructive"
                    : riskMetrics.riskLevel === "Moderate"
                    ? "default"
                    : "outline"
                }
                className={
                  riskMetrics.riskLevel === "Moderate"
                    ? "bg-warning text-warning-foreground"
                    : ""
                }
              >
                {riskMetrics.riskLevel}
              </Badge>
            </div>
            <div className="p-2 rounded-lg bg-primary/10 text-primary transition-colors duration-300">
              <WarningTriangle className="h-5 w-5" />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">
                Days Above Threshold
              </p>
              <p className="text-2xl font-semibold">
                {riskMetrics.daysAboveThreshold}
              </p>
              <p className="text-xs text-muted-foreground">
                Next {forecastDays} days
              </p>
            </div>
            <div className="p-2 rounded-lg bg-primary/10 text-primary transition-colors duration-300">
              <Timer className="h-5 w-5" />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">High Risk Days</p>
              <p className="text-2xl font-semibold">
                {riskMetrics.highRiskDays}
              </p>
              <p className="text-xs text-muted-foreground">
                &gt;150% threshold
              </p>
            </div>
            <div className="p-2 rounded-lg bg-primary/10 text-primary transition-colors duration-300">
              <Flash className="h-5 w-5" />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Avg Predicted</p>
              <p className="text-2xl font-semibold">
                {riskMetrics.avgPredicted?.toFixed(1) || "0.0"}
              </p>
              <p className="text-xs text-muted-foreground">Pest count</p>
            </div>
            <div className="p-2 rounded-lg bg-primary/10 text-primary transition-colors duration-300">
              <GraphUp className="h-5 w-5" />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Peak Day</p>
              <p className="text-lg font-semibold truncate">
                {riskMetrics.peakDay?.date || "N/A"}
              </p>
              <p className="text-xs text-muted-foreground">
                Count: {riskMetrics.peakDay?.count?.toFixed(1) || "0.0"}
              </p>
            </div>
            <div className="p-2 rounded-lg bg-primary/10 text-primary transition-colors duration-300">
              <Calendar className="h-5 w-5" />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Threshold</p>
              <p className="text-2xl font-semibold">{riskMetrics.threshold}</p>
              <p className="text-xs text-muted-foreground">Economic limit</p>
            </div>
            <div className="p-2 rounded-lg bg-primary/10 text-primary transition-colors duration-300">
              <Brain className="h-5 w-5" />
            </div>
          </div>
        </Card>
      </div>

      {/* Forecast Visualization with Confidence Bands */}
      <Card className="p-4 rounded-xl border-border bg-card shadow-sm">
        <div className="mb-6 space-y-1">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-semibold text-lg text-foreground">
                  {forecastDays}-Day Pest Forecast (XGBoost)
                </h3>
                {(() => {
                  // Calculate max forecast value and determine risk
                  const forecastValues = filteredForecasts.map(
                    (f) => f.predicted
                  );
                  const maxValue = Math.max(...forecastValues, 0);
                  const maxDay = filteredForecasts.find(
                    (f) => f.predicted === maxValue
                  );
                  const threshold = referenceLines.economicThreshold;
                  const exceedsThreshold = maxValue > threshold;

                  if (exceedsThreshold && maxDay) {
                    const dayIndex = filteredForecasts.indexOf(maxDay) + 1;
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
                  } else if (maxValue > threshold * 0.7) {
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
              <p className="text-sm text-muted-foreground mt-1">
                Historical data (last {historicalDateRange} days) +{" "}
                {forecastDays}
                -day AI-powered prediction with upper/lower bounds using XGBoost
                model
              </p>
            </div>
          </div>

          {/* Risk Level and Suggested Action Display */}
          <div className="flex flex-wrap items-center gap-3 pt-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary/40 border border-border/50">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Next {forecastDays} Days Risk:
              </span>
              <Badge
                variant={
                  riskMetrics.riskLevel === "High"
                    ? "destructive"
                    : riskMetrics.riskLevel === "Moderate"
                    ? "default"
                    : "outline"
                }
                className={`text-xs px-2 py-0.5 ${
                  riskMetrics.riskLevel === "Moderate"
                    ? "bg-amber-100 text-amber-700 hover:bg-amber-200 border-amber-200"
                    : ""
                }`}
              >
                {riskMetrics.riskLevel.toUpperCase()}
              </Badge>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary/40 border border-border/50">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Uncertainty:
              </span>
              <span
                className={`text-xs font-bold ${
                  riskMetrics.confidenceLevel === "High"
                    ? "text-emerald-600"
                    : riskMetrics.confidenceLevel === "Medium"
                    ? "text-amber-600"
                    : "text-rose-600"
                }`}
              >
                {riskMetrics.confidenceLevel}
              </span>
            </div>

            {suggestedAction && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary/40 border border-border/50">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Suggested Action:
                </span>
                <span className="text-xs font-bold text-foreground">
                  {suggestedAction}
                </span>
              </div>
            )}
          </div>
        </div>
        {combinedData.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[380px] text-muted-foreground">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-3"></div>
            <p className="text-sm font-medium">Loading Forecast...</p>
            <p className="text-xs mt-1">
              Fetching XGBoost predictions from backend
            </p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={380}>
            <ComposedChart
              data={combinedData}
              margin={{ top: 3, right: 100, bottom: 3, left: 0 }}
            >
              <defs>
                {/* Subtle background tint for forecast region */}
                <linearGradient
                  id="forecastRegionTint"
                  x1="0"
                  x2="1"
                  y1="0"
                  y2="0"
                >
                  <stop
                    offset="0%"
                    stopColor={isDark ? "rgba(34, 211, 238, 0.03)" : "rgba(37, 99, 235, 0.03)"}
                    stopOpacity={1}
                  />
                  <stop
                    offset="100%"
                    stopColor={isDark ? "rgba(34, 211, 238, 0.08)" : "rgba(37, 99, 235, 0.08)"}
                    stopOpacity={1}
                  />
                </linearGradient>
                {/* Historical Data Gradient - Dimmed in dark mode */}
                <linearGradient
                  id="historicalMainGradient"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop offset="5%" stopColor="#64748B" stopOpacity={isDark ? 0.05 : 0.1} />
                  <stop offset="95%" stopColor="#64748B" stopOpacity={0} />
                </linearGradient>
                {/* Forecast Gradient - Neon Cyan for dark mode, Royal Blue for light */}
                <linearGradient
                  id="forecastMainGradient"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop offset="5%" stopColor={isDark ? "#22d3ee" : "#2563EB"} stopOpacity={isDark ? 0.08 : 0.15} />
                  <stop offset="95%" stopColor={isDark ? "#22d3ee" : "#2563EB"} stopOpacity={0} />
                </linearGradient>
                {/* Confidence Interval Gradient - Very subtle in dark mode (5-8% opacity) */}
                <linearGradient
                  id="confidenceIntervalGradient"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop offset="0%" stopColor={isDark ? "#22d3ee" : "#2563EB"} stopOpacity={isDark ? 0.08 : 0.08} />
                  <stop offset="100%" stopColor={isDark ? "#22d3ee" : "#2563EB"} stopOpacity={0} />
                </linearGradient>
              </defs>

              {/* Risk Zones - Adjusted for dark mode */}
              {/* Safe Zone: Soft Emerald (below threshold) - Darker in dark mode */}
              <ReferenceArea
                y1={referenceLines.operationalBaseline}
                y2={referenceLines.economicThreshold}
                fill={isDark ? "#064e3b" : "#D1FAE5"}
                fillOpacity={isDark ? 0.15 : 0.4}
                stroke="none"
              />

              {/* Danger Zone: Soft Rose (above threshold) - Darker in dark mode */}
              <ReferenceArea
                y1={referenceLines.economicThreshold}
                y2={yAxisDomain[1]}
                fill={isDark ? "#7f1d1d" : "#FEE2E2"}
                fillOpacity={isDark ? 0.15 : 0.4}
                stroke="none"
              />
              <CartesianGrid {...chartGridStyle} />
              <XAxis
                dataKey="date"
                {...chartAxisStyle}
                label={{
                  value: "Date",
                  position: "insideBottom",
                  offset: -3,
                  style: { fontSize: 11, fill: chartColors.muted },
                }}
              />
              <YAxis
                {...chartAxisStyle}
                domain={yAxisDomain}
                allowDecimals={false}
                label={{
                  value: "Pest Count",
                  angle: -90,
                  position: "insideLeft",
                  style: { fontSize: 12, fill: chartColors.muted },
                }}
              />
              <Area
                type="monotone"
                dataKey="confidenceLower"
                stackId="cb"
                stroke="none"
                fill="transparent"
                connectNulls={false}
                legendType="none"
                tooltipType="none"
                isAnimationActive={false}
              />
              {/* Confidence Band - Neon Cyan for dark mode, Royal Blue for light */}
              {/* In dark mode: Very subtle (5-8% opacity) to avoid heavy blocks */}
              <Area
                type="monotone"
                dataKey="confidenceBandHeight"
                stackId="cb"
                stroke="none"
                fill="url(#confidenceIntervalGradient)"
                fillOpacity={isDark ? 0.08 : 0.08}
                name="95% Confidence Interval"
                connectNulls={false}
                isAnimationActive={false}
              />

              {/* Historical Data - Dimmed Blue-Gray in dark mode (past data, pushed back visually) */}
              <Area
                type="monotone"
                dataKey="actual"
                stroke={isDark ? "#64748b" : "#64748B"}
                strokeWidth={2}
                fill="url(#historicalMainGradient)"
                name="Historical Data"
                connectNulls={false}
                activeDot={{ r: 4, strokeWidth: 2 }}
              />
              {/* XGBoost Forecast - Bright Neon Cyan in dark mode, Royal Blue for light */}
              <Area
                type="monotone"
                dataKey="predicted"
                stroke={isDark ? "#22d3ee" : "#2563EB"}
                strokeWidth={3}
                fill="url(#forecastMainGradient)"
                dot={{ r: 4, fill: isDark ? "#22d3ee" : "#2563EB", strokeWidth: 2, stroke: chartColors.card }}
                activeDot={{ r: 6, strokeWidth: 0 }}
                name="AI Forecast (XGBoost)"
                connectNulls={false}
              />

              {/* Critical Threshold - Neon Pink/Coral for dark mode (high contrast), Alarm Red for light */}
              <ReferenceLine
                y={referenceLines.economicThreshold}
                stroke={isDark ? "#fb7185" : "#DC2626"}
                strokeDasharray="5 5"
                strokeWidth={2}
                label={{
                  value: "CRITICAL THRESHOLD",
                  position: "top",
                  fill: isDark ? "#fb7185" : "#DC2626",
                  fontSize: 14,
                  fontWeight: "bold",
                }}
              />
              <ReferenceLine
                y={referenceLines.economicInjuryLevel}
                stroke={isDark ? "#fb7185" : chartColors.destructive}
                strokeDasharray="5 5"
                strokeWidth={1.5}
                label={{
                  value: "Economic Injury Level",
                  position: "insideTopRight",
                  fill: isDark ? "#fb7185" : chartColors.destructive,
                  fontSize: 10,
                  fontWeight: 600,
                  dy: -10,
                }}
              />

              <Tooltip content={<ForecastTooltip />} />
              <Legend verticalAlign="top" height={36} />
              {forecastStartIndex !== -1 && (
                <>
                  <ReferenceArea
                    x1={combinedData[forecastStartIndex]?.date}
                    x2={combinedData[combinedData.length - 1]?.date}
                    y1={0}
                    y2={
                      yAxisDomain && yAxisDomain.length > 1
                        ? yAxisDomain[1]
                        : undefined
                    }
                    stroke="transparent"
                    fill="url(#forecastRegionTint)"
                    isAnimationActive={false}
                  />
                  <ReferenceLine
                    x={combinedData[forecastStartIndex]?.date}
                    stroke={chartColors.muted}
                    strokeDasharray="3 3"
                    strokeOpacity={0.5}
                    label={{
                      value: "FORECAST START",
                      fill: chartColors.muted,
                      fontSize: 9,
                      position: "insideTopLeft",
                      fontWeight: 600,
                      angle: -90,
                      offset: 10,
                    }}
                  />
                </>
              )}
            </ComposedChart>
          </ResponsiveContainer>
        )}
        <div className="mt-4 pt-3 border-t border-border">
          <p className="text-xs text-muted-foreground text-center">
            Powered by XGBoost Model (v1.0) | Mean Error Margin: ±0.35 bugs
          </p>
        </div>
      </Card>

      {/* Forecast Confidence & Seasonal Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Confidence Levels */}
        <Card className="p-6">
          <div className="mb-4">
            <h3 className="font-medium">XGBoost Forecast Confidence by Day</h3>
            <p className="text-sm text-muted-foreground">
              XGBoost model prediction confidence levels (decreases with time)
            </p>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={confidenceData}>
              <CartesianGrid {...chartGridStyle} />
              <XAxis dataKey="date" {...chartAxisStyle} />
              <YAxis domain={[0, 100]} {...chartAxisStyle} />
              <Tooltip {...chartTooltipStyle} />
              <Bar
                dataKey="confidence"
                fill={chartColors.primary}
                radius={[6, 6, 0, 0]}
              >
                {confidenceData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={
                      entry.confidence >= 90
                        ? chartColors.success
                        : entry.confidence >= 85
                        ? chartColors.warning
                        : chartColors.destructive
                    }
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Seasonal Prediction */}
        <Card className="p-6">
          <div className="mb-4">
            <h3 className="font-medium">Seasonal Pattern Insight</h3>
            <p className="text-sm text-muted-foreground">
              Historical seasonal pest activity for {selectedPest}
            </p>
          </div>
          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-muted/50">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">
                  Expected Peak Season
                </span>
                <Badge>{seasonalPrediction.peakSeason}</Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                Based on historical data analysis
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-lg border">
                <p className="text-sm text-muted-foreground mb-1">
                  Dry Season Avg
                </p>
                <p className="text-2xl font-semibold">
                  {seasonalPrediction.dryAvg}
                </p>
                <p className="text-xs text-muted-foreground mt-1">pest count</p>
              </div>
              <div className="p-4 rounded-lg border">
                <p className="text-sm text-muted-foreground mb-1">
                  Wet Season Avg
                </p>
                <p className="text-2xl font-semibold">
                  {seasonalPrediction.wetAvg}
                </p>
                <p className="text-xs text-muted-foreground mt-1">pest count</p>
              </div>
            </div>

            <div className="p-4 rounded-lg bg-primary/10">
              <p className="text-sm font-medium mb-1">Predicted Risk Level</p>
              <div className="flex items-center gap-2">
                <Badge
                  variant={
                    riskMetrics.riskLevel === "High"
                      ? "destructive"
                      : riskMetrics.riskLevel === "Moderate"
                      ? "default"
                      : "outline"
                  }
                  className={
                    riskMetrics.riskLevel === "Moderate"
                      ? "bg-warning text-warning-foreground"
                      : ""
                  }
                >
                  {riskMetrics.riskLevel}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  for next {forecastDays} days
                </span>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Recommended Actions */}
      <Card className="p-6">
        <div className="mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-full bg-indigo-100 text-indigo-600">
              <Brain className="h-4 w-4" />
            </div>
            <h3 className="font-medium">Recommended Actions & Alerts</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            Proactive intervention recommendations based on XGBoost AI forecast
            predictions
          </p>
        </div>
        <div className="space-y-3">
          {recommendations.map((rec, idx) => (
            <div
              key={idx}
              className={`p-4 rounded-lg border-l-4 ${
                rec.priority === "High"
                  ? "border-l-destructive bg-destructive/5"
                  : rec.priority === "Medium"
                  ? "border-l-warning bg-warning/5"
                  : "border-l-muted bg-muted/5"
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge
                      variant={
                        rec.priority === "High" ? "destructive" : "outline"
                      }
                      className={
                        rec.priority === "Medium"
                          ? "bg-warning text-warning-foreground"
                          : ""
                      }
                    >
                      {rec.priority} Priority
                    </Badge>
                    <h4 className="font-medium">{rec.action}</h4>
                  </div>
                  <p className="text-sm text-muted-foreground">{rec.reason}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
