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
    // Parse observation date - handle both string and Date objects
    // Normalize to local date (ignore time component) for consistent comparison
    let obsDate: Date;
    if (typeof obs.date === 'string') {
      // Parse date string and normalize to start of day in local timezone
      obsDate = new Date(obs.date);
      // If the date string is in YYYY-MM-DD format, it might be parsed as UTC
      // Normalize to local timezone by creating a new date from the date components
      if (obs.date.match(/^\d{4}-\d{2}-\d{2}$/)) {
        const [year, month, day] = obs.date.split('-').map(Number);
        obsDate = new Date(year, month - 1, day);
      }
    } else {
      obsDate = new Date(obs.date);
    }
    
    // Normalize observation date to start of day in local timezone for consistent comparison
    const obsDateNormalized = new Date(obsDate.getFullYear(), obsDate.getMonth(), obsDate.getDate());
    const obsTime = obsDateNormalized.getTime();
    
    // Normalize observation date to start of day for year comparison
    const obsYear = obsDateNormalized.getFullYear();

    // Year filter: only apply if no date range is selected (date range is more specific)
    // If a date range is selected, it overrides the year filter
    if (!filters.dateRange && filters.year && obsYear !== filters.year) return false;
    if (filters.season && filters.season !== 'All' && obs.season !== filters.season) return false;
    if (filters.fieldStage && filters.fieldStage !== 'All' && obs.fieldStage !== filters.fieldStage) return false;
    if (filters.pestType && filters.pestType !== 'All' && obs.pestType !== filters.pestType) return false;

    if (filters.dateRange) {
      // Normalize filter dates to start/end of day in local timezone
      // The filter dates are already set to start/end of day in applyDateRange,
      // but we normalize them here to ensure consistency with observation dates
      const startDate = new Date(filters.dateRange.start);
      const startDateNormalized = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
      const startTime = startDateNormalized.getTime();
      
      const endDate = new Date(filters.dateRange.end);
      const endDateNormalized = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate(), 23, 59, 59, 999);
      const endTime = endDateNormalized.getTime();
      
      // Inclusive range: include observations on start and end dates
      // Compare normalized dates (ignoring time component for start, including end of day for end)
      // Both dates are now normalized to local timezone, so comparison should work correctly
      const isInRange = obsTime >= startTime && obsTime <= endTime;
      if (!isInRange) return false;
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
