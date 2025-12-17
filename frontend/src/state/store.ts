import { create } from "zustand";
import type {
  AlertRecord,
  ForecastData,
  KPIMetrics,
  PestObservation,
  BackendForecastResponse,
} from "@/shared/types/data";
import * as dataService from "@/shared/lib/data-service";
import { apiClient } from "@/shared/lib/api-client";
import type { FilterValues } from "@/shared/types/filters";
import { createDefaultFilters } from "@/shared/types/filters";

// Mock mode removed


export const DEFAULT_KPIS: KPIMetrics = {
  totalObservations: 0,
  averagePestCount: 0,
  percentAboveThreshold: 0,
  totalActionsTaken: 0,
  actionRate: 0,
  currentFieldStage: "N/A",
  mostAffectedStage: "N/A",
};

interface DashboardState {
  filters: FilterValues;
  forecastHorizon: 7 | 14 | 30;
  observations: PestObservation[];
  filteredObservations: PestObservation[];
  forecasts: ForecastData[];
  alerts: AlertRecord[];
  alertUnreadCount: number;
  kpis: KPIMetrics;
  loading: boolean;
  error?: string;
  initialize: () => Promise<void>;
  refreshData: () => Promise<void>;
  loadAlerts: () => Promise<void>;
  markAlertRead: (id: string) => void;
  markAllAlertsRead: () => void;
  setFilters: (filters: FilterValues) => void;
  setForecastHorizon: (horizon: 7 | 14 | 30) => void;
}

// DataProvider abstraction removed


const applyFilters = (
  observations: PestObservation[],
  filters: FilterValues,
) => {
  // Convert null dateRange to undefined for compatibility with dataService
  const safeFilters = {
    ...filters,
    dateRange: filters.dateRange || undefined,
  };
  const filtered = dataService.filterObservations(observations, safeFilters);
  const kpis = dataService.calculateKPIs(filtered);
  return { filtered, kpis };
};

export const useDashboardStore = create<DashboardState>((set, get) => ({
  filters: createDefaultFilters(),
  forecastHorizon: 14,
  observations: [],
  filteredObservations: [],
  forecasts: [],
  alerts: [],
  alertUnreadCount: 0,
  kpis: DEFAULT_KPIS,
  loading: false,
  error: undefined,
  initialize: async () => {
    // #region agent log
    // #endregion
    if (get().observations.length === 0) {
      await get().refreshData();
    }
    if (get().alerts.length === 0) {
      await get().loadAlerts();
    }
  },
  refreshData: async () => {
    set({ loading: true, error: undefined });
    try {
      let observations: PestObservation[] = [];
      let forecasts: ForecastData[] = [];

      // Observations: Load from mock data generator
      observations = dataService.getObservations();
      
      // Check if data loaded successfully
      if (observations.length === 0) {
        console.warn("No observations generated from mock data. Check mock data generator.");
        const errorMsg = "No data available. Please check console for details.";
        set({ 
          error: errorMsg,
          observations: [],
          filteredObservations: [],
          kpis: DEFAULT_KPIS,
          loading: false 
        });
        return;
      }
      
      console.log(`Loaded ${observations.length} observations from mock data generator`);

      // Forecasts: Fetch from real backend and map to frontend format
      try {
        const forecastResponse = await apiClient.get<BackendForecastResponse>("/dashboard/forecast");
        if (forecastResponse?.success && forecastResponse?.data?.forecasted?.future_dates) {
          const { future_dates, forecast, ci_lower, ci_upper } = forecastResponse.data.forecasted;

          // Map indexed objects to array
          forecasts = Object.keys(future_dates).map((key) => {
            const date = future_dates[key];
            const predicted = forecast[key] || 0;
            const lower = ci_lower ? ci_lower[key] : Math.max(0, predicted - 5);
            const upper = ci_upper ? ci_upper[key] : predicted + 5;

            return {
              date,
              pestType: "Black Rice Bug",
              predicted,
              lowerBound: lower,
              upperBound: upper,
              confidence: 0.85
            };
          });
        }
      } catch (err) {
        console.warn("Failed to fetch forecasts, falling back to mock data", err);
        // Fallback to mock forecast data
        forecasts = dataService.getForecastData();
      }
      
      // If still no forecasts after API and mock fallback, use empty array
      if (!forecasts || forecasts.length === 0) {
        console.warn("No forecast data available from API or mocks");
        forecasts = [];
      }

      const { filtered, kpis } = applyFilters(observations, get().filters);

      // #region agent log
      // #endregion

      set({
        observations,
        filteredObservations: filtered,
        forecasts,
        kpis,
        loading: false,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to load data";
      console.error("Error in refreshData:", error);
      set({
        error: errorMessage,
        loading: false,
      });
    }
  },
  loadAlerts: async () => {
    try {
      const storedReads =
        typeof localStorage !== "undefined"
          ? JSON.parse(localStorage.getItem("mock_alert_reads") || "[]")
          : [];
      // Alerts still mocked for now as backend implementation wasn't specified, but removing dataProvider dependency
      const alerts = dataService.getAlerts().map((alert) => ({
        ...alert,
        read: storedReads.includes(alert.id) ? true : alert.read,
      }));
      const unread = alerts.filter((a) => !a.read).length;
      set({ alerts, alertUnreadCount: unread });
    } catch (error) {
      console.error("Error loading alerts:", error);
      // Fallback to empty alerts on error
      set({ alerts: [], alertUnreadCount: 0 });
    }
  },
  markAlertRead: (id: string) => {
    const { alerts } = get();
    const updated = alerts.map((a) =>
      a.id === id ? { ...a, read: true } : a,
    );
    const unread = updated.filter((a) => !a.read).length;
    if (typeof localStorage !== "undefined") {
      const readIds = updated.filter((a) => a.read).map((a) => a.id);
      localStorage.setItem("mock_alert_reads", JSON.stringify(readIds));
    }
    set({ alerts: updated, alertUnreadCount: unread });
  },
  markAllAlertsRead: () => {
    const { alerts } = get();
    const updated = alerts.map((a) => ({ ...a, read: true }));
    if (typeof localStorage !== "undefined") {
      const readIds = updated.map((a) => a.id);
      localStorage.setItem("mock_alert_reads", JSON.stringify(readIds));
    }
    set({ alerts: updated, alertUnreadCount: 0 });
  },
  setFilters: (nextFilters: FilterValues) => {
    const { observations } = get();
    const { filtered, kpis } = applyFilters(observations, nextFilters);

    // #region agent log
    // #endregion

    set({
      filters: nextFilters,
      filteredObservations: filtered,
      kpis,
    });

    // #region agent log
    // #endregion
  },
  setForecastHorizon: (horizon: 7 | 14 | 30) => {
    set({ forecastHorizon: horizon });
  },
}));

