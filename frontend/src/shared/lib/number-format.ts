/**
 * Number formatting utilities for consistent KPI display across the application.
 * 
 * Best Practices:
 * - Pest counts: 1 decimal place (e.g., 1.0, 15.3)
 * - Percentages: 1 decimal place (e.g., 25.5%)
 * - Whole numbers: No decimals (e.g., 100, 1,234)
 * - Large numbers: Use locale string with commas (e.g., 1,234)
 */

/**
 * Format pest count with 1 decimal place
 * Used for: Average pest count, predicted counts, peak counts
 */
export function formatPestCount(value: number | null | undefined): string {
  if (value === null || value === undefined || isNaN(value)) {
    return "0.0";
  }
  return Number(value).toFixed(1);
}

/**
 * Format percentage with 1 decimal place
 * Used for: Action rates, threshold percentages, efficiency metrics
 */
export function formatPercentage(value: number | null | undefined): string {
  if (value === null || value === undefined || isNaN(value)) {
    return "0.0";
  }
  return Number(value).toFixed(1);
}

/**
 * Format whole number (no decimals)
 * Used for: Total observations, counts, days
 */
export function formatWholeNumber(value: number | null | undefined): string {
  if (value === null || value === undefined || isNaN(value)) {
    return "0";
  }
  return Math.round(value).toString();
}

/**
 * Format number with locale string (commas for thousands)
 * Used for: Large totals, observation counts
 */
export function formatNumberWithCommas(value: number | null | undefined): string {
  if (value === null || value === undefined || isNaN(value)) {
    return "0";
  }
  return Math.round(value).toLocaleString("en-US");
}

/**
 * Format percentage for display (adds % symbol)
 * Used for: KPI cards showing percentages
 */
export function formatPercentageDisplay(value: number | null | undefined): string {
  return `${formatPercentage(value)}%`;
}

/**
 * Format pest count with validation
 * Ensures value is within reasonable bounds and formatted correctly
 */
export function formatPestCountSafe(value: number | null | undefined, min: number = 0, max: number = 10000): string {
  if (value === null || value === undefined || isNaN(value)) {
    return "0.0";
  }
  const clamped = Math.max(min, Math.min(max, value));
  return formatPestCount(clamped);
}

/**
 * Validate and format KPI value based on type
 */
export function formatKPIValue(
  value: number | null | undefined,
  type: "count" | "percentage" | "whole" | "large"
): string {
  switch (type) {
    case "count":
      return formatPestCount(value);
    case "percentage":
      return formatPercentage(value);
    case "whole":
      return formatWholeNumber(value);
    case "large":
      return formatNumberWithCommas(value);
    default:
      return String(value ?? 0);
  }
}
