import type { ReactNode } from "react";
import { Card } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import {
  ArrowDownRight,
  ArrowUpRight,
  Bug,
  AlertTriangle,
  Activity,
  Target,
  Minus,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import type { KPIMetrics } from "@/shared/types/data";
import { Area, AreaChart, ResponsiveContainer, YAxis } from "recharts";
import { useChartColors } from "@/shared/hooks/use-chart-colors";

export type TrendData = {
  value: number; // The percentage change
  history: number[]; // Array of values for the sparkline
};

export type KpiTrends = {
  observations: TrendData;
  avgCount: TrendData;
  aboveThreshold: TrendData;
  actionRate: TrendData;
};

// New prop structure for 2025 "Context First" design
export type KpiInsight = {
  trend: TrendData;
  label: string; // "Actionable" text replacing generic helper
  sentiment: "neutral" | "warning" | "good" | "critical"; 
};

interface KpiCardsProps {
  kpis: KPIMetrics;
  insights: {
    observations: KpiInsight;
    avgCount: KpiInsight;
    aboveThreshold: KpiInsight;
    actionRate: KpiInsight;
  };
}

export function KpiCards({ kpis, insights }: KpiCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <KpiCard
        title="Total Observations"
        value={kpis.totalObservations.toLocaleString()}
        icon={Bug}
        insight={insights.observations}
      />

      <KpiCard
        title="Avg Pest Count"
        value={kpis.averagePestCount}
        icon={Activity}
        insight={insights.avgCount}
      />

      <KpiCard
        title="Above Threshold"
        value={`${kpis.percentAboveThreshold}%`}
        icon={AlertTriangle}
        insight={insights.aboveThreshold}
      />

      <KpiCard
        title="Action Rate"
        value={`${kpis.actionRate}%`}
        icon={Target}
        insight={insights.actionRate}
      />
    </div>
  );
}

function KpiCard({
  title,
  value,
  icon: Icon,
  insight,
}: {
  title: string;
  value: string | number;
  icon: React.ElementType;
  insight: KpiInsight;
}) {
  const chartColors = useChartColors();
  const { trend, label, sentiment } = insight;

  // Prepare data for Recharts
  const chartData = trend.history.map((val, i) => ({ i, value: val }));

  let statusColor = "text-muted-foreground";
  let badgeBg = "bg-muted/30 text-foreground/80";
  let strokeColor = chartColors.muted || "#94a3b8"; 
  
  if (sentiment === "critical") {
    statusColor = "text-red-600";
    badgeBg = "bg-red-100/50 text-red-700 dark:bg-red-900/20 dark:text-red-400";
    strokeColor = chartColors.destructive;
  } else if (sentiment === "warning") {
    statusColor = "text-amber-600";
    badgeBg = "bg-amber-100/50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400";
    strokeColor = chartColors.chart4;
  } else if (sentiment === "good") {
    statusColor = "text-emerald-600";
    badgeBg = "bg-emerald-100/50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400";
    strokeColor = chartColors.success;
  }

  const TrendIcon =
    trend.value > 0
      ? TrendingUp
      : trend.value < 0
      ? TrendingDown
      : Minus;

  return (
    <Card className="relative overflow-hidden border border-border/60 bg-gradient-to-br from-card to-muted/10 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group rounded-xl">
      <div className="flex flex-col h-full p-6 space-y-5">
        
        {/* Top Row: Label + Icon */}
        <div className="flex items-start justify-between">
            <span className="text-sm font-medium text-muted-foreground tracking-wide">
                {title}
            </span>
            {/* Icon - Uniform Design (Primary Color) */}
            <div className="p-2 rounded-lg bg-primary/10 text-primary transition-colors duration-300">
                <Icon className="h-5 w-5" strokeWidth={2} />
            </div>
        </div>

        {/* Middle Row: Value + Sparkline */}
        <div className="flex items-end justify-between gap-2">
            <div className="flex flex-col">
                <div className="text-3xl lg:text-4xl font-semibold tracking-tight text-foreground tabular-nums transition-all duration-300">
                    {value}
                </div>
            </div>
            
            {/* Micro-Trend Sparkline */}
            <div className="h-[40px] w-[80px] pb-1 opacity-60 group-hover:opacity-100 transition-opacity">
                <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                    <defs>
                    <linearGradient id={`grad-${title}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={strokeColor} stopOpacity={0.3} />
                        <stop offset="100%" stopColor={strokeColor} stopOpacity={0.05} />
                    </linearGradient>
                    </defs>
                    <Area
                    type="monotone"
                    dataKey="value"
                    stroke={strokeColor}
                    fill={`url(#grad-${title})`}
                    strokeWidth={2.5}
                    isAnimationActive={false}
                    />
                </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-border/30 w-full" />

        {/* Bottom Row: Insight & Trend (No Capsule) */}
        <div className="flex items-center gap-2 justify-between">
            {/* Insight Subtext */}
           <span className={`text-xs font-medium leading-tight truncate flex-1 ${statusColor}`}>
             {label}
           </span>

            {/* Trend - Plain Text, No Pill */}
           <div className={`flex items-center text-xs font-semibold ${statusColor}`}>
               <TrendIcon className="h-3.5 w-3.5 mr-1" strokeWidth={2.5} />
               {Math.abs(trend.value)}%
           </div>
        </div>
      </div>
    </Card>
  );
}
