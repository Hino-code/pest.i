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
  ComposedChart,
  Cell,
  PieChart,
  Pie,
} from "recharts";
import {
  Target,
  CheckCircle,
  AlertTriangle,
  TrendingDown,
  Activity,
  XCircle,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table";
import {
  chartAxisStyle,
  chartGridStyle,
  chartTooltipStyle,
} from "@/shared/components/charting/chart-styles";
import { useChartColors } from "@/shared/hooks/use-chart-colors";

export function ThresholdActions() {
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
  const palette = [
    chartColors.chart1,
    chartColors.chart2,
    chartColors.chart3,
    chartColors.chart4,
    chartColors.chart5,
    chartColors.chart6,
  ];

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

  // Action Efficiency Metrics
  const actionMetrics = useMemo(() => {
    const total = filteredData.length;
    const withActions = filteredData.filter((o) => o.actionTaken).length;
    const aboveThreshold = filteredData.filter((o) => o.aboveThreshold).length;
    const aboveWithAction = filteredData.filter(
      (o) => o.aboveThreshold && o.actionTaken
    ).length;
    const aboveWithoutAction = filteredData.filter(
      (o) => o.aboveThreshold && !o.actionTaken
    ).length;

    return {
      actionRate: total > 0 ? Math.round((withActions / total) * 100) : 0,
      thresholdActionRate:
        aboveThreshold > 0
          ? Math.round((aboveWithAction / aboveThreshold) * 100)
          : 0,
      criticalGap: aboveWithoutAction,
      totalActions: withActions,
      totalAboveThreshold: aboveThreshold,
    };
  }, [filteredData]);

  // Actions by Season
  const actionsBySeason = useMemo(() => {
    const seasons: Record<
      string,
      { season: string; taken: number; notTaken: number }
    > = {
      Dry: { season: "Dry Season", taken: 0, notTaken: 0 },
      Wet: { season: "Wet Season", taken: 0, notTaken: 0 },
    };

    filteredData.forEach((obs) => {
      if (seasons[obs.season]) {
        if (obs.actionTaken) {
          seasons[obs.season].taken++;
        } else {
          seasons[obs.season].notTaken++;
        }
      }
    });

    return Object.values(seasons);
  }, [filteredData]);

  // Actions by Field Stage
  const actionsByStage = useMemo(() => {
    const stages: Record<
      string,
      { stage: string; taken: number; notTaken: number; actionRate: number }
    > = {};

    // Initialize stages dynamically from observations
    filteredData.forEach((obs) => {
      if (!stages[obs.fieldStage]) {
        stages[obs.fieldStage] = {
          stage: obs.fieldStage,
          taken: 0,
          notTaken: 0,
          actionRate: 0,
        };
      }
    });

    // Count actions by stage
    filteredData.forEach((obs) => {
      if (stages[obs.fieldStage]) {
        if (obs.actionTaken) {
          stages[obs.fieldStage].taken++;
        } else {
          stages[obs.fieldStage].notTaken++;
        }
      }
    });

    return Object.values(stages).map((s) => {
      const total = s.taken + s.notTaken;
      return {
        ...s,
        actionRate: total > 0 ? Math.round((s.taken / total) * 100) : 0,
      };
    });
  }, [filteredData]);

  // Action Types Distribution
  const actionTypeDistribution = useMemo(() => {
    const types: Record<string, number> = {};

    filteredData.forEach((obs) => {
      if (obs.actionTaken && obs.actionType) {
        types[obs.actionType] = (types[obs.actionType] || 0) + 1;
      }
    });

    return Object.entries(types).map(([name, value]) => ({ name, value }));
  }, [filteredData]);

  // Threshold Status vs Action Taken
  const thresholdVsAction = useMemo(() => {
    return [
      {
        status: "Above Threshold",
        "Action Taken": filteredData.filter(
          (o) => o.aboveThreshold && o.actionTaken
        ).length,
        "No Action": filteredData.filter(
          (o) => o.aboveThreshold && !o.actionTaken
        ).length,
      },
      {
        status: "Below Threshold",
        "Action Taken": filteredData.filter(
          (o) => !o.aboveThreshold && o.actionTaken
        ).length,
        "No Action": filteredData.filter(
          (o) => !o.aboveThreshold && !o.actionTaken
        ).length,
      },
    ];
  }, [filteredData]);

  // High Risk Events Without Action
  const highRiskNoAction = useMemo(() => {
    return filteredData
      .filter((o) => o.aboveThreshold && !o.actionTaken)
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)
      .map((o) => ({
        date: new Date(o.date).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        }),
        location: o.location || "N/A",
        pestType: o.pestType,
        count: o.count,
        threshold: o.threshold,
        severity: Math.round((o.count / o.threshold - 1) * 100),
      }));
  }, [filteredData]);

  // Monthly Action Trends
  const monthlyActions = useMemo(() => {
    const monthly: Record<
      string,
      { month: string; actions: number; observations: number; rate: number }
    > = {};

    filteredData.forEach((obs) => {
      const month = new Date(obs.date).toLocaleDateString("en-US", {
        month: "short",
        year: "2-digit",
      });
      if (!monthly[month]) {
        monthly[month] = { month, actions: 0, observations: 0, rate: 0 };
      }
      monthly[month].observations++;
      if (obs.actionTaken) {
        monthly[month].actions++;
      }
    });

    return Object.values(monthly)
      .map((m) => ({
        ...m,
        rate: Math.round((m.actions / m.observations) * 100),
      }))
      .sort(
        (a, b) => new Date(a.month).getTime() - new Date(b.month).getTime()
      );
  }, [filteredData]);

  return (
    <div className="p-6 space-y-6">
      {/* Filters */}
      <SharedFilters filters={filters} onFilterChange={setFilters} compact />

      {/* Action Efficiency KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="p-4">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">
                Overall Action Rate
              </p>
              <p className="text-2xl font-semibold">
                {actionMetrics.actionRate}%
              </p>
              <p className="text-xs text-muted-foreground">
                {actionMetrics.totalActions} actions
              </p>
            </div>
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
              <Target className="h-4 w-4 text-primary" />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">
                Threshold Action Rate
              </p>
              <p className="text-2xl font-semibold">
                {actionMetrics.thresholdActionRate}%
              </p>
              <p className="text-xs text-muted-foreground">
                Of threshold events
              </p>
            </div>
            <div className="h-8 w-8 rounded-full bg-success/10 flex items-center justify-center">
              <CheckCircle className="h-4 w-4 text-success" />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Threshold Events</p>
              <p className="text-2xl font-semibold">
                {actionMetrics.totalAboveThreshold}
              </p>
              <p className="text-xs text-muted-foreground">Total count</p>
            </div>
            <div className="h-8 w-8 rounded-full bg-warning/10 flex items-center justify-center">
              <AlertTriangle className="h-4 w-4 text-warning" />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Critical Gap</p>
              <p className="text-2xl font-semibold">
                {actionMetrics.criticalGap}
              </p>
              <p className="text-xs text-muted-foreground">No action taken</p>
            </div>
            <div className="h-8 w-8 rounded-full bg-destructive/10 flex items-center justify-center">
              <XCircle className="h-4 w-4 text-destructive" />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Response Coverage</p>
              <div className="flex items-baseline gap-1">
                <p className="text-2xl font-semibold">
                  {100 -
                    Math.round(
                      (actionMetrics.criticalGap /
                        actionMetrics.totalAboveThreshold) *
                        100
                    ) || 0}
                </p>
                <span className="text-sm">%</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Of critical events
              </p>
            </div>
            <div className="h-8 w-8 rounded-full bg-chart-5/10 flex items-center justify-center">
              <Activity className="h-4 w-4 text-chart-5" />
            </div>
          </div>
        </Card>
      </div>

      {/* Actions by Season & Stage */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <div className="mb-4">
            <h3 className="font-medium">Actions by Season</h3>
            <p className="text-sm text-muted-foreground">
              Intervention distribution across seasons
            </p>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={actionsBySeason}>
              <CartesianGrid {...chartGridStyle} />
              <XAxis
                {...chartAxisStyle}
                dataKey="season"
                tick={{ fontSize: 11 }}
              />
              <YAxis {...chartAxisStyle} tick={{ fontSize: 11 }} />
              <Tooltip {...chartTooltipStyle} />
              <Legend />
              <Bar
                dataKey="taken"
                fill={chartColors.success}
                name="Action Taken"
                radius={[8, 8, 0, 0]}
              />
              <Bar
                dataKey="notTaken"
                fill={chartColors.muted}
                name="No Action"
                radius={[8, 8, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-6">
          <div className="mb-4">
            <h3 className="font-medium">Action Rate by Field Stage</h3>
            <p className="text-sm text-muted-foreground">
              Response efficiency per growth stage
            </p>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={actionsByStage}>
              <CartesianGrid {...chartGridStyle} />
              <XAxis
                {...chartAxisStyle}
                dataKey="stage"
                tick={{ fontSize: 11 }}
              />
              <YAxis
                yAxisId="left"
                {...chartAxisStyle}
                tick={{ fontSize: 11 }}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                {...chartAxisStyle}
                tick={{ fontSize: 11 }}
              />
              <Tooltip {...chartTooltipStyle} />
              <Legend />
              <Bar
                yAxisId="left"
                dataKey="taken"
                fill={chartColors.success}
                name="Actions Taken"
                radius={[8, 8, 0, 0]}
              />
              <Bar
                yAxisId="left"
                dataKey="notTaken"
                fill={chartColors.muted}
                name="No Action"
                radius={[8, 8, 0, 0]}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="actionRate"
                stroke={chartColors.primary}
                strokeWidth={3}
                name="Action Rate %"
                dot={{ r: 3, fill: chartColors.primary }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Action Types & Threshold Correlation */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <div className="mb-4">
            <h3 className="font-medium">Action Types Distribution</h3>
            <p className="text-sm text-muted-foreground">
              Types of interventions applied
            </p>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={actionTypeDistribution}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) =>
                  `${name} ${(percent * 100).toFixed(0)}%`
                }
                outerRadius={80}
                fill={chartColors.chart1}
                dataKey="value"
              >
                {actionTypeDistribution.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={palette[index % palette.length]}
                  />
                ))}
              </Pie>
              <Tooltip {...chartTooltipStyle} />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-6">
          <div className="mb-4">
            <h3 className="font-medium">Threshold Status vs Action Taken</h3>
            <p className="text-sm text-muted-foreground">
              Response correlation with threshold violations
            </p>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={thresholdVsAction} layout="vertical">
              <CartesianGrid {...chartGridStyle} />
              <XAxis type="number" {...chartAxisStyle} />
              <YAxis
                dataKey="status"
                type="category"
                width={120}
                {...chartAxisStyle}
              />
              <Tooltip {...chartTooltipStyle} />
              <Legend />
              <Bar
                dataKey="Action Taken"
                fill={chartColors.success}
                radius={[0, 8, 8, 0]}
              />
              <Bar
                dataKey="No Action"
                fill={chartColors.destructive}
                radius={[0, 8, 8, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Monthly Action Trends */}
      <Card className="p-6">
        <div className="mb-4">
          <h3 className="font-medium">Monthly Action Trends</h3>
          <p className="text-sm text-muted-foreground">
            Action rate and volume over time
          </p>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <ComposedChart data={monthlyActions}>
            <CartesianGrid {...chartGridStyle} />
            <XAxis
              {...chartAxisStyle}
              dataKey="month"
              tick={{ fontSize: 11 }}
            />
            <YAxis yAxisId="left" {...chartAxisStyle} tick={{ fontSize: 11 }} />
            <YAxis
              yAxisId="right"
              orientation="right"
              {...chartAxisStyle}
              tick={{ fontSize: 11 }}
            />
            <Tooltip {...chartTooltipStyle} />
            <Legend />
            <Bar
              yAxisId="left"
              dataKey="actions"
              fill={chartColors.primary}
              name="Actions Taken"
              radius={[8, 8, 0, 0]}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="rate"
              stroke={chartColors.chart2}
              strokeWidth={3}
              name="Action Rate %"
              dot={{ r: 3, fill: chartColors.chart2 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </Card>

      {/* High Risk Events Without Action Table */}
      <Card className="p-6">
        <div className="mb-4">
          <h3 className="font-medium flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-destructive" />
            High-Risk Events Without Action
          </h3>
          <p className="text-sm text-muted-foreground">
            Top 10 critical observations requiring immediate attention
          </p>
        </div>
        {highRiskNoAction.length > 0 ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Pest Type</TableHead>
                  <TableHead className="text-right">Count</TableHead>
                  <TableHead className="text-right">Threshold</TableHead>
                  <TableHead className="text-right">Severity</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {highRiskNoAction.map((event, idx) => (
                  <TableRow key={idx}>
                    <TableCell>{event.date}</TableCell>
                    <TableCell>{event.location || "N/A"}</TableCell>
                    <TableCell>{event.pestType}</TableCell>
                    <TableCell className="text-right font-semibold">
                      {event.count}
                    </TableCell>
                    <TableCell className="text-right">
                      {event.threshold}
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge
                        variant={
                          event.severity > 100 ? "destructive" : "default"
                        }
                      >
                        +{event.severity}%
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className="text-destructive border-destructive"
                      >
                        No Action
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <CheckCircle className="h-12 w-12 mx-auto mb-2 text-success" />
            <p>No high-risk events without action</p>
            <p className="text-sm">
              All critical observations have been addressed
            </p>
          </div>
        )}
      </Card>
    </div>
  );
}
