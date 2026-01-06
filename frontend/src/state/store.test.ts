import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { createDefaultFilters } from "@/shared/types/filters";
import {
  useDashboardStore,
  DEFAULT_KPIS,
  setDashboardDataProvider,
  setDashboardMockMode,
} from "./store";

const mockObservations = [
  {
    id: "1",
    date: "2024-01-01",
    pestType: "Black Rice Bug" as const,
    count: 60,
    threshold: 50,
    aboveThreshold: true,
    season: "Dry" as const,
    fieldStage: "Seedling",
    location: "Field A",
    actionTaken: true,
  },
  {
    id: "2",
    date: "2024-01-05",
    pestType: "Black Rice Bug" as const,
    count: 20,
    threshold: 50,
    aboveThreshold: false,
    season: "Dry" as const,
    fieldStage: "Vegetative",
    location: "Field B",
    actionTaken: false,
  },
];

const mockForecasts = [
  {
    date: "2024-01-10",
    pestType: "Black Rice Bug" as const,
    predicted: 65,
    lowerBound: 50,
    upperBound: 75,
    confidence: 90,
  },
];

describe("useDashboardStore", () => {
  let obsCalls = 0;
  let forecastCalls = 0;
let alertCalls = 0;

  beforeEach(() => {
    process.env.VITE_USE_MOCKS = "true";
    setDashboardMockMode(true);
    setDashboardDataProvider({
      getObservations: () => {
        obsCalls += 1;
        return mockObservations;
      },
      getForecastData: () => {
        forecastCalls += 1;
        return mockForecasts;
      },
      getAlerts: () => {
        alertCalls += 1;
        return [
          {
            id: "alert-1",
            title: "Test Alert",
            message: "Test message",
            type: "alert",
            timestamp: new Date(),
            read: false,
            priority: "high",
            category: "threshold",
          },
        ];
      },
    });

    const { initialize, refreshData, setFilters } = useDashboardStore.getState();
    const baseFilters = createDefaultFilters();
    useDashboardStore.setState({
      filters: {
        ...baseFilters,
        year: 2024,
        dateRange: null,
      },
      observations: [],
      filteredObservations: [],
      forecasts: [],
      kpis: DEFAULT_KPIS,
      loading: false,
      error: undefined,
      initialize,
      refreshData,
      setFilters,
    });
  });

  afterEach(() => {
    delete process.env.VITE_USE_MOCKS;
    setDashboardMockMode(null);
    obsCalls = 0;
    forecastCalls = 0;
    alertCalls = 0;
  });

  it("loads mock observations and computes KPIs", async () => {
    await useDashboardStore.getState().refreshData();

    const state = useDashboardStore.getState();
    expect(obsCalls).toBeGreaterThan(0);
    expect(forecastCalls).toBeGreaterThan(0);
    expect(state.observations).toHaveLength(2);
    expect(state.filteredObservations).toHaveLength(2);
    expect(state.kpis.totalObservations).toBe(2);
    expect(state.kpis.percentAboveThreshold).toBeGreaterThan(0);
  });

  it("updates filtered observations when filters change", async () => {
    await useDashboardStore.getState().refreshData();

    const filters = {
      ...useDashboardStore.getState().filters,
      pestType: "Black Rice Bug" as const,
    };

    useDashboardStore.getState().setFilters(filters);

    const state = useDashboardStore.getState();
    expect(obsCalls).toBeGreaterThan(0);
    expect(state.filteredObservations).toHaveLength(1);
    expect(state.filteredObservations[0].pestType).toBe("Black Rice Bug");
  });

  it("recomputes KPIs when filters change", async () => {
    await useDashboardStore.getState().refreshData();

    const initialKpis = useDashboardStore.getState().kpis;
    expect(initialKpis.totalObservations).toBe(2);

    useDashboardStore
      .getState()
      .setFilters({ ...useDashboardStore.getState().filters, pestType: "Black Rice Bug" });

    const nextKpis = useDashboardStore.getState().kpis;
    expect(nextKpis.totalObservations).toBe(1);
    expect(nextKpis.percentAboveThreshold).toBeGreaterThan(0);
  });

  it("loads alerts and marks them read", async () => {
    await useDashboardStore.getState().loadAlerts();
    const state = useDashboardStore.getState();
    expect(alertCalls).toBeGreaterThan(0);
    expect(state.alerts).toHaveLength(1);
    expect(state.alertUnreadCount).toBe(1);

    useDashboardStore.getState().markAlertRead("alert-1");
    expect(useDashboardStore.getState().alertUnreadCount).toBe(0);
  });
});

