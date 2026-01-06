/**
 * Data service - utility functions only.
 * All data fetching is done via API calls in the store.
 * This file contains only utility functions for filtering and calculations.
 */
import type {
  KPIMetrics,
  PestObservation,
} from "@/shared/types/data";

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
      // Compare dates directly - end date is already set to end of day (23:59:59.999)
      // and start date is set to beginning of day (00:00:00) in applyDateRange
      const obsTime = obsDate.getTime();
      const startTime = filters.dateRange.start.getTime();
      const endTime = filters.dateRange.end.getTime();
      // Inclusive range: include observations on start and end dates
      if (obsTime < startTime || obsTime > endTime) return false;
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
