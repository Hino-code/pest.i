export interface DateRange {
  start: Date;
  end: Date;
}

export interface FilterValues {
  year: number;
  season: "Dry" | "Wet" | "All";
  fieldStage: string;
  pestType: "Black Rice Bug" | "All";
  dateRange: DateRange | null;
  thresholdStatus: "Below" | "Above" | "All";
  actionStatus: "Taken" | "Not Taken" | "All";
}

/**
 * Create default filters.
 * Year will be set dynamically from backend data.
 * Call createDefaultFiltersWithBackend() for filters with backend data.
 */
export const createDefaultFilters = (): FilterValues => ({
  year: new Date().getFullYear(), // Will be overridden by backend data
  season: "All",
  fieldStage: "All",
  pestType: "All",
  dateRange: null, // Will be set from backend data
  thresholdStatus: "All",
  actionStatus: "All",
});

/**
 * Create default filters with backend data.
 * Fetches actual years and date range from backend.
 */
export async function createDefaultFiltersWithBackend(): Promise<FilterValues> {
  try {
    const { getFilterOptions, getDefaultYear } = await import("../lib/filter-service");
    const options = await getFilterOptions();
    const defaultYear = await getDefaultYear();
    
    // Parse date range from backend
    const minDate = options.dateRange.min ? new Date(options.dateRange.min) : new Date();
    const maxDate = options.dateRange.max ? new Date(options.dateRange.max) : new Date();
    
    // Default pest type: always use "All" to show all data by default
    // This ensures all pages show data regardless of pest type count
    const defaultPestType = "All";
    
    return {
      year: defaultYear,
      season: "All",
      fieldStage: "All",
      pestType: defaultPestType as "Black Rice Bug" | "All",
      dateRange: {
        start: minDate,
        end: maxDate,
      },
      thresholdStatus: "All",
      actionStatus: "All",
    };
  } catch (error) {
    console.error("Failed to create filters from backend, using defaults:", error);
    return createDefaultFilters();
  }
}

