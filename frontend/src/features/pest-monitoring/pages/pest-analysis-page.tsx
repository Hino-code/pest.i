import { useState, useMemo, useEffect } from "react";
import { Card } from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import { SharedFilters } from "@/shared/components/filters/shared-filters";
import type { FilterValues } from "@/shared/types/filters";
import { filterObservations } from "@/shared/lib/data-service";
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
  BarChart,
  Bar,
  AreaChart,
  Area,
  ComposedChart,
  ReferenceLine,
  ReferenceDot,
  Cell,
  Scatter,
  ScatterChart,
  ZAxis,
} from "recharts";
import {
  TrendingUp,
  Calendar,
  Layers,
  AlertCircle,
  Activity,
} from "lucide-react";
import {
  chartAxisStyle,
  chartGridStyle,
  chartTooltipStyle,
} from "@/shared/components/charting/chart-styles";
import { useChartColors } from "@/shared/hooks/use-chart-colors";
import React from "react";

export function PestAnalysis() {
  const [filters, setFilters] = useState<FilterValues>({
    year: new Date().getFullYear(),
    season: "All",
    fieldStage: "All",
    pestType: "All",
    dateRange: {
      start: new Date(new Date().getFullYear(), 0, 1),
      end: new Date(),
    },
    thresholdStatus: "All",
    actionStatus: "All",
  });
  const chartColors = useChartColors();

  const { observations: storeObservations, initialize } = useDashboardStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  const allObservations = storeObservations;
  const filteredData = useMemo(
    () =>
      filterObservations(allObservations, {
        ...filters,
        dateRange: filters.dateRange || undefined,
      }),
    [allObservations, filters]
  );

  // Time-Series Data with Moving Average (Black Rice Bug only)
  const timeSeriesData = useMemo(() => {
    const grouped: Record<
      string,
      { date: string; rbb: number; count: number }
    > = {};

    filteredData.forEach((obs) => {
      if (!grouped[obs.date]) {
        grouped[obs.date] = { date: obs.date, rbb: 0, count: 0 };
      }
      grouped[obs.date].rbb += obs.count;
      grouped[obs.date].count += 1;
    });

    const sorted = Object.values(grouped)
      .map((g) => ({
        date: new Date(g.date).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        }),
        fullDate: g.date,
        rbb: Math.round(g.rbb / g.count),
        threshold: 50,
      }))
      .sort(
        (a, b) =>
          new Date(a.fullDate).getTime() - new Date(b.fullDate).getTime()
      );

    const withMA = sorted.map((item, index) => {
      const start = Math.max(0, index - 6);
      const slice = sorted.slice(start, index + 1);
      const rbbMA = Math.round(
        slice.reduce((sum, s) => sum + s.rbb, 0) / slice.length
      );
      return { ...item, rbbMA };
    });

    return withMA.slice(-60); // Last 60 days
  }, [filteredData]);

  // Seasonal Analysis -> derive current season and average
  const seasonalSummary = useMemo(() => {
    const seasonal: Record<
      string,
      { season: string; rbb: number; count: number }
    > = {
      Dry: { season: "Dry", rbb: 0, count: 0 },
      Wet: { season: "Wet", rbb: 0, count: 0 },
    };

    filteredData.forEach((obs) => {
      if (seasonal[obs.season]) {
        seasonal[obs.season].count += 1;
        seasonal[obs.season].rbb += obs.count;
      }
    });

    const currentSeason =
      filteredData.length > 0
        ? filteredData[filteredData.length - 1].season
        : "Dry";

    const active = seasonal[currentSeason];
    const avgCount =
      active && active.count > 0 ? Math.round(active.rbb / active.count) : 0;

    return {
      currentSeason,
      avgCount,
      totalRecords: active?.count ?? 0,
    };
  }, [filteredData]);

  // Field Stage Analysis
  const stageData = useMemo(() => {
    const stages: Record<
      string,
      { stage: string; rbb: number; count: number }
    > = {};

    // Initialize stages dynamically from observations
    filteredData.forEach((obs) => {
      if (!stages[obs.fieldStage]) {
        stages[obs.fieldStage] = {
          stage: obs.fieldStage,
          rbb: 0,
          count: 0,
        };
      }
    });

    // Count observations by stage
    filteredData.forEach((obs) => {
      if (stages[obs.fieldStage]) {
        stages[obs.fieldStage].count += 1;
        stages[obs.fieldStage].rbb += obs.count;
      }
    });

    return Object.values(stages).map((s) => ({
      stage: s.stage,
      "Black Rice Bug": s.count > 0 ? Math.round(s.rbb / s.count) : 0,
      observations: s.count,
    }));
  }, [filteredData]);

  // Distribution Data
  const distributionData = useMemo(() => {
    const bins: Record<string, number> = {
      "0-20": 0,
      "21-40": 0,
      "41-60": 0,
      "61-80": 0,
      "81-100": 0,
      "100+": 0,
    };

    filteredData.forEach((obs) => {
      if (obs.count <= 20) bins["0-20"]++;
      else if (obs.count <= 40) bins["21-40"]++;
      else if (obs.count <= 60) bins["41-60"]++;
      else if (obs.count <= 80) bins["61-80"]++;
      else if (obs.count <= 100) bins["81-100"]++;
      else bins["100+"]++;
    });

    return Object.entries(bins).map(([range, count]) => ({ range, count }));
  }, [filteredData]);

  // Threshold Crossings by Month
  const thresholdByMonth = useMemo(() => {
    const monthly: Record<string, number> = {};

    filteredData.forEach((obs) => {
      if (obs.aboveThreshold) {
        const month = new Date(obs.date).toLocaleDateString("en-US", {
          month: "short",
          year: "2-digit",
        });
        monthly[month] = (monthly[month] || 0) + 1;
      }
    });

    return Object.entries(monthly)
      .map(([month, count]) => ({ month, count }))
      .sort(
        (a, b) => new Date(a.month).getTime() - new Date(b.month).getTime()
      );
  }, [filteredData]);

  const maxThresholdCount = useMemo(() => {
    if (thresholdByMonth.length === 0) return 0;
    return Math.max(...thresholdByMonth.map((d) => d.count));
  }, [thresholdByMonth]);

  // Growth rate vs last week (average count per observation)
  const growthRate = useMemo(() => {
    if (filteredData.length === 0) return 0;
    const now = new Date();
    const weekMs = 7 * 24 * 60 * 60 * 1000;
    const thisWeek = filteredData.filter(
      (o) => new Date(o.date).getTime() >= now.getTime() - weekMs
    );
    const lastWeek = filteredData.filter((o) => {
      const t = new Date(o.date).getTime();
      return t < now.getTime() - weekMs && t >= now.getTime() - 2 * weekMs;
    });
    const avg = (arr: typeof filteredData) =>
      arr.length > 0
        ? Math.round(arr.reduce((sum, o) => sum + o.count, 0) / arr.length)
        : 0;
    const currentAvg = avg(thisWeek);
    const prevAvg = avg(lastWeek);
    if (prevAvg === 0) return currentAvg > 0 ? 100 : 0;
    return Math.round(((currentAvg - prevAvg) / prevAvg) * 100);
  }, [filteredData]);

  // Most vulnerable stage (highest average count)
  const mostVulnerableStage = useMemo(() => {
    if (stageData.length === 0) return { stage: "N/A", avg: 0 };
    return stageData.reduce(
      (max, curr) =>
        curr["Black Rice Bug"] > max["Black Rice Bug"] ? curr : max,
      stageData[0]
    );
  }, [stageData]);

  // Correlation: Pest Count vs derived Days After Sowing (DAS)
  const scatterData = useMemo(() => {
    if (filteredData.length === 0) return [];
    const sorted = [...filteredData].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    const base = new Date(sorted[0].date).getTime();
    const dayMs = 24 * 60 * 60 * 1000;
    return sorted.map((obs) => {
      const das = Math.max(
        0,
        Math.round((new Date(obs.date).getTime() - base) / dayMs)
      );
      return {
        das,
        count: obs.count,
        fieldStage: obs.fieldStage,
        dateLabel: new Date(obs.date).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        }),
      };
    });
  }, [filteredData]);

  // Peaks for annotations
  const peakPoints = useMemo(() => {
    if (timeSeriesData.length === 0) {
      return { rbbPeak: null, rbbMAPeak: null };
    }
    const rbbPeak = timeSeriesData.reduce(
      (max, curr) => (curr.rbb > max.rbb ? curr : max),
      timeSeriesData[0]
    );
    const rbbMAPeak = timeSeriesData.reduce(
      (max, curr) => (curr.rbbMA > max.rbbMA ? curr : max),
      timeSeriesData[0]
    );
    return { rbbPeak, rbbMAPeak };
  }, [timeSeriesData]);

  return (
    <div className="p-6 space-y-6">
      {/* Filters */}
      <SharedFilters filters={filters} onFilterChange={setFilters} compact />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4 border border-border shadow-none">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Peak Count</p>
              <p className="text-xl font-semibold">
                {Math.max(...filteredData.map((o) => o.count), 0)}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4 border border-border shadow-none">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-chart-6/10 flex items-center justify-center">
              <Activity className="h-5 w-5 text-chart-6" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Growth Rate</p>
              <p className="text-xl font-semibold">
                {growthRate > 0 ? "+" : ""}
                {growthRate}% vs last week
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4 border border-border shadow-none">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-chart-3/10 flex items-center justify-center">
              <Layers className="h-5 w-5 text-chart-3" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">
                Most Vulnerable Stage
              </p>
              <p className="text-xl font-semibold">
                {mostVulnerableStage.stage}
              </p>
              <p className="text-xs text-muted-foreground">
                Avg count: {mostVulnerableStage["Black Rice Bug"]}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-destructive/10 flex items-center justify-center">
              <AlertCircle className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Threshold Events</p>
              <p className="text-xl font-semibold">
                {filteredData.filter((o) => o.aboveThreshold).length}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Time-Series Analysis */}
      <Card className="p-6 border border-border shadow-none">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Pest Count Over Time with Threshold
            </h3>
            <p className="text-sm text-muted-foreground">
              Daily average pest count with 7-day moving average
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <div className="flex items-center gap-1">
              <span
                className="inline-block h-2 w-2 rounded-full"
                style={{ background: chartColors.chart6 }}
              />
              <span className="text-foreground">Observed</span>
            </div>
            <div className="flex items-center gap-1">
              <span
                className="inline-block h-2 w-2 rounded-full"
                style={{ background: chartColors.chart2 }}
              />
              <span className="text-foreground">7-Day Avg</span>
            </div>
            <div className="flex items-center gap-1">
              <span
                className="inline-block h-[2px] w-4 border-t border-dashed"
                style={{ borderColor: chartColors.destructive }}
              />
              <span className="text-foreground">Threshold</span>
            </div>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={400}>
          <ComposedChart
            data={timeSeriesData}
            margin={{ top: 5, right: 20, bottom: 5, left: 0 }}
          >
            <CartesianGrid {...chartGridStyle} />
            <XAxis
              dataKey="date"
              {...chartAxisStyle}
              interval="preserveStartEnd"
            />
            <YAxis {...chartAxisStyle} />
            <Tooltip {...chartTooltipStyle} />
            <ReferenceLine
              y={50}
              stroke={chartColors.destructive}
              strokeDasharray="5 5"
              label={{
                value: "Threshold",
                fill: chartColors.destructive,
                fontSize: 11,
              }}
            />
            <Area
              type="monotone"
              dataKey="rbb"
              fill={chartColors.chart6}
              stroke={chartColors.chart6}
              fillOpacity={0.18}
              name="Black Rice Bug"
            />
            <Line
              type="monotone"
              dataKey="rbbMA"
              stroke={chartColors.chart2}
              strokeWidth={3}
              dot={false}
              name="7-Day Moving Avg"
            />
            {peakPoints.rbbPeak && (
              <ReferenceDot
                x={peakPoints.rbbPeak.date}
                y={peakPoints.rbbPeak.rbb}
                r={6}
                fill={chartColors.chart1}
                stroke={chartColors.chart1}
                strokeWidth={2}
              />
            )}
            {peakPoints.rbbPeak && (
              <ReferenceLine
                x={peakPoints.rbbPeak.date}
                stroke={chartColors.chart1}
                strokeDasharray="3 3"
                label={{
                  value: `Peak: ${peakPoints.rbbPeak.rbb}`,
                  position: "top",
                  fill: chartColors.chart1,
                  fontSize: 11,
                }}
              />
            )}
            {peakPoints.rbbMAPeak && (
              <ReferenceDot
                x={peakPoints.rbbMAPeak.date}
                y={peakPoints.rbbMAPeak.rbbMA}
                r={6}
                fill={chartColors.chart1}
                stroke={chartColors.chart1}
                strokeWidth={2}
              />
            )}
            {peakPoints.rbbMAPeak && (
              <ReferenceLine
                x={peakPoints.rbbMAPeak.date}
                stroke={chartColors.chart1}
                strokeDasharray="3 3"
                label={{
                  value: `MA Peak: ${peakPoints.rbbMAPeak.rbbMA}`,
                  position: "top",
                  fill: chartColors.chart1,
                  fontSize: 11,
                }}
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </Card>

      {/* Stage Analysis full width */}
      <div className="grid grid-cols-1 gap-6">
        <Card className="p-6 border border-border shadow-none">
          <div className="mb-4">
            <h3 className="text-lg font-semibold">Pest Count by Field Stage</h3>
            <p className="text-sm text-muted-foreground">
              Growth stage comparison
            </p>
          </div>
          <ResponsiveContainer width="100%" height={340}>
            <BarChart data={stageData}>
              <CartesianGrid {...chartGridStyle} />
              <XAxis dataKey="stage" {...chartAxisStyle} />
              <YAxis {...chartAxisStyle} />
              <Tooltip {...chartTooltipStyle} />
              <Legend />
              <Bar
                dataKey="Black Rice Bug"
                fill={chartColors.chart1}
                radius={[8, 8, 0, 0]}
                barSize={60}
              />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Distribution, Threshold Crossings, Correlation */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Distribution */}
        <Card className="p-6">
          <div className="mb-4">
            <h3 className="font-medium">Pest Count Distribution</h3>
            <p className="text-sm text-muted-foreground">
              Frequency distribution of observations
            </p>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={distributionData}>
              <CartesianGrid {...chartGridStyle} />
              <XAxis dataKey="range" {...chartAxisStyle} />
              <YAxis {...chartAxisStyle} />
              <Tooltip {...chartTooltipStyle} />
              <Bar
                dataKey="count"
                fill={chartColors.primary}
                radius={[8, 8, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Threshold Crossings */}
        <Card className="p-6">
          <div className="mb-4">
            <h3 className="font-medium">Above-Threshold Events by Month</h3>
            <p className="text-sm text-muted-foreground">
              Frequency of threshold violations
            </p>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={thresholdByMonth}>
              <CartesianGrid {...chartGridStyle} />
              <XAxis dataKey="month" {...chartAxisStyle} />
              <YAxis {...chartAxisStyle} allowDecimals={false} />
              <Tooltip {...chartTooltipStyle} />
              <Bar
                dataKey="count"
                name="Threshold Violations"
                radius={[6, 6, 0, 0]}
              >
                {thresholdByMonth.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={
                      entry.count === maxThresholdCount && maxThresholdCount > 0
                        ? chartColors.destructive
                        : `${chartColors.destructive}cc`
                    }
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Pest Count vs Field Age (DAS) */}
        <Card className="p-6">
          <div className="mb-4">
            <h3 className="font-medium">Pest Count vs Field Age (DAS)</h3>
            <p className="text-sm text-muted-foreground">
              Scatter of pest count by days after sowing (derived)
            </p>
          </div>
          {scatterData.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No data available for current filters.
            </p>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <ScatterChart margin={{ top: 8, right: 16, left: 8, bottom: 12 }}>
                <CartesianGrid {...chartGridStyle} />
                <XAxis
                  dataKey="das"
                  name="Days After Sowing"
                  {...chartAxisStyle}
                  type="number"
                  domain={["dataMin - 2", "dataMax + 2"]}
                  tickFormatter={(v) => `${v}d`}
                />
                <YAxis
                  dataKey="count"
                  name="Pest Count"
                  {...chartAxisStyle}
                  type="number"
                  allowDecimals={false}
                />
                <Tooltip
                  {...chartTooltipStyle}
                  cursor={{ strokeDasharray: "3 3" }}
                  formatter={(value: any, name: any, props: any) => {
                    if (name === "das") return [`${value} days`, "DAS"];
                    if (name === "count") return [value, "Pest Count"];
                    return [value, name];
                  }}
                  labelFormatter={(_, payload) =>
                    payload && payload[0]?.payload
                      ? `Date: ${payload[0].payload.dateLabel}`
                      : ""
                  }
                />
                <Scatter
                  data={scatterData}
                  name="Pest Count"
                  fill={chartColors.chart4}
                  shape="circle"
                  fillOpacity={0.55}
                  r={3}
                />
              </ScatterChart>
            </ResponsiveContainer>
          )}
        </Card>
      </div>
    </div>
  );
}
