import { generateForecastData } from "@/mocks/forecasting.mock";
import { generateObservations } from "@/mocks/pests.mock";
import type {
  KPIMetrics,
  PestObservation,
  ForecastData,
  AlertRecord,
} from "@/shared/types/data";

// Cache the data
let cachedObservations: PestObservation[] | null = null;
let cachedForecasts: ForecastData[] | null = null;
let cachedAlerts: AlertRecord[] | null = null;

/**
 * Get observations from mock data generator
 * Mock data is generated on-demand and cached for performance
 */
export const getObservations = (): PestObservation[] => {
  if (cachedObservations && cachedObservations.length > 0) {
    return cachedObservations;
  }
  
  cachedObservations = generateObservations();
  return cachedObservations;
};

/**
 * Async version for backward compatibility
 * Since CSV is now bundled, this is effectively synchronous
 */
export const getObservationsAsync = async (): Promise<PestObservation[]> => {
  return Promise.resolve(getObservations());
};

export const getForecastData = (): ForecastData[] => {
  if (!cachedForecasts) {
    cachedForecasts = generateForecastData();
  }
  return cachedForecasts;
};

const baseAlerts: AlertRecord[] = [
  {
    id: "alert-1",
    title: "Critical pest threshold exceeded",
    message: "Black Rice Bug count surpassed 50 in Field A-12. Immediate action recommended.",
    type: "alert",
    timestamp: new Date(Date.now() - 15 * 60 * 1000),
    read: false,
    priority: "high",
    category: "threshold",
    metadata: {
      pestType: "Black Rice Bug",
      location: "Field A-12",
      count: 67,
      threshold: 50,
    },
  },
  {
    id: "alert-2",
    title: "Forecast: elevated Black Rice Bug risk",
    message: "Model projects rising counts over the next 7 days. Prepare interventions.",
    type: "warning",
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
    read: false,
    priority: "high",
    category: "forecast",
    metadata: {
      pestType: "Black Rice Bug",
      location: "Southern sector",
    },
  },
  {
    id: "alert-3",
    title: "Inspection required",
    message: "3 fields need follow-up after threshold breaches.",
    type: "warning",
    timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
    read: false,
    priority: "medium",
    category: "action-required",
  },
  {
    id: "alert-4",
    title: "System sync complete",
    message: "Latest observations synchronized from field devices.",
    type: "info",
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
    read: true,
    priority: "low",
    category: "system",
  },
];

export const getAlerts = (): AlertRecord[] => {
  if (!cachedAlerts) {
    cachedAlerts = baseAlerts;
  }
  return cachedAlerts;
};

// Filter observations based on criteria
export const filterObservations = (
  observations: PestObservation[],
  filters: {
    year?: number;
    season?: "Dry" | "Wet" | "All";
    fieldStage?: string;
    pestType?: "Black Rice Bug" | "All";
    dateRange?: { start: Date; end: Date };
    thresholdStatus?: "Below" | "Above" | "All";
    actionStatus?: "Taken" | "Not Taken" | "All";
  },
): PestObservation[] => {
  const initialCount = observations.length;
  const filtered = observations.filter(obs => {
    const obsDate = new Date(obs.date);

    if (filters.year && obsDate.getFullYear() !== filters.year) return false;
    if (filters.season && filters.season !== 'All' && obs.season !== filters.season) return false;
    if (filters.fieldStage && filters.fieldStage !== 'All' && obs.fieldStage !== filters.fieldStage) return false;
    if (filters.pestType && filters.pestType !== 'All' && obs.pestType !== filters.pestType) return false;

    if (filters.dateRange) {
      if (obsDate < filters.dateRange.start || obsDate > filters.dateRange.end) return false;
    }

    if (filters.thresholdStatus) {
      if (filters.thresholdStatus === 'Above' && !obs.aboveThreshold) return false;
      if (filters.thresholdStatus === 'Below' && obs.aboveThreshold) return false;
    }

    if (filters.actionStatus) {
      if (filters.actionStatus === 'Taken' && !obs.actionTaken) return false;
      if (filters.actionStatus === 'Not Taken' && obs.actionTaken) return false;
    }

    return true;
  });

  // #region agent log
  // #endregion

  return filtered;
};

// Calculate KPIs
export const calculateKPIs = (observations: PestObservation[]): KPIMetrics => {
  if (observations.length === 0) {
    return {
      totalObservations: 0,
      averagePestCount: 0,
      percentAboveThreshold: 0,
      totalActionsTaken: 0,
      actionRate: 0,
      currentFieldStage: 'N/A',
      mostAffectedStage: 'N/A'
    };
  }

  const totalObservations = observations.length;
  const totalPestCount = observations.reduce((sum, obs) => sum + obs.count, 0);
  const averagePestCount = totalPestCount / totalObservations;
  const aboveThresholdCount = observations.filter(obs => obs.aboveThreshold).length;
  const percentAboveThreshold = (aboveThresholdCount / totalObservations) * 100;
  const totalActionsTaken = observations.filter(obs => obs.actionTaken).length;
  const actionRate = (totalActionsTaken / totalObservations) * 100;

  // Get most recent stage as current
  const sortedObs = [...observations].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const currentFieldStage = sortedObs[0]?.fieldStage || 'N/A';

  // Find most affected stage
  const stageCounts: Record<string, number> = {};
  observations.forEach(obs => {
    stageCounts[obs.fieldStage] = (stageCounts[obs.fieldStage] || 0) + obs.count;
  });
  const mostAffectedStage = Object.keys(stageCounts).reduce((a, b) =>
    stageCounts[a] > stageCounts[b] ? a : b, 'N/A'
  );

  // #region agent log
  // #endregion

  return {
    totalObservations,
    averagePestCount: Math.round(averagePestCount * 10) / 10,
    percentAboveThreshold: Math.round(percentAboveThreshold * 10) / 10,
    totalActionsTaken,
    actionRate: Math.round(actionRate * 10) / 10,
    currentFieldStage,
    mostAffectedStage
  };
};
