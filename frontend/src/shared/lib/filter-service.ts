/**
 * Service for fetching filter options from backend.
 * Ensures all filter options come from actual backend data.
 */
import { apiClient } from "./api-client";

export interface FilterOptions {
  years: number[];
  seasons: string[];
  fieldStages: string[];
  pestTypes: string[];
  thresholdStatuses: string[];
  actionStatuses: string[];
  dateRange: {
    min: string;
    max: string;
  };
}

let cachedFilterOptions: FilterOptions | null = null;

/**
 * Fetch filter options from backend.
 * Returns all available filter values from the actual data.
 */
export async function getFilterOptions(): Promise<FilterOptions> {
  if (cachedFilterOptions) {
    return cachedFilterOptions;
  }

  try {
    // Fetch basic filter options
    const basicResponse = await apiClient.get<{
      success: boolean;
      data: {
        field_stages: string[];
        pest_types: string[];
        date: { min: string; max: string };
        years: number[];
      };
    }>("/filters/basic");

    // Fetch advanced filter options
    const advancedResponse = await apiClient.get<{
      success: boolean;
      data: {
        season: string[];
        threshold_status: string[];
        isActionTaken: string[];
      };
    }>("/filters/advanced");

    if (basicResponse?.success && advancedResponse?.success) {
      const options: FilterOptions = {
        years: basicResponse.data.years, // Already sorted descending from backend
        seasons: ["All", ...advancedResponse.data.season],
        fieldStages: ["All", ...basicResponse.data.field_stages],
        // Always add "All" option to allow showing all data
        pestTypes: ["All", ...basicResponse.data.pest_types],
        thresholdStatuses: ["All", ...advancedResponse.data.threshold_status],
        actionStatuses: ["All", ...advancedResponse.data.isActionTaken.map((v) => 
          v === "1" ? "Taken" : "Not Taken"
        )],
        dateRange: basicResponse.data.date,
      };

      cachedFilterOptions = options;
      return options;
    }

    throw new Error("Failed to fetch filter options");
  } catch (error) {
    console.error("Error fetching filter options:", error);
    // Return empty options as fallback
    return {
      years: [],
      seasons: ["All"],
      fieldStages: ["All"],
      pestTypes: ["All"],
      thresholdStatuses: ["All"],
      actionStatuses: ["All"],
      dateRange: { min: "", max: "" },
    };
  }
}

/**
 * Get the most recent year from backend data.
 * Used as default year in filters.
 */
export async function getDefaultYear(): Promise<number> {
  const options = await getFilterOptions();
  if (options.years.length > 0) {
    return options.years[0]; // First year is already sorted descending (newest first)
  }
  return new Date().getFullYear(); // Fallback to current year
}
