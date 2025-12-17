import { useState, useMemo } from "react";
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
import { getForecastData, getObservations } from "@/shared/lib/data-service";
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
  TrendingUp,
  AlertTriangle,
  Calendar,
  Target,
  Brain,
  Zap,
} from "lucide-react";
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

  const forecasts = useMemo(() => getForecastData(), []);
  const observations = useMemo(() => getObservations(), []);

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
      const predicted = f.predicted;
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

    if (allValues.length === 0) return [0, 100];

    const min = Math.min(...allValues);
    const max = Math.max(...allValues);
    const range = max - min;
    const padding = range * 0.15; // 15% padding

    // Round to integers to prevent decimal ticks on Y-axis
    return [Math.max(0, Math.floor(min - padding)), Math.ceil(max + padding)];
  }, [combinedData]);

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
      avgPredicted: Math.round(avgPredicted),
      peakDay: peakDay
        ? {
            date: new Date(peakDay.date).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            }),
            count: peakDay.predicted,
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
        reason: `Peak pest activity predicted (${riskMetrics.peakDay.count} count)`,
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
              <p className="text-xs text-muted-foreground">
                Forecasted Pest Count
              </p>
              <p
                className="text-sm font-semibold"
                style={{
                  color: data.exceedsThreshold
                    ? chartColors.destructive
                    : chartColors.chart2,
                }}
              >
                {data.predicted !== null && data.predicted !== undefined
                  ? data.predicted
                  : "N/A"}
                {data.exceedsThreshold && (
                  <span className="ml-1 text-xs">⚠️</span>
                )}
              </p>
              {exceedsThreshold && (
                <p className="text-xs text-destructive font-medium mt-1">
                  Exceeds Economic Threshold (ET: {threshold})
                </p>
              )}
            </div>
            {data.confidenceLower !== null && data.confidenceUpper !== null && (
              <>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">
                    Confidence Range
                  </p>
                  <p className="text-xs font-mono">
                    {data.confidenceLower} - {data.confidenceUpper}
                  </p>
                </div>
                {confidenceLevel && (
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">
                      Confidence Level
                    </p>
                    <p className="text-xs font-medium">{confidenceLevel}</p>
                  </div>
                )}
              </>
            )}
            <p className="text-xs text-muted-foreground italic mt-2 pt-1 border-t border-border">
              Forecast (uncertain)
            </p>
          </>
        ) : (
          <>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Actual Pest Count</p>
              <p className="text-sm font-semibold" style={{ color: "#3b82f6" }}>
                {data.actual !== null && data.actual !== undefined
                  ? data.actual
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
    <div className="p-6 space-y-6">
      {/* Controls */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row gap-4">
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
          <AlertTriangle className="h-4 w-4" />
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
          <AlertTriangle className="h-4 w-4 text-warning" />
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
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
              <AlertTriangle className="h-4 w-4 text-primary" />
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
            <div className="h-8 w-8 rounded-full bg-destructive/10 flex items-center justify-center">
              <Target className="h-4 w-4 text-destructive" />
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
            <div className="h-8 w-8 rounded-full bg-chart-3/10 flex items-center justify-center">
              <Zap className="h-4 w-4 text-chart-3" />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Avg Predicted</p>
              <p className="text-2xl font-semibold">
                {riskMetrics.avgPredicted}
              </p>
              <p className="text-xs text-muted-foreground">Pest count</p>
            </div>
            <div className="h-8 w-8 rounded-full bg-chart-2/10 flex items-center justify-center">
              <TrendingUp className="h-4 w-4 text-chart-2" />
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
                Count: {riskMetrics.peakDay?.count || 0}
              </p>
            </div>
            <div className="h-8 w-8 rounded-full bg-chart-4/10 flex items-center justify-center">
              <Calendar className="h-4 w-4 text-chart-4" />
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
            <div className="h-8 w-8 rounded-full bg-success/10 flex items-center justify-center">
              <Brain className="h-4 w-4 text-success" />
            </div>
          </div>
        </Card>
      </div>

      {/* Forecast Visualization with Confidence Bands */}
      <Card className="p-4">
        <div className="mb-3 space-y-2">
          <div>
            <h3 className="font-medium text-base">
              SARIMA Forecast with Confidence Interval
            </h3>
            <p className="text-xs text-muted-foreground">
              Historical data (last {historicalDateRange} days) + {forecastDays}
              -day prediction with upper/lower bounds
            </p>
          </div>

          {/* Risk Level and Suggested Action Display */}
          <div className="flex flex-wrap items-center gap-3 p-2 rounded-lg bg-muted/30 border border-border">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-muted-foreground">
                Next {forecastDays} Days Risk Level:
              </span>
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
                {riskMetrics.riskLevel.toUpperCase()}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-muted-foreground">
                Model Uncertainty:
              </span>
              <Badge variant="outline">
                {riskMetrics.confidenceLevel === "Low"
                  ? "High Range"
                  : riskMetrics.confidenceLevel === "Medium"
                  ? "Moderate Range"
                  : "Low Range"}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-muted-foreground">
                Suggested Action:
              </span>
              <span className="text-xs font-semibold">{suggestedAction}</span>
            </div>
          </div>
        </div>
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
                  stopColor="rgba(139, 92, 246, 0.03)"
                  stopOpacity={1}
                />
                <stop
                  offset="100%"
                  stopColor="rgba(139, 92, 246, 0.08)"
                  stopOpacity={1}
                />
              </linearGradient>
            </defs>

            {/* Background zones for risk regions - rendered first so they appear behind data */}
            {/* Green zone: below Economic Threshold (safe region) */}
            <ReferenceArea
              y1={referenceLines.operationalBaseline}
              y2={referenceLines.economicThreshold}
              fill={chartColors.success || "#10b981"}
              fillOpacity={0.08}
              stroke="none"
            />

            {/* Yellow zone: between Economic Threshold and Economic Injury Level (warning region) */}
            <ReferenceArea
              y1={referenceLines.economicThreshold}
              y2={referenceLines.economicInjuryLevel}
              fill={chartColors.warning || "#f59e0b"}
              fillOpacity={0.08}
              stroke="none"
            />

            {/* Red zone: above Economic Injury Level (damage region) */}
            <ReferenceArea
              y1={referenceLines.economicInjuryLevel}
              y2={yAxisDomain[1]}
              fill={chartColors.destructive}
              fillOpacity={0.08}
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
                style: { fontSize: 11, fill: chartColors.muted },
              }}
            />
            <Tooltip content={<ForecastTooltip />} />
            <Legend
              verticalAlign="top"
              height={28}
              iconType="line"
              formatter={(value, entry) => {
                // Custom icon for Confidence Interval
                if (value === "95% Confidence Interval") {
                  return (
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "4px",
                      }}
                    >
                      <span
                        style={{
                          display: "inline-block",
                          width: "12px",
                          height: "12px",
                          backgroundColor: entry.color || chartColors.chart2,
                          borderRadius: "2px",
                        }}
                      />
                      {value}
                    </span>
                  );
                }
                return value;
              }}
            />

            {/* Operational Baseline - thin solid gray line */}
            <ReferenceLine
              y={referenceLines.operationalBaseline}
              stroke={chartColors.muted}
              strokeWidth={1}
              label={{
                value: "Baseline",
                fill: chartColors.muted,
                fontSize: 10,
                position: "right",
                offset: 10,
              }}
            />

            {/* Economic Threshold (ET) - red dashed line */}
            <ReferenceLine
              y={referenceLines.economicThreshold}
              stroke={chartColors.destructive}
              strokeDasharray="5 5"
              strokeWidth={2}
              label={{
                value: "ET",
                fill: chartColors.destructive,
                fontSize: 11,
                position: "right",
                offset: 10,
                fontWeight: "500",
              }}
            />

            {/* Economic Injury Level (EIL) - dark red solid line */}
            <ReferenceLine
              y={referenceLines.economicInjuryLevel}
              stroke="#dc2626"
              strokeWidth={2}
              label={{
                value: "EIL",
                fill: "#dc2626",
                fontSize: 11,
                position: "right",
                offset: 10,
                fontWeight: "500",
              }}
            />

            {/* Vertical divider at forecast start - Clear Forecast Boundary */}
            {forecastStartIndex >= 0 && (
              <ReferenceLine
                x={combinedData[forecastStartIndex]?.date}
                stroke={chartColors.muted}
                strokeDasharray="4 4"
                strokeWidth={2}
                label={{
                  value: "Forecast Starts",
                  fill: chartColors.muted,
                  fontSize: 11,
                  position: "top",
                  offset: 8,
                  fontWeight: "500",
                }}
              />
            )}

            {/* Confidence interval band (shaded area) - Reduced visual dominance */}
            <Area
              type="monotone"
              dataKey="confidenceLower"
              stackId="confidenceBand"
              stroke="none"
              fill="transparent"
              isAnimationActive={false}
            />
            <Area
              type="monotone"
              dataKey="confidenceBandHeight"
              stackId="confidenceBand"
              stroke="none"
              fill={chartColors.chart2}
              fillOpacity={0.2}
              isAnimationActive={false}
              name="95% Confidence Interval"
              legendType="rect"
            />

            {/* Historical actual data - solid blue line */}
            <Line
              type="monotone"
              dataKey="actual"
              stroke="#3b82f6"
              strokeWidth={3}
              dot={{ r: 3, fill: "#3b82f6" }}
              name="Historical"
              connectNulls={false}
              strokeOpacity={1}
            />

            {/* Forecast prediction - dashed line with threshold-aware dot highlighting */}
            <Line
              type="monotone"
              dataKey="predicted"
              stroke={chartColors.chart2}
              strokeWidth={3}
              strokeDasharray="8 4"
              dot={<ThresholdAwareDot />}
              name={`Forecast (${forecastDays} days)`}
              connectNulls={false}
              strokeOpacity={1}
            />

            {/* Subtle background tint for forecast region */}
            {forecastStartIndex >= 0 && (
              <Area
                type="monotone"
                dataKey={(entry: any) => {
                  const idx = combinedData.indexOf(entry);
                  if (idx >= forecastStartIndex) {
                    return yAxisDomain[1];
                  }
                  return null;
                }}
                stroke="transparent"
                fill="url(#forecastRegionTint)"
                isAnimationActive={false}
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </Card>

      {/* Forecast Confidence & Seasonal Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Confidence Levels */}
        <Card className="p-6">
          <div className="mb-4">
            <h3 className="font-medium">Forecast Confidence by Day</h3>
            <p className="text-sm text-muted-foreground">
              Model prediction confidence (decreases with time)
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
          <h3 className="font-medium flex items-center gap-2">
            <Target className="h-4 w-4" />
            Recommended Actions & Alerts
          </h3>
          <p className="text-sm text-muted-foreground">
            Proactive intervention recommendations based on forecast
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
