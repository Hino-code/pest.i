# KPI Formatting Standards

This document outlines the number formatting standards for all KPIs across the application to ensure consistency and readability.

## Formatting Rules

### Pest Counts

- **Format**: 1 decimal place
- **Examples**: `1.0`, `15.3`, `100.5`
- **Used in**:
  - Average Pest Count
  - Peak Day Count
  - Avg Predicted
  - Individual observation counts

### Percentages

- **Format**: 1 decimal place
- **Examples**: `25.5%`, `100.0%`, `0.0%`
- **Used in**:
  - Action Rate
  - Percent Above Threshold
  - Threshold Action Rate
  - Response Coverage
  - Efficiency metrics

### Whole Numbers

- **Format**: No decimals, with comma separators for large numbers
- **Examples**: `100`, `1,234`, `50,000`
- **Used in**:
  - Total Observations
  - Days Above Threshold
  - High Risk Days
  - Total Actions
  - Threshold Events
  - Critical Gap

## Implementation

### Frontend Formatting

All KPI values are formatted using consistent methods:

1. **Pest Counts**: `value.toFixed(1)` or `Number(value.toFixed(1))`
2. **Percentages**: `value.toFixed(1)` with `%` symbol
3. **Whole Numbers**: `Math.round(value)` or `value.toLocaleString()`

### Backend Formatting

Backend calculations return values with appropriate precision:

1. **Pest Counts**: `round(value, 1)` (1 decimal place)
2. **Percentages**: `round(value, 1)` (1 decimal place)
3. **Whole Numbers**: `int(value)` or `round(value)` (no decimals)

## Fixed Issues

### ✅ Peak Day Count

- **Before**: `1.0208501815795898` (too many decimals)
- **After**: `1.0` (1 decimal place)
- **Location**: Forecast page, Peak Day KPI card

### ✅ Avg Predicted

- **Before**: Rounded to whole number
- **After**: `1.0` format (1 decimal place)
- **Location**: Forecast page, Avg Predicted KPI card

### ✅ Average Pest Count

- **Before**: Could display with inconsistent decimals
- **After**: Always `1.0` format (1 decimal place)
- **Location**: Overview page, KPI cards

## Best Practices

1. **Consistency**: All similar metrics use the same formatting
2. **Readability**: Avoid unnecessary decimal places
3. **Precision**: Use appropriate precision for the metric type
4. **Validation**: Handle null/undefined values gracefully
5. **Localization**: Use locale-aware formatting for large numbers

## Files Modified

### Frontend

- `frontend/src/features/forecasting/pages/forecast-page.tsx`
- `frontend/src/features/dashboard/components/kpi-cards.tsx`
- `frontend/src/shared/lib/number-format.ts` (new utility file)

### Backend

- `backend/api/utils/forecast_utils.py`
- `backend/api/routes/forecast.py`

## Validation

All KPI values are validated to ensure:

- No `NaN` or `undefined` values are displayed
- Proper fallback to `0` or `0.0` when data is missing
- Consistent formatting across all pages
- Backend and frontend use matching precision
