import { useState, useEffect, useMemo, useRef } from "react";
import { useDashboardStore } from "@/state/store";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { useChartColors } from "@/shared/hooks/use-chart-colors";
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
import { Calendar } from "@/shared/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/shared/components/ui/popover";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  Legend,
} from "recharts";
import {
  FileText,
  Download,
  Calendar as CalendarIcon,
  TrendingUp,
  Bug,
  Activity,
  FileSpreadsheet,
  Filter,
  Search,
} from "lucide-react";
import { Input } from "@/shared/components/ui/input";
import { EmptyState } from "@/shared/components/ui/empty-state";
import { format } from "date-fns";
import type { DateRange as PickerDateRange } from "react-day-picker";

export function Reports() {
  // Default to "all" to show all available data
  const [dateRange, setDateRange] = useState("all");
  const [reportType, setReportType] = useState("summary");
  const [searchQuery, setSearchQuery] = useState("");
  const [customDateRange, setCustomDateRange] = useState<PickerDateRange>({
    from: undefined,
    to: undefined,
  });
  const [datePopoverOpen, setDatePopoverOpen] = useState(false);
  const chartColors = useChartColors();

  const observations = useDashboardStore((state) => state.observations);
  const loading = useDashboardStore((state) => state.loading);
  const error = useDashboardStore((state) => state.error);
  const initialize = useDashboardStore((state) => state.initialize);

  useEffect(() => {
    initialize();
  }, [initialize]);

  // Helper function to get date range based on selection
  // Must be a regular function (not a hook) so it can be used inside useMemo
  const getDateRange = (range: string): { start: Date; end: Date } => {
    // If we have observations, use the actual data range for "all" option
    if (range === "all" && observations.length > 0) {
      const dataDates = observations.map((obs) => new Date(obs.date));
      return {
        start: new Date(Math.min(...dataDates.map((d) => d.getTime()))),
        end: new Date(Math.max(...dataDates.map((d) => d.getTime()))),
      };
    }

    const end = new Date();
    const start = new Date();

    switch (range) {
      case "1month":
        start.setMonth(start.getMonth() - 1);
        break;
      case "3months":
        start.setMonth(start.getMonth() - 3);
        break;
      case "6months":
        start.setMonth(start.getMonth() - 6);
        break;
      case "1year":
        start.setFullYear(start.getFullYear() - 1);
        break;
      case "all":
        // For "all", use data range if available, otherwise use a very wide range
        if (observations.length > 0) {
          const dataDates = observations.map((obs) => new Date(obs.date));
          return {
            start: new Date(Math.min(...dataDates.map((d) => d.getTime()))),
            end: new Date(Math.max(...dataDates.map((d) => d.getTime()))),
          };
        }
        // Fallback: use last 5 years if no data
        start.setFullYear(start.getFullYear() - 5);
        break;
      case "custom":
        // Use custom date range if available
        if (customDateRange.from && customDateRange.to) {
          return {
            start: customDateRange.from,
            end: customDateRange.to,
          };
        }
        // Fallback to 1 year if custom not set
        start.setFullYear(start.getFullYear() - 1);
        break;
      default:
        start.setFullYear(start.getFullYear() - 1);
    }

    return { start, end };
  };

  // Filter observations based on selected date range and search query
  const filteredObservations = useMemo(() => {
    // If no observations, return empty array
    if (observations.length === 0) {
      console.log("Reports: No observations available");
      return [];
    }

    // Get the actual date range of the data
    const dataDates = observations.map((obs) => new Date(obs.date));
    const minDataDate = new Date(
      Math.min(...dataDates.map((d) => d.getTime()))
    );
    const maxDataDate = new Date(
      Math.max(...dataDates.map((d) => d.getTime()))
    );

    const { start, end } = getDateRange(dateRange);

    // For "all" option, use the actual data range
    const filterStart =
      dateRange === "all"
        ? minDataDate
        : start < minDataDate
        ? minDataDate
        : start;
    const filterEnd =
      dateRange === "all" ? maxDataDate : end > maxDataDate ? maxDataDate : end;

    console.log("Reports filtering:", {
      totalObservations: observations.length,
      dateRange,
      filterStart: filterStart.toISOString(),
      filterEnd: filterEnd.toISOString(),
      dataRange: {
        min: minDataDate.toISOString(),
        max: maxDataDate.toISOString(),
      },
    });

    let filtered = observations.filter((obs) => {
      const obsDate = new Date(obs.date);
      obsDate.setHours(0, 0, 0, 0); // Normalize to start of day
      const startNormalized = new Date(filterStart);
      startNormalized.setHours(0, 0, 0, 0);
      const endNormalized = new Date(filterEnd);
      endNormalized.setHours(23, 59, 59, 999); // Include entire end day

      return obsDate >= startNormalized && obsDate <= endNormalized;
    });

    console.log("Reports filtered count:", filtered.length);

    // Apply search filter if query exists
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (obs) =>
          obs.fieldStage.toLowerCase().includes(query) ||
          obs.pestType.toLowerCase().includes(query) ||
          obs.location?.toLowerCase().includes(query) ||
          obs.date.includes(query)
      );
    }

    return filtered;
  }, [observations, dateRange, customDateRange, searchQuery]);

  // Generate monthly trends from observations (ALL HOOKS MUST BE CALLED BEFORE ANY RETURNS)
  const monthlyTrends = useMemo(() => {
    const grouped: Record<
      string,
      { count: number; observations: number; fieldStages: Set<string> }
    > = {};

    filteredObservations.forEach((obs) => {
      const date = new Date(obs.date);
      const monthKey = date.toLocaleDateString("en-US", {
        month: "short",
        year: "numeric",
      });

      if (!grouped[monthKey]) {
        grouped[monthKey] = {
          count: 0,
          observations: 0,
          fieldStages: new Set(),
        };
      }

      grouped[monthKey].count += obs.count;
      grouped[monthKey].observations += 1;
      grouped[monthKey].fieldStages.add(obs.fieldStage);
    });

    return Object.entries(grouped)
      .map(([month, data]) => ({
        month,
        blackRiceBug: Math.round(data.count / data.observations),
        totalDamage:
          Math.round((data.count / data.observations) * 0.25 * 10) / 10, // Estimate damage as 0.25% per pest count
        fieldsAffected: data.fieldStages.size,
      }))
      .sort((a, b) => {
        const dateA = new Date(a.month);
        const dateB = new Date(b.month);
        return dateA.getTime() - dateB.getTime();
      });
  }, [filteredObservations]);

  // Generate weekly reports from observations
  const weeklyReports = useMemo(() => {
    const grouped: Record<
      string,
      {
        date: string;
        count: number;
        observations: number;
        alerts: number;
        actions: number;
        dates: string[];
      }
    > = {};

    filteredObservations.forEach((obs) => {
      const date = new Date(obs.date);
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay()); // Start of week (Sunday)
      const weekKey = `Week ${Math.ceil(
        (date.getTime() - new Date(date.getFullYear(), 0, 1).getTime()) /
          (7 * 24 * 60 * 60 * 1000)
      )}`;
      const dateStr = obs.date;

      if (!grouped[weekKey]) {
        grouped[weekKey] = {
          date: dateStr,
          count: 0,
          observations: 0,
          alerts: 0,
          actions: 0,
          dates: [],
        };
      }

      grouped[weekKey].count += obs.count;
      grouped[weekKey].observations += 1;
      if (obs.aboveThreshold) grouped[weekKey].alerts += 1;
      if (obs.actionTaken) grouped[weekKey].actions += 1;
      if (!grouped[weekKey].dates.includes(dateStr)) {
        grouped[weekKey].dates.push(dateStr);
      }
    });

    return Object.entries(grouped)
      .map(([week, data]) => {
        const avgCount = data.count / data.observations;
        let damageLevel: "Low" | "Medium" | "High" = "Low";
        if (avgCount >= 10) damageLevel = "High";
        else if (avgCount >= 5) damageLevel = "Medium";

        // Temperature and humidity not available in observations data
        // Return null to indicate data is not available from backend
        return {
          week,
          date: data.dates[0] || data.date,
          avgTemp: null, // Not available in backend data
          avgHumidity: null, // Not available in backend data
          pestAlerts: data.alerts,
          damageLevel,
          actionsTaken: data.actions,
        };
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(-4); // Last 4 weeks
  }, [filteredObservations]);

  // Generate field performance from observations (grouped by field stage)
  const fieldPerformance = useMemo(() => {
    const grouped: Record<
      string,
      {
        alerts: number;
        totalCount: number;
        observations: number;
        actions: number;
        lastTreatment?: string;
      }
    > = {};

    filteredObservations.forEach((obs) => {
      const stage = obs.fieldStage;

      if (!grouped[stage]) {
        grouped[stage] = {
          alerts: 0,
          totalCount: 0,
          observations: 0,
          actions: 0,
        };
      }

      grouped[stage].totalCount += obs.count;
      grouped[stage].observations += 1;
      if (obs.aboveThreshold) grouped[stage].alerts += 1;
      if (obs.actionTaken) {
        grouped[stage].actions += 1;
        if (
          !grouped[stage].lastTreatment ||
          (obs.actionDate && obs.actionDate > grouped[stage].lastTreatment!)
        ) {
          grouped[stage].lastTreatment = obs.actionDate || obs.date;
        }
      }
    });

    return Object.entries(grouped)
      .map(([field, data]) => {
        const avgDamage =
          data.observations > 0
            ? Math.round((data.totalCount / data.observations) * 0.25 * 10) / 10
            : 0;
        const efficiency =
          data.alerts > 0
            ? Math.round((data.actions / data.alerts) * 100)
            : 100;

        return {
          field,
          totalAlerts: data.alerts,
          avgDamage,
          efficiency,
          lastTreatment: data.lastTreatment || "N/A",
        };
      })
      .sort((a, b) => b.totalAlerts - a.totalAlerts);
  }, [filteredObservations]);

  // Generate pest distribution from observations
  const pestDistribution = useMemo(() => {
    const counts: Record<string, number> = {};

    filteredObservations.forEach((obs) => {
      counts[obs.pestType] = (counts[obs.pestType] || 0) + 1;
    });

    const total = Object.values(counts).reduce((sum, count) => sum + count, 0);

    return Object.entries(counts).map(([name, count]) => ({
      name,
      value: total > 0 ? Math.round((count / total) * 100) : 0,
      color: name === "Black Rice Bug" ? "#ef4444" : "#3b82f6",
    }));
  }, [filteredObservations]);

  // Show loading state (AFTER all hooks are called)
  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <p className="text-muted-foreground">Loading reports data...</p>
        </div>
      </div>
    );
  }

  // Show error state (AFTER all hooks are called)
  if (error) {
    return (
      <div className="p-6">
        <Card className="p-6 border-destructive">
          <div className="text-center">
            <h3 className="font-semibold text-lg mb-2">Error Loading Data</h3>
            <p className="text-sm text-muted-foreground">{error}</p>
          </div>
        </Card>
      </div>
    );
  }

  // Show empty state if no observations (AFTER all hooks are called)
  if (observations.length === 0) {
    return (
      <div className="p-6">
        <Card className="p-6">
          <div className="text-center">
            <h3 className="font-semibold text-lg mb-2">No Data Available</h3>
            <p className="text-sm text-muted-foreground">
              No observations found. Please check your backend connection and
              ensure data is loaded.
            </p>
          </div>
        </Card>
      </div>
    );
  }

  // Handle custom date range selection
  const applyCustomDateRange = () => {
    if (customDateRange.from && customDateRange.to) {
      setDateRange("custom");
      setDatePopoverOpen(false);
    }
  };

  const clearCustomDateRange = () => {
    setCustomDateRange({ from: undefined, to: undefined });
    if (dateRange === "custom") {
      setDateRange("6months");
    }
    setDatePopoverOpen(false);
  };

  // Export to CSV
  const handleExportCSV = () => {
    const headers = [
      "Date",
      "Pest Type",
      "Count",
      "Threshold",
      "Above Threshold",
      "Season",
      "Field Stage",
      "Location",
      "Action Taken",
      "Action Type",
      "Action Date",
    ];

    const csvRows = [
      headers.join(","),
      ...filteredObservations.map((obs) => {
        return [
          obs.date,
          obs.pestType,
          obs.count,
          obs.threshold,
          obs.aboveThreshold ? "Yes" : "No",
          obs.season,
          obs.fieldStage,
          obs.location || "",
          obs.actionTaken ? "Yes" : "No",
          obs.actionType || "",
          obs.actionDate || "",
        ]
          .map((field) => {
            // Escape fields that contain commas or quotes
            if (
              typeof field === "string" &&
              (field.includes(",") || field.includes('"'))
            ) {
              return `"${field.replace(/"/g, '""')}"`;
            }
            return field;
          })
          .join(",");
      }),
    ];

    const csvContent = csvRows.join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);

    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `pest-report-${format(new Date(), "yyyy-MM-dd")}.csv`
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export charts to PDF with images
  const handleExportPDFWithCharts = async () => {
    try {
      const pdf = new jsPDF("p", "mm", "a4");
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      let yPosition = 20;

      // Add header
      pdf.setFontSize(20);
      pdf.setTextColor(37, 99, 235); // Blue color
      pdf.text("Pest.i Reports & Analytics", pageWidth / 2, yPosition, {
        align: "center",
      });
      yPosition += 10;

      pdf.setFontSize(12);
      pdf.setTextColor(0, 0, 0);
      pdf.text(
        `Generated: ${format(new Date(), "MMMM dd, yyyy 'at' HH:mm")}`,
        pageWidth / 2,
        yPosition,
        { align: "center" }
      );
      yPosition += 5;
      pdf.text(
        `Date Range: ${format(
          getDateRange(dateRange).start,
          "MMM dd, yyyy"
        )} - ${format(getDateRange(dateRange).end, "MMM dd, yyyy")}`,
        pageWidth / 2,
        yPosition,
        { align: "center" }
      );
      yPosition += 15;

      // Add summary statistics
      pdf.setFontSize(16);
      pdf.setTextColor(30, 64, 175);
      pdf.text("Summary Statistics", 20, yPosition);
      yPosition += 10;

      pdf.setFontSize(11);
      pdf.setTextColor(0, 0, 0);
      const stats = [
        `Total Observations: ${filteredObservations.length}`,
        `Average Pest Count: ${
          filteredObservations.length > 0
            ? (
                filteredObservations.reduce((sum, obs) => sum + obs.count, 0) /
                filteredObservations.length
              ).toFixed(1)
            : 0
        }`,
        `Above Threshold: ${
          filteredObservations.filter((obs) => obs.aboveThreshold).length
        }`,
        `Actions Taken: ${
          filteredObservations.filter((obs) => obs.actionTaken).length
        }`,
      ];
      stats.forEach((stat) => {
        pdf.text(stat, 20, yPosition);
        yPosition += 7;
      });
      yPosition += 10;

      // Find all chart containers and convert to images
      const chartSelectors = [
        '[data-chart="pest-trends"]',
        '[data-chart="damage-trends"]',
        '[data-chart="weekly-temp-humidity"]',
        '[data-chart="pest-distribution"]',
        '[data-chart="pest-activity-monthly"]',
      ];

      for (const selector of chartSelectors) {
        const chartElement = document.querySelector(selector);
        if (chartElement) {
          // Check if we need a new page
          if (yPosition > pageHeight - 80) {
            pdf.addPage();
            yPosition = 20;
          }

          try {
            // Get background color from CSS variable
            const bgColor = getComputedStyle(document.documentElement)
              .getPropertyValue("--card")
              .trim() || "#ffffff";
            const canvas = await html2canvas(chartElement as HTMLElement, {
              backgroundColor: bgColor,
              scale: 2,
              logging: false,
            });

            const imgData = canvas.toDataURL("image/png");
            const imgWidth = pageWidth - 40; // Margins
            const imgHeight = (canvas.height * imgWidth) / canvas.width;

            // Add chart title if available
            const title = chartElement.getAttribute("data-chart-title");
            if (title) {
              pdf.setFontSize(14);
              pdf.setTextColor(30, 64, 175);
              pdf.text(title, 20, yPosition);
              yPosition += 8;
            }

            pdf.addImage(imgData, "PNG", 20, yPosition, imgWidth, imgHeight);
            yPosition += imgHeight + 15;
          } catch (error) {
            console.error(`Error capturing chart ${selector}:`, error);
          }
        }
      }

      // Save PDF
      pdf.save(
        `pest-report-with-charts-${format(new Date(), "yyyy-MM-dd")}.pdf`
      );
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Failed to generate PDF with charts. Please try again.");
    }
  };

  // Export single chart to PDF
  const handleExportChartPDF = async (
    chartSelector: string,
    chartTitle: string
  ) => {
    try {
      const chartElement = document.querySelector(chartSelector);
      if (!chartElement) {
        alert("Chart not found");
        return;
      }

      const pdf = new jsPDF("p", "mm", "a4");
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      // Add header
      pdf.setFontSize(20);
      pdf.setTextColor(37, 99, 235);
      pdf.text("Pest.i Report", pageWidth / 2, 20, { align: "center" });
      pdf.setFontSize(12);
      pdf.setTextColor(0, 0, 0);
      pdf.text(
        `Generated: ${format(new Date(), "MMMM dd, yyyy 'at' HH:mm")}`,
        pageWidth / 2,
        30,
        { align: "center" }
      );

      // Add chart title
      pdf.setFontSize(16);
      pdf.setTextColor(30, 64, 175);
      pdf.text(chartTitle, pageWidth / 2, 45, { align: "center" });

      // Convert chart to image
      // Get background color from CSS variable
      const bgColor = getComputedStyle(document.documentElement)
        .getPropertyValue("--card")
        .trim() || "#ffffff";
      const canvas = await html2canvas(chartElement as HTMLElement, {
        backgroundColor: bgColor,
        scale: 2,
        logging: false,
      });

      const imgData = canvas.toDataURL("image/png");
      const imgWidth = pageWidth - 40;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      // Center the image vertically if it fits
      const startY = Math.max(55, (pageHeight - imgHeight) / 2);
      pdf.addImage(imgData, "PNG", 20, startY, imgWidth, imgHeight);

      // Save PDF
      pdf.save(
        `${chartTitle.toLowerCase().replace(/\s+/g, "-")}-${format(
          new Date(),
          "yyyy-MM-dd"
        )}.pdf`
      );
    } catch (error) {
      console.error("Error generating chart PDF:", error);
      alert("Failed to generate PDF. Please try again.");
    }
  };

  // Export to PDF (simplified HTML-based approach - for data tables)
  const handleExportPDF = () => {
    // Create a new window with printable content
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert("Please allow pop-ups to generate PDF");
      return;
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Pest.i Report - ${format(new Date(), "yyyy-MM-dd")}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              padding: 20px;
              color: #333;
            }
            h1 {
              color: #2563eb;
              border-bottom: 2px solid #2563eb;
              padding-bottom: 10px;
            }
            h2 {
              color: #1e40af;
              margin-top: 30px;
              border-bottom: 1px solid #e5e7eb;
              padding-bottom: 5px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin: 20px 0;
            }
            th, td {
              border: 1px solid #ddd;
              padding: 8px;
              text-align: left;
            }
            th {
              background-color: #2563eb;
              color: white;
              font-weight: bold;
            }
            tr:nth-child(even) {
              background-color: #f9fafb;
            }
            .summary {
              background-color: #f3f4f6;
              padding: 15px;
              border-radius: 5px;
              margin: 20px 0;
            }
            .stat {
              display: inline-block;
              margin: 10px 20px 10px 0;
            }
            .stat-label {
              font-weight: bold;
              color: #6b7280;
            }
            .stat-value {
              font-size: 24px;
              color: #1e40af;
            }
          </style>
        </head>
        <body>
          <h1>Pest.i Reports & Analytics</h1>
          <p>Generated: ${format(new Date(), "MMMM dd, yyyy 'at' HH:mm")}</p>
          <p>Date Range: ${format(
            getDateRange(dateRange).start,
            "MMM dd, yyyy"
          )} - ${format(getDateRange(dateRange).end, "MMM dd, yyyy")}</p>
          
          <div class="summary">
            <h2>Summary Statistics</h2>
            <div class="stat">
              <div class="stat-label">Total Observations</div>
              <div class="stat-value">${filteredObservations.length}</div>
            </div>
            <div class="stat">
              <div class="stat-label">Average Pest Count</div>
              <div class="stat-value">${
                filteredObservations.length > 0
                  ? (
                      filteredObservations.reduce(
                        (sum, obs) => sum + obs.count,
                        0
                      ) / filteredObservations.length
                    ).toFixed(1)
                  : 0
              }</div>
            </div>
            <div class="stat">
              <div class="stat-label">Above Threshold</div>
              <div class="stat-value">${
                filteredObservations.filter((obs) => obs.aboveThreshold).length
              }</div>
            </div>
            <div class="stat">
              <div class="stat-label">Actions Taken</div>
              <div class="stat-value">${
                filteredObservations.filter((obs) => obs.actionTaken).length
              }</div>
            </div>
          </div>

          <h2>Observation Details</h2>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Pest Type</th>
                <th>Count</th>
                <th>Threshold</th>
                <th>Above Threshold</th>
                <th>Season</th>
                <th>Field Stage</th>
                <th>Action Taken</th>
              </tr>
            </thead>
            <tbody>
              ${filteredObservations
                .map(
                  (obs) => `
                <tr>
                  <td>${obs.date}</td>
                  <td>${obs.pestType}</td>
                  <td>${obs.count}</td>
                  <td>${obs.threshold}</td>
                  <td>${obs.aboveThreshold ? "Yes" : "No"}</td>
                  <td>${obs.season}</td>
                  <td>${obs.fieldStage}</td>
                  <td>${obs.actionTaken ? "Yes" : "No"}</td>
                </tr>
              `
                )
                .join("")}
            </tbody>
          </table>
        </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();

    // Wait for content to load, then trigger print
    setTimeout(() => {
      printWindow.print();
    }, 250);
  };

  const handleExport = (format: string) => {
    if (format === "CSV") {
      handleExportCSV();
    } else if (format === "PDF") {
      handleExportPDF();
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl">Pest.i Reports & Analytics</h1>
          <p className="text-muted-foreground">
            Historical data analysis and performance insights
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={() => handleExport("PDF")}>
            <FileText className="h-4 w-4 mr-2" />
            Export PDF (Data)
          </Button>
          <Button variant="outline" onClick={handleExportPDFWithCharts}>
            <Download className="h-4 w-4 mr-2" />
            Export PDF (with Charts)
          </Button>
          <Button variant="outline" onClick={() => handleExport("CSV")}>
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Filters and Controls */}
      <Card className="p-6">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center space-x-2">
            <CalendarIcon className="h-4 w-4 text-muted-foreground" />
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Data</SelectItem>
                <SelectItem value="1month">Last Month</SelectItem>
                <SelectItem value="3months">Last 3 Months</SelectItem>
                <SelectItem value="6months">Last 6 Months</SelectItem>
                <SelectItem value="1year">Last Year</SelectItem>
                <SelectItem value="custom">Custom Range</SelectItem>
              </SelectContent>
            </Select>
            {dateRange === "custom" && (
              <Popover open={datePopoverOpen} onOpenChange={setDatePopoverOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm">
                    <CalendarIcon className="h-4 w-4 mr-2" />
                    {customDateRange.from && customDateRange.to
                      ? `${format(customDateRange.from, "MMM d")} - ${format(
                          customDateRange.to,
                          "MMM d, yyyy"
                        )}`
                      : "Select Range"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <div className="p-3">
                    <Calendar
                      mode="range"
                      selected={customDateRange}
                      onSelect={(range: PickerDateRange | undefined) =>
                        setCustomDateRange(
                          range || { from: undefined, to: undefined }
                        )
                      }
                      defaultMonth={customDateRange?.from || new Date()}
                      numberOfMonths={1}
                      initialFocus
                    />
                    <div className="flex gap-2 pt-3 mt-3 border-t">
                      <Button
                        size="sm"
                        onClick={applyCustomDateRange}
                        disabled={!customDateRange.from || !customDateRange.to}
                        className="flex-1"
                      >
                        Apply Range
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={clearCustomDateRange}
                        className="flex-1"
                      >
                        Clear
                      </Button>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={reportType} onValueChange={setReportType}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="summary">Summary Report</SelectItem>
                <SelectItem value="detailed">Detailed Analysis</SelectItem>
                <SelectItem value="field">Field Performance</SelectItem>
                <SelectItem value="pest">Pest Analysis</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search fields, pests, dates..."
              className="w-48"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </Card>

      {/* Report Tabs */}
      <Tabs
        defaultValue="trends"
        className="space-y-6"
        value={
          reportType === "summary"
            ? "trends"
            : reportType === "detailed"
            ? "weekly"
            : reportType === "field"
            ? "performance"
            : reportType === "pest"
            ? "pest"
            : "trends"
        }
        onValueChange={(value: string) => {
          if (value === "trends") setReportType("summary");
          else if (value === "performance") setReportType("field");
          else if (value === "weekly") setReportType("detailed");
          else if (value === "pest") setReportType("pest");
        }}
      >
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="trends">Trend Analysis</TabsTrigger>
          <TabsTrigger value="performance">Field Performance</TabsTrigger>
          <TabsTrigger value="weekly">Weekly Reports</TabsTrigger>
          <TabsTrigger value="pest">Pest Distribution</TabsTrigger>
        </TabsList>

        <TabsContent value="trends" className="space-y-6">
          {monthlyTrends.length === 0 ? (
            <EmptyState
              title="No Trend Data Available"
              description="There are no observations for the selected date range. Try adjusting your filters or date range."
            />
          ) : (
            <>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-medium">
                      Pest Population Trends (
                      {dateRange === "custom" &&
                      customDateRange.from &&
                      customDateRange.to
                        ? `${format(customDateRange.from, "MMM d")} - ${format(
                            customDateRange.to,
                            "MMM d, yyyy"
                          )}`
                        : dateRange === "1month"
                        ? "Last Month"
                        : dateRange === "3months"
                        ? "Last 3 Months"
                        : dateRange === "6months"
                        ? "Last 6 Months"
                        : dateRange === "1year"
                        ? "Last Year"
                        : "Selected Period"}
                      )
                    </h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        handleExportChartPDF(
                          '[data-chart="pest-trends"]',
                          "Pest Population Trends"
                        )
                      }
                      className="h-8"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                  <div
                    data-chart="pest-trends"
                    data-chart-title="Pest Population Trends"
                  >
                    <defs>
                      <linearGradient
                        id="pestTrendGradient"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="0%"
                          stopColor="#3b82f6"
                          stopOpacity={0.2}
                        />
                        <stop
                          offset="100%"
                          stopColor="#3b82f6"
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>
                    <ResponsiveContainer width="100%" height={300}>
                      <AreaChart data={monthlyTrends}>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          vertical={false}
                          opacity={0.3}
                        />
                        <XAxis
                          dataKey="month"
                          angle={-45}
                          textAnchor="end"
                          height={60}
                          tick={{ fontSize: 11, fill: chartColors.muted }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <YAxis
                          tick={{ fontSize: 11, fill: chartColors.muted }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <Tooltip
                          contentStyle={{
                            borderRadius: "8px",
                            border: "none",
                            boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                          }}
                        />
                        <Area
                          type="monotone"
                          dataKey="blackRiceBug"
                          stroke="#3b82f6"
                          strokeWidth={2}
                          fill="url(#pestTrendGradient)"
                          name="Black Rice Bug"
                          activeDot={{
                            r: 4,
                            fill: "#3b82f6",
                            strokeWidth: 2,
                            stroke: chartColors.background,
                          }}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </Card>

                <Card className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-medium">Crop Damage Trends</h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        handleExportChartPDF(
                          '[data-chart="damage-trends"]',
                          "Crop Damage Trends"
                        )
                      }
                      className="h-8"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                  <div
                    data-chart="damage-trends"
                    data-chart-title="Crop Damage Trends"
                  >
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={monthlyTrends}>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          vertical={false}
                          opacity={0.3}
                        />
                        <XAxis
                          dataKey="month"
                          angle={-45}
                          textAnchor="end"
                          height={60}
                          tick={{ fontSize: 11, fill: chartColors.muted }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <YAxis
                          tick={{ fontSize: 11, fill: chartColors.muted }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <Tooltip
                          contentStyle={{
                            borderRadius: "8px",
                            border: "none",
                            boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                          }}
                        />
                        <Bar
                          dataKey="totalDamage"
                          fill="#f59e0b"
                          name="Total Damage %"
                          radius={[4, 4, 0, 0]}
                          fillOpacity={0.9}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </Card>
              </div>

              <Card className="p-6">
                <h3 className="mb-4">Monthly Summary Statistics</h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Month</TableHead>
                      <TableHead>Black Rice Bug</TableHead>
                      <TableHead>Total Damage (%)</TableHead>
                      <TableHead>Fields Affected</TableHead>
                      <TableHead>Trend</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {monthlyTrends.map((month, index) => (
                      <TableRow key={month.month}>
                        <TableCell className="font-medium">
                          {month.month}
                        </TableCell>
                        <TableCell>{month.blackRiceBug}</TableCell>
                        <TableCell>
                          <span
                            className={
                              month.totalDamage > 20
                                ? "text-red-600"
                                : month.totalDamage > 10
                                ? "text-yellow-600"
                                : "text-green-600"
                            }
                          >
                            {month.totalDamage}%
                          </span>
                        </TableCell>
                        <TableCell>{month.fieldsAffected}</TableCell>
                        <TableCell>
                          {index > 0 && (
                            <div className="flex items-center">
                              <TrendingUp
                                className={`h-4 w-4 ${
                                  month.totalDamage >
                                  monthlyTrends[index - 1].totalDamage
                                    ? "text-red-500 rotate-0"
                                    : "text-green-500 rotate-180"
                                }`}
                              />
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>
            </>
          )}
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          {fieldPerformance.length === 0 ? (
            <EmptyState
              title="No Field Performance Data"
              description="There are no field performance records for the selected filters. Try adjusting your search or date range."
            />
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="p-6">
                  <div className="flex items-center space-x-2 mb-2">
                    <Activity className="h-5 w-5 text-green-500" />
                    <h3>Average Efficiency</h3>
                  </div>
                  <div className="text-2xl font-bold">
                    {fieldPerformance.length > 0
                      ? Math.round(
                          fieldPerformance.reduce(
                            (sum, f) => sum + f.efficiency,
                            0
                          ) / fieldPerformance.length
                        )
                      : 0}
                    %
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Across all fields
                  </p>
                </Card>

                <Card className="p-6">
                  <div className="flex items-center space-x-2 mb-2">
                    <Bug className="h-5 w-5 text-red-500" />
                    <h3>Total Alerts</h3>
                  </div>
                  <div className="text-2xl font-bold">
                    {
                      filteredObservations.filter((obs) => obs.aboveThreshold)
                        .length
                    }
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {dateRange === "6months"
                      ? "Last 6 months"
                      : `Selected period`}
                  </p>
                </Card>

                <Card className="p-6">
                  <div className="flex items-center space-x-2 mb-2">
                    <TrendingUp className="h-5 w-5 text-blue-500" />
                    <h3>Best Performing Field</h3>
                  </div>
                  <div className="text-2xl font-bold">
                    {fieldPerformance.length > 0
                      ? fieldPerformance.sort(
                          (a, b) => b.efficiency - a.efficiency
                        )[0].field
                      : "N/A"}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {fieldPerformance.length > 0
                      ? `${
                          fieldPerformance.sort(
                            (a, b) => b.efficiency - a.efficiency
                          )[0].efficiency
                        }% efficiency`
                      : "No data"}
                  </p>
                </Card>
              </div>

              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-medium">Field Performance Analysis</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      handleExportChartPDF(
                        '[data-chart="field-performance"]',
                        "Field Performance Analysis"
                      )
                    }
                    className="h-8"
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Field</TableHead>
                      <TableHead>Total Alerts</TableHead>
                      <TableHead>Avg Damage (%)</TableHead>
                      <TableHead>Efficiency (%)</TableHead>
                      <TableHead>Last Treatment</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {fieldPerformance.map((field) => (
                      <TableRow key={field.field}>
                        <TableCell className="font-medium">
                          {field.field}
                        </TableCell>
                        <TableCell>{field.totalAlerts}</TableCell>
                        <TableCell>
                          <span
                            className={
                              field.avgDamage > 15
                                ? "text-red-600"
                                : field.avgDamage > 8
                                ? "text-yellow-600"
                                : "text-green-600"
                            }
                          >
                            {field.avgDamage}%
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <span
                              className={
                                field.efficiency > 90
                                  ? "text-green-600"
                                  : field.efficiency > 80
                                  ? "text-yellow-600"
                                  : "text-red-600"
                              }
                            >
                              {field.efficiency}%
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>{field.lastTreatment}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              field.efficiency > 90
                                ? "default"
                                : field.efficiency > 80
                                ? "secondary"
                                : "destructive"
                            }
                          >
                            {field.efficiency > 90
                              ? "Excellent"
                              : field.efficiency > 80
                              ? "Good"
                              : "Needs Attention"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>
            </>
          )}
        </TabsContent>

        <TabsContent value="weekly" className="space-y-6">
          {weeklyReports.length === 0 ? (
            <EmptyState
              title="No Weekly Reports Available"
              description="There are no weekly reports for the selected date range. Try adjusting your filters."
            />
          ) : (
            <>
              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-medium">Weekly Activity Reports</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      handleExportChartPDF(
                        '[data-chart="weekly-reports"]',
                        "Weekly Activity Reports"
                      )
                    }
                    className="h-8"
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Week</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Avg Temperature</TableHead>
                      <TableHead>Avg Humidity</TableHead>
                      <TableHead>Pest Alerts</TableHead>
                      <TableHead>Damage Level</TableHead>
                      <TableHead>Actions Taken</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {weeklyReports.map((week) => (
                      <TableRow key={week.week}>
                        <TableCell className="font-medium">
                          {week.week}
                        </TableCell>
                        <TableCell>{week.date}</TableCell>
                        <TableCell>{week.avgTemp}°C</TableCell>
                        <TableCell>{week.avgHumidity}%</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              week.pestAlerts > 15
                                ? "destructive"
                                : week.pestAlerts > 10
                                ? "secondary"
                                : "default"
                            }
                          >
                            {week.pestAlerts}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              week.damageLevel === "High"
                                ? "destructive"
                                : week.damageLevel === "Medium"
                                ? "secondary"
                                : "default"
                            }
                          >
                            {week.damageLevel}
                          </Badge>
                        </TableCell>
                        <TableCell>{week.actionsTaken}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>

              <Card className="p-6">
                <h3 className="mb-4 font-medium">
                  Weekly Temperature & Humidity Trends
                </h3>
                <div
                  data-chart="weekly-reports"
                  data-chart-title="Weekly Activity Reports"
                >
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={weeklyReports}>
                      <defs>
                        <linearGradient
                          id="tempGradient"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="0%"
                            stopColor={chartColors.chart4}
                            stopOpacity={0.2}
                          />
                          <stop
                            offset="100%"
                            stopColor={chartColors.chart4}
                            stopOpacity={0}
                          />
                        </linearGradient>
                        <linearGradient
                          id="humidGradient"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="0%"
                            stopColor={chartColors.chart1}
                            stopOpacity={0.2}
                          />
                          <stop
                            offset="100%"
                            stopColor={chartColors.chart1}
                            stopOpacity={0}
                          />
                        </linearGradient>
                      </defs>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        vertical={false}
                        opacity={0.3}
                      />
                      <XAxis
                        dataKey="week"
                        tick={{ fontSize: 11, fill: chartColors.muted }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fontSize: 11, fill: chartColors.muted }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip
                        contentStyle={{
                          borderRadius: "8px",
                          border: "none",
                          boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="avgTemp"
                        stroke={chartColors.chart4}
                        strokeWidth={2}
                        fill="url(#tempGradient)"
                        name="Temperature (°C)"
                      />
                      <Area
                        type="monotone"
                        dataKey="avgHumidity"
                        stroke={chartColors.chart1}
                        strokeWidth={2}
                        fill="url(#humidGradient)"
                        name="Humidity (%)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            </>
          )}
        </TabsContent>

        <TabsContent value="pest" className="space-y-6">
          {pestDistribution.length === 0 ? (
            <EmptyState
              title="No Pest Distribution Data"
              description="There are no pest observations for the selected filters. Try adjusting your search or date range."
            />
          ) : (
            <>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-medium">
                      Pest Distribution (
                      {dateRange === "custom" &&
                      customDateRange.from &&
                      customDateRange.to
                        ? `${format(customDateRange.from, "MMM d")} - ${format(
                            customDateRange.to,
                            "MMM d, yyyy"
                          )}`
                        : dateRange === "1month"
                        ? "Last Month"
                        : dateRange === "3months"
                        ? "Last 3 Months"
                        : dateRange === "6months"
                        ? "Last 6 Months"
                        : dateRange === "1year"
                        ? "Last Year"
                        : "Selected Period"}
                      )
                    </h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        handleExportChartPDF(
                          '[data-chart="pest-distribution"]',
                          "Pest Distribution"
                        )
                      }
                      className="h-8"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                  <div
                    data-chart="pest-distribution"
                    data-chart-title="Pest Distribution"
                  >
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={pestDistribution}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={90}
                          paddingAngle={3}
                          dataKey="value"
                          strokeWidth={0}
                          cornerRadius={4}
                        >
                          {pestDistribution.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={
                                index === 0
                                  ? chartColors.chart3
                                  : chartColors.chart1
                              }
                            />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            borderRadius: "8px",
                            border: "none",
                            boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                          }}
                        />
                        <Legend
                          verticalAlign="bottom"
                          height={36}
                          iconType="circle"
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </Card>

                <Card className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-medium">Pest Activity by Month</h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        handleExportChartPDF(
                          '[data-chart="pest-activity-monthly"]',
                          "Pest Activity by Month"
                        )
                      }
                      className="h-8"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                  <div
                    data-chart="pest-activity-monthly"
                    data-chart-title="Pest Activity by Month"
                  >
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={monthlyTrends}>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          vertical={false}
                          opacity={0.3}
                        />
                        <XAxis
                          dataKey="month"
                          angle={-45}
                          textAnchor="end"
                          height={60}
                          tick={{ fontSize: 11, fill: chartColors.muted }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <YAxis
                          tick={{ fontSize: 11, fill: chartColors.muted }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <Tooltip
                          contentStyle={{
                            borderRadius: "8px",
                            border: "none",
                            boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                          }}
                        />
                        <Bar
                          dataKey="blackRiceBug"
                          fill={chartColors.chart3}
                          name="Black Rice Bug"
                          radius={[4, 4, 0, 0]}
                          fillOpacity={0.9}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </Card>
              </div>

              <Card className="p-6">
                <h3 className="mb-4">Pest Control Effectiveness</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium mb-3">Black Rice Bug Control</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Early Detection Rate</span>
                        <span className="font-medium">89%</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Treatment Success Rate</span>
                        <span className="font-medium">76%</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Population Reduction</span>
                        <span className="font-medium text-green-600">-23%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
