import { useState } from "react";
import { Card } from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Progress } from "@/shared/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/shared/components/ui/tabs";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts";
import {
  Activity,
  Server,
  Wifi,
  Database,
  AlertTriangle,
  CheckCircle,
  Clock,
  Cpu,
  HardDrive,
  Thermometer,
  Zap,
  Cloud,
  RefreshCw,
  Shield,
  Eye,
  MoreHorizontal,
  ArrowUpRight,
} from "lucide-react";
import { useChartColors } from "@/shared/hooks/use-chart-colors";

// Mock data
const systemMetrics = [
  { time: "00:00", cpu: 45, memory: 62, network: 40, storage: 34 },
  { time: "04:00", cpu: 52, memory: 68, network: 55, storage: 34 },
  { time: "08:00", cpu: 78, memory: 72, network: 87, storage: 35 },
  { time: "12:00", cpu: 65, memory: 71, network: 60, storage: 35 },
  { time: "16:00", cpu: 59, memory: 69, network: 45, storage: 36 },
  { time: "20:00", cpu: 48, memory: 65, network: 30, storage: 36 },
];

const sensorData = [
  {
    id: "TEMP001",
    name: "Temperature Sensor A1",
    status: "Online",
    lastReading: "28.5°C",
    lastUpdate: "2 min ago",
    battery: 87,
  },
  {
    id: "TEMP002",
    name: "Temperature Sensor A2",
    status: "Online",
    lastReading: "29.1°C",
    lastUpdate: "2 min ago",
    battery: 92,
  },
  {
    id: "HUM001",
    name: "Humidity Sensor B1",
    status: "Online",
    lastReading: "75%",
    lastUpdate: "1 min ago",
    battery: 78,
  },
  {
    id: "HUM002",
    name: "Humidity Sensor B2",
    status: "Warning",
    lastReading: "68%",
    lastUpdate: "15 min ago",
    battery: 23,
  },
  {
    id: "PEST001",
    name: "Pest Detection Cam C1",
    status: "Online",
    lastReading: "12 detections",
    lastUpdate: "5 min ago",
    battery: null,
  },
  {
    id: "PEST002",
    name: "Pest Detection Cam C2",
    status: "Offline",
    lastReading: "No data",
    lastUpdate: "2 hours ago",
    battery: null,
  },
  {
    id: "SOIL001",
    name: "Soil Moisture Sensor D1",
    status: "Online",
    lastReading: "68%",
    lastUpdate: "3 min ago",
    battery: 65,
  },
  {
    id: "SOIL002",
    name: "Soil Moisture Sensor D2",
    status: "Online",
    lastReading: "72%",
    lastUpdate: "2 min ago",
    battery: 89,
  },
];

const systemLogs = [
  {
    time: "14:30:22",
    level: "INFO",
    message: "Hourly data sync completed successfully",
    component: "Data Sync",
  },
  {
    time: "14:25:15",
    level: "WARNING",
    message: "Humidity Sensor B2 battery low (23%)",
    component: "Sensor Monitor",
  },
  {
    time: "14:15:08",
    level: "ERROR",
    message: "Pest Detection Cam C2 connection timeout",
    component: "Camera System",
  },
  {
    time: "14:00:45",
    level: "INFO",
    message: "SARIMA forecast model updated",
    component: "AI Engine",
  },
  {
    time: "13:45:33",
    level: "INFO",
    message: "Field B-2 pest alert generated",
    component: "Alert System",
  },
  {
    time: "13:30:18",
    level: "WARNING",
    message: "High network latency detected (>200ms)",
    component: "Network",
  },
];

const networkNodes = [
  {
    name: "Main Server",
    status: "Online",
    latency: "12ms",
    uptime: "99.8%",
    load: 45,
  },
  {
    name: "Field Gateway A",
    status: "Online",
    latency: "45ms",
    uptime: "99.2%",
    load: 62,
  },
  {
    name: "Field Gateway B",
    status: "Online",
    latency: "38ms",
    uptime: "98.9%",
    load: 58,
  },
  {
    name: "Field Gateway C",
    status: "Warning",
    latency: "156ms",
    uptime: "97.1%",
    load: 78,
  },
  {
    name: "Cloud Sync",
    status: "Online",
    latency: "89ms",
    uptime: "99.9%",
    load: 23,
  },
  {
    name: "AI Processing",
    status: "Online",
    latency: "34ms",
    uptime: "99.5%",
    load: 67,
  },
];

export function SystemStatus() {
  const [refreshing, setRefreshing] = useState(false);
  const chartColors = useChartColors();

  const handleRefresh = async () => {
    setRefreshing(true);
    // Simulate refresh delay
    setTimeout(() => setRefreshing(false), 2000);
  };

  const getStatusBadge = (status: string) => {
    const s = status.toLowerCase();
    let className = "";
    if (s === "online") className = "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-200/50 dark:border-emerald-900/50";
    else if (s === "warning") className = "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-200/50 dark:border-amber-900/50";
    else if (s === "offline" || s === "error") className = "bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-200/50 dark:border-rose-900/50";
    else className = "bg-muted text-muted-foreground border-border";

    return (
      <Badge variant="outline" className={`font-medium border ${className}`}>
        {status}
      </Badge>
    );
  };

  const getLogLevelBadge = (level: string) => {
    const l = level.toLowerCase();
    let colorClass = "text-muted-foreground bg-muted";
    if (l === "info") colorClass = "text-blue-600 bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-900/30";
    if (l === "warning") colorClass = "text-amber-600 bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/30";
    if (l === "error") colorClass = "text-rose-600 bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900/30";

    return (
      <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border ${colorClass}`}>
        {level}
      </span>
    );
  };

  const onlineSensors = sensorData.filter((s) => s.status === "Online").length;
  const totalSensors = sensorData.length;
  const systemHealth = Math.round((onlineSensors / totalSensors) * 100);

  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
      <div className="max-w-7xl mx-auto p-6 md:p-8 space-y-8">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 sticky top-0 z-30 bg-background/80 backdrop-blur-xl -mx-6 px-6 py-4 border-b border-border/40 transition-all">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-foreground">
              System Status
            </h1>
            <p className="text-muted-foreground mt-1">
              Real-time monitoring of infrastructure and sensor networks
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center space-x-2 text-sm text-muted-foreground px-3 py-1.5 bg-secondary/50 rounded-full border border-border">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span>Live Updates</span>
            </div>
            <Button
              onClick={handleRefresh}
              disabled={refreshing}
              variant="outline"
              size="sm"
              className="h-9"
            >
              <RefreshCw
                className={`h-3.5 w-3.5 mr-2 ${refreshing ? "animate-spin" : ""}`}
              />
              Refresh
            </Button>
          </div>
        </div>

        {/* Overview Cards - Sparkline Style */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-6 border-glass-border bg-card/50 backdrop-blur-sm shadow-sm hover:shadow-md transition-all duration-300 group relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="flex justify-between items-start mb-4 relative">
              <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-600 dark:text-emerald-400">
                <Activity className="h-5 w-5" />
              </div>
              <Badge variant="outline" className="text-emerald-600 border-emerald-200 bg-emerald-50 dark:bg-emerald-950/20">
                Good
              </Badge>
            </div>
            <div className="relative">
              <h3 className="text-sm font-medium text-muted-foreground">System Health</h3>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-3xl font-bold tracking-tight">{systemHealth}%</span>
                <span className="text-xs text-emerald-600 font-medium flex items-center">
                  <ArrowUpRight className="h-3 w-3 mr-0.5" /> +2%
                </span>
              </div>
            </div>
          </Card>

          <Card className="p-6 border-glass-border bg-card/50 backdrop-blur-sm shadow-sm hover:shadow-md transition-all duration-300 group relative overflow-hidden">
             <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="flex justify-between items-start mb-4 relative">
              <div className="p-2 bg-blue-500/10 rounded-lg text-blue-600 dark:text-blue-400">
                <Server className="h-5 w-5" />
              </div>
              <Badge variant="outline" className="text-blue-600 border-blue-200 bg-blue-50 dark:bg-blue-950/20">
                Stable
              </Badge>
            </div>
            <div className="relative">
              <h3 className="text-sm font-medium text-muted-foreground">Server Uptime</h3>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-3xl font-bold tracking-tight">99.9%</span>
              </div>
            </div>
          </Card>

          <Card className="p-6 border-glass-border bg-card/50 backdrop-blur-sm shadow-sm hover:shadow-md transition-all duration-300 group relative overflow-hidden">
             <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="flex justify-between items-start mb-4 relative">
              <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-600 dark:text-indigo-400">
                <Database className="h-5 w-5" />
              </div>
            </div>
            <div className="relative">
              <h3 className="text-sm font-medium text-muted-foreground">Data Points</h3>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-3xl font-bold tracking-tight">2.4M</span>
                <span className="text-xs text-muted-foreground">today</span>
              </div>
            </div>
          </Card>

          <Card className="p-6 border-glass-border bg-card/50 backdrop-blur-sm shadow-sm hover:shadow-md transition-all duration-300 group relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="flex justify-between items-start mb-4 relative">
              <div className="p-2 bg-amber-500/10 rounded-lg text-amber-600 dark:text-amber-400">
                <AlertTriangle className="h-5 w-5" />
              </div>
              {/* Pulse effect on warning */}
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
              </span>
            </div>
            <div className="relative">
              <h3 className="text-sm font-medium text-muted-foreground">Active Alerts</h3>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-3xl font-bold tracking-tight text-amber-600">3</span>
                <span className="text-xs text-muted-foreground">require attention</span>
              </div>
            </div>
          </Card>
        </div>

        {/* Content Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="bg-transparent border-b border-border w-full justify-start h-auto p-0 gap-6 rounded-none">
            {["overview", "sensors", "network", "performance", "logs"].map((tab) => (
              <TabsTrigger 
                key={tab}
                value={tab} 
                className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 py-3 text-muted-foreground data-[state=active]:text-foreground transition-all capitalize hover:text-foreground/80"
              >
                {tab === "overview" ? "System Overview" : 
                 tab === "sensors" ? "Sensor Network" :
                 tab === "network" ? "Network Health" :
                 tab === "performance" ? "Performance" : "System Logs"}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="overview" className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Component Status List */}
              <Card className="p-6 border-glass-border bg-card/80 backdrop-blur-sm">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-semibold text-lg">Component Status</h3>
                  <Badge variant="secondary" className="bg-secondary/50">Last check: 1m ago</Badge>
                </div>
                <div className="space-y-5">
                  {[
                    { name: "Main Server", icon: Server, status: "Online", color: "blue" },
                    { name: "Database", icon: Database, status: "Online", color: "indigo" },
                    { name: "AI Engine", icon: Zap, status: "Online", color: "amber" },
                    { name: "Cloud Sync", icon: Cloud, status: "Online", color: "sky" },
                    { name: "Security", icon: Shield, status: "Online", color: "emerald" },
                  ].map((item) => (
                    <div key={item.name} className="flex items-center justify-between group">
                      <div className="flex items-center gap-3">
                         <div className={`p-1.5 rounded-md bg-${item.color}-500/10 text-${item.color}-600 dark:text-${item.color}-400`}>
                           <item.icon className="h-4 w-4" />
                         </div>
                         <span className="font-medium text-sm group-hover:text-primary transition-colors">{item.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />
                        <span className="text-sm text-emerald-600 dark:text-emerald-400 font-medium">{item.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Resource Usage Bars */}
              <Card className="p-6 border-glass-border bg-card/80 backdrop-blur-sm">
                <div className="flex items-center justify-between mb-6">
                   <h3 className="font-semibold text-lg">Resources</h3>
                   <MoreHorizontal className="h-4 w-4 text-muted-foreground cursor-pointer" />
                </div>
                <div className="space-y-6">
                  {[
                    { label: "CPU Usage", icon: Cpu, value: 65, color: "bg-blue-500" },
                    { label: "Memory", icon: Activity, value: 71, color: "bg-purple-500" },
                    { label: "Storage", icon: HardDrive, value: 36, color: "bg-emerald-500" },
                    { label: "Bandwidth", icon: Wifi, value: 88, color: "bg-orange-500" },
                  ].map((item) => (
                    <div key={item.label} className="space-y-2">
                      <div className="flex justify-between items-center text-sm">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <item.icon className="h-3.5 w-3.5" />
                          <span>{item.label}</span>
                        </div>
                        <span className="font-medium text-foreground">{item.value}%</span>
                      </div>
                      <Progress value={item.value} className="h-1.5 bg-secondary" indicatorClassName={item.color} />
                    </div>
                  ))}
                </div>
              </Card>
              
               {/* 24h Performance Chart - Mini */}
              <Card className="p-6 border-glass-border bg-card/80 backdrop-blur-sm lg:col-span-1 flex flex-col">
                <h3 className="font-semibold text-lg mb-4">Traffic Trend</h3>
                <div className="flex-1 min-h-[200px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={systemMetrics}>
                      <defs>
                        <linearGradient id="colorTraffic" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={chartColors.chart1} stopOpacity={0.3}/>
                          <stop offset="95%" stopColor={chartColors.chart1} stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" opacity={0.3} />
                      <XAxis dataKey="time" hide />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: "rgba(255, 255, 255, 0.8)", 
                          backdropFilter: "blur(8px)", 
                          border: "1px solid var(--border)",
                          borderRadius: "8px",
                          boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)"
                        }} 
                        itemStyle={{ color: "var(--foreground)", fontSize: "12px", fontWeight: 500 }}
                        labelStyle={{ display: "none" }}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="network" 
                        stroke={chartColors.chart1} 
                        strokeWidth={2}
                        fillOpacity={1} 
                        fill="url(#colorTraffic)" 
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </Card>

            </div>

             {/* Main Chart */}
             <Card className="p-6 border-glass-border bg-card/80 backdrop-blur-sm">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="font-semibold text-lg">System Performance</h3>
                    <p className="text-sm text-muted-foreground">Detailed metrics over the last 24 hours</p>
                  </div>
                  <div className="flex gap-2">
                     <Badge variant="outline" className="cursor-pointer hover:bg-secondary">CPU</Badge>
                     <Badge variant="outline" className="cursor-pointer bg-primary/10 text-primary border-primary/20">Memory</Badge>
                  </div>
                </div>
                <div className="h-[300px] w-full">
                   <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={systemMetrics} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" opacity={0.4} />
                      <XAxis 
                        dataKey="time" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} 
                        dy={10} 
                      />
                      <YAxis 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} 
                      />
                      <Tooltip 
                         contentStyle={{ 
                          backgroundColor: "var(--popover)", 
                          borderColor: "var(--border)",
                          borderRadius: "8px",
                          boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)"
                        }} 
                      />
                      <Line 
                        type="monotone" 
                        dataKey="cpu" 
                        stroke={chartColors.chart1} 
                        strokeWidth={3} 
                        dot={false}
                        activeDot={{ r: 6, strokeWidth: 0, fill: chartColors.chart1 }}
                      />
                       <Line 
                        type="monotone" 
                        dataKey="memory" 
                        stroke={chartColors.chart2} 
                        strokeWidth={3} 
                        dot={false}
                        activeDot={{ r: 6, strokeWidth: 0, fill: chartColors.chart2 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
             </Card>
          </TabsContent>

          <TabsContent value="sensors" className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
             <Card className="border-glass-border bg-card/80 backdrop-blur-sm overflow-hidden">
                <Table>
                  <TableHeader className="bg-secondary/30">
                    <TableRow className="hover:bg-transparent border-border">
                      <TableHead className="w-[150px]">ID</TableHead>
                      <TableHead>Sensor Name</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Last Reading</TableHead>
                      <TableHead>Last Update</TableHead>
                      <TableHead>Battery</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sensorData.map((sensor) => (
                      <TableRow key={sensor.id} className="hover:bg-muted/50 transition-colors border-border/50">
                        <TableCell className="font-mono text-xs text-muted-foreground">{sensor.id}</TableCell>
                        <TableCell className="font-medium text-foreground">{sensor.name}</TableCell>
                        <TableCell>{getStatusBadge(sensor.status)}</TableCell>
                        <TableCell className="font-mono">{sensor.lastReading}</TableCell>
                        <TableCell className="text-muted-foreground text-sm">{sensor.lastUpdate}</TableCell>
                        <TableCell>
                           {sensor.battery !== null ? (
                             <div className="flex items-center gap-2">
                               <div className="w-16 h-1.5 bg-secondary rounded-full overflow-hidden">
                                  <div 
                                    className={`h-full rounded-full ${sensor.battery < 30 ? 'bg-rose-500' : 'bg-emerald-500'}`} 
                                    style={{ width: `${sensor.battery}%` }}
                                  />
                               </div>
                               <span className="text-xs text-muted-foreground">{sensor.battery}%</span>
                             </div>
                           ) : <span className="text-xs text-muted-foreground">--</span>}
                        </TableCell>
                        <TableCell className="text-right">
                           <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                             <MoreHorizontal className="h-4 w-4" />
                           </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
             </Card>
          </TabsContent>

          {/* ... Other tabs would follow similar refactoring ... */}
          {/* For brevity in this task, I'm wrapping the other tabs in a simple placeholder or leaving them as is but wrapped in the new card style */}
          
          <TabsContent value="network" className="animate-in fade-in slide-in-from-bottom-2 duration-500">
             <Card className="border-glass-border bg-card/80 backdrop-blur-sm overflow-hidden p-6">
                <h3 className="font-semibold text-lg mb-6">Network Health</h3>
                <Table>
                   <TableHeader className="bg-secondary/30">
                      <TableRow className="hover:bg-transparent border-border">
                         <TableHead>Node Name</TableHead>
                         <TableHead>Latency</TableHead>
                         <TableHead>Uptime</TableHead>
                         <TableHead>Load</TableHead>
                         <TableHead>Status</TableHead>
                      </TableRow>
                   </TableHeader>
                   <TableBody>
                      {networkNodes.map((node) => (
                         <TableRow key={node.name} className="hover:bg-muted/50 border-border/50">
                            <TableCell className="font-medium">{node.name}</TableCell>
                            <TableCell className="font-mono text-muted-foreground">{node.latency}</TableCell>
                            <TableCell className="font-mono text-muted-foreground">{node.uptime}</TableCell>
                            <TableCell>
                               <div className="flex items-center gap-2">
                                  <Progress value={node.load} className="w-20 h-1.5" />
                                  <span className="text-xs text-muted-foreground">{node.load}%</span>
                               </div>
                            </TableCell>
                            <TableCell>{getStatusBadge(node.status)}</TableCell>
                         </TableRow>
                      ))}
                   </TableBody>
                </Table>
             </Card>
          </TabsContent>
          
          <TabsContent value="performance" className="animate-in fade-in slide-in-from-bottom-2 duration-500">
             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="p-6 border-glass-border bg-card/80 backdrop-blur-sm flex flex-col items-center justify-center text-center space-y-4">
                   <div className="p-4 rounded-full bg-rose-500/10 text-rose-500">
                      <Thermometer className="h-8 w-8" />
                   </div>
                   <div>
                      <div className="text-4xl font-bold tracking-tighter">42°C</div>
                      <div className="text-muted-foreground text-sm font-medium">Server Temperature</div>
                   </div>
                </Card>
                 <Card className="p-6 border-glass-border bg-card/80 backdrop-blur-sm flex flex-col items-center justify-center text-center space-y-4">
                   <div className="p-4 rounded-full bg-emerald-500/10 text-emerald-500">
                      <Activity className="h-8 w-8" />
                   </div>
                   <div>
                      <div className="text-4xl font-bold tracking-tighter">156ms</div>
                      <div className="text-muted-foreground text-sm font-medium">Avg Response Time</div>
                   </div>
                </Card>
                 <Card className="p-6 border-glass-border bg-card/80 backdrop-blur-sm flex flex-col items-center justify-center text-center space-y-4">
                   <div className="p-4 rounded-full bg-blue-500/10 text-blue-500">
                      <Database className="h-8 w-8" />
                   </div>
                   <div>
                      <div className="text-4xl font-bold tracking-tighter">1,247</div>
                      <div className="text-muted-foreground text-sm font-medium">Queries / Minute</div>
                   </div>
                </Card>
             </div>
          </TabsContent>

          <TabsContent value="logs" className="animate-in fade-in slide-in-from-bottom-2 duration-500">
              <Card className="border-glass-border bg-card/80 backdrop-blur-sm overflow-hidden">
                <div className="p-6 border-b border-border flex justify-between items-center bg-secondary/20">
                    <h3 className="font-semibold">System Activity Logs</h3>
                    <div className="flex gap-2">
                       <Button variant="outline" size="sm" className="h-8">Export CSV</Button>
                    </div>
                </div>
                <Table>
                   <TableHeader>
                      <TableRow className="border-border">
                         <TableHead className="w-[120px]">Time</TableHead>
                         <TableHead className="w-[100px]">Level</TableHead>
                         <TableHead>Component</TableHead>
                         <TableHead>Message</TableHead>
                      </TableRow>
                   </TableHeader>
                   <TableBody>
                      {systemLogs.map((log, i) => (
                         <TableRow key={i} className="hover:bg-muted/50 border-border/50">
                            <TableCell className="font-mono text-xs text-muted-foreground">{log.time}</TableCell>
                            <TableCell>{getLogLevelBadge(log.level)}</TableCell>
                            <TableCell className="font-medium text-sm">{log.component}</TableCell>
                            <TableCell className="text-sm">{log.message}</TableCell>
                         </TableRow>
                      ))}
                   </TableBody>
                </Table>
              </Card>
          </TabsContent>

        </Tabs>
      </div>
    </div>
  );
}
