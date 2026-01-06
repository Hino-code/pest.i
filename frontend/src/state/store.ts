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
    // Initialize filters from backend data first (sets default year and date range)
    try {
      const { createDefaultFiltersWithBackend } = await import("@/shared/types/filters");
      const backendFilters = await createDefaultFiltersWithBackend();
      set({ filters: backendFilters });
      console.log("✅ Filters initialized from backend data");
    } catch (error) {
      console.warn("Failed to initialize filters from backend, using defaults:", error);
    }
    
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

      // Observations: Fetch from backend API (100% backend data)
      try {
        const observationsResponse = await apiClient.get<{
          success: boolean;
          data: PestObservation[];
        }>("/dashboard/observations");
        
        if (observationsResponse?.success && observationsResponse?.data) {
          observations = observationsResponse.data;
          console.log(`✅ Loaded ${observations.length} observations from backend`);
        } else {
          throw new Error("Invalid observations response");
        }
      } catch (err) {
        console.error("Failed to fetch observations from backend:", err);
        // Don't use mock data - show error instead
        set({
          error: "Failed to load data from backend. Please check backend connection.",
          observations: [],
          filteredObservations: [],
          kpis: DEFAULT_KPIS,
          loading: false,
        });
        return;
      }

      // Forecasts: Fetch from real backend and map to frontend format
      // Use forecastHorizon from store to get the right number of days
      const horizon = get().forecastHorizon;
      try {
        const forecastResponse = await apiClient.get<BackendForecastResponse>(
          `/dashboard/forecast?horizon=${horizon}`
        );
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
              confidence: 0.92 // XGBoost model accuracy
            };
          });
        }
      } catch (err) {
        console.warn("Failed to fetch forecasts from backend:", err);
        // No mock fallback - use empty array (100% backend data only)
        forecasts = [];
      }

      // Update date range filter to match backend data if not set
      let currentFilters = get().filters;
      if (observations.length > 0 && !currentFilters.dateRange) {
        const dates = observations.map((obs) => new Date(obs.date));
        const minDate = new Date(Math.min(...dates.map((d) => d.getTime())));
        const maxDate = new Date(Math.max(...dates.map((d) => d.getTime())));
        
        currentFilters = {
          ...currentFilters,
          dateRange: {
            start: minDate,
            end: maxDate,
          },
        };
        set({ filters: currentFilters });
      }
      
      const { filtered, kpis } = applyFilters(observations, currentFilters);

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
      // Load alerts from backend API (100% backend data)
      const alertsResponse = await apiClient.get<{
        success: boolean;
        data: AlertRecord[];
      }>("/alerts");
      
      if (alertsResponse?.success && alertsResponse?.data) {
        // Convert timestamp strings to Date objects
        const alerts = alertsResponse.data.map((alert) => ({
          ...alert,
          timestamp: new Date(alert.timestamp),
        }));
        
        // Check localStorage for read status
        const storedReads =
          typeof localStorage !== "undefined"
            ? JSON.parse(localStorage.getItem("mock_alert_reads") || "[]")
            : [];
        
        // Apply stored read status
        const alertsWithReadStatus = alerts.map((alert) => ({
          ...alert,
          read: storedReads.includes(alert.id) ? true : alert.read,
        }));
        
        const unread = alertsWithReadStatus.filter((a) => !a.read).length;
        set({ alerts: alertsWithReadStatus, alertUnreadCount: unread });
      } else {
        // Fallback to empty alerts if backend fails
        set({ alerts: [], alertUnreadCount: 0 });
      }
    } catch (error) {
      console.error("Error loading alerts from backend:", error);
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

