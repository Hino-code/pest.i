# API Compatibility Guide

This document outlines the API endpoints and their compatibility with the frontend.

## ✅ Implemented Endpoints

### Authentication & User Management

- `POST /auth/register` - Register new user
- `POST /auth/login` - Login and get JWT token
- `GET /user/me` - Get current user profile
- `PATCH /user/me` - Update user profile
- `PATCH /user/me/password` - Change password
- `POST /user/me/photo` - Upload profile photo
- `GET /admin/pending-users` - List pending users (admin)
- `POST /admin/pending-users/{id}/approve` - Approve user (admin)
- `POST /admin/pending-users/{id}/reject` - Reject user (admin)

### Dashboard & Data

- `GET /dashboard/observations` - Get pest observations (NEW)
  - Query params: `start`, `end`, `season`, `field_stage`
  - Returns: `PestObservation[]` in frontend format
- `POST /dashboard/kpi` - Get KPIs (UPDATED)
  - Request body: `FilterAll` (start, end, season, field_stage)
  - Returns: `KPIMetrics` matching frontend format
- `GET /dashboard/forecast` - Get forecast data (FIXED)
  - Returns: Forecast with indexed objects for frontend compatibility
- `POST /dashboard/operational` - Get operational dashboard data (FIXED)
  - Returns: threshold_status, action_tracker, recent_alerts

### Filters

- `GET /filters/basic` - Get basic filter options
- `GET /filters/advanced` - Get advanced filter options

### Forecasting

- `GET /forecast/predict` - Get forecast predictions
- `GET /forecast/kpi` - Get forecast KPIs

### Threshold Actions

- `GET /threshold/actions` - Get threshold actions (NEW)
  - Query params: `start`, `end`, `season`, `field_stage`
- `POST /threshold/actions` - Get threshold actions with filters (NEW)
  - Request body: `FilterAll`
- `GET /threshold/status` - Get threshold status summary (NEW)

### Alerts & Notifications

- `GET /alerts` - Get system alerts (NEW)
  - Query params: `limit`, `unread_only`
  - Returns: `AlertRecord[]` in frontend format
- `POST /alerts/{alert_id}/read` - Mark alert as read (NEW)
- `POST /alerts/read-all` - Mark all alerts as read (NEW)

## 🔄 Data Format Compatibility

### PestObservation Format

Backend CSV data is automatically transformed to match frontend expectations:

```typescript
{
  id: string;
  date: string; // YYYY-MM-DD
  pestType: "Black Rice Bug";
  count: number;
  threshold: number;
  aboveThreshold: boolean;
  season: "Dry" | "Wet";
  fieldStage: string;
  actionTaken: boolean;
  actionType?: string;
  actionDate?: string;
}
```

### KPIMetrics Format

```typescript
{
  totalObservations: number;
  averagePestCount: number;
  percentAboveThreshold: number;
  totalActionsTaken: number;
  actionRate: number;
  currentFieldStage: string;
  mostAffectedStage: string;
}
```

### Forecast Format

Forecast data uses indexed objects for frontend compatibility:

```typescript
{
  future_dates: { "0": "2024-12-04", "1": "2024-12-05", ... };
  forecast: { "0": 5.2, "1": 6.1, ... };
  ci_lower: { "0": 4.0, "1": 4.9, ... };
  ci_upper: { "0": 6.4, "1": 7.3, ... };
}
```

### AlertRecord Format

```typescript
{
  id: string;
  title: string;
  message: string;
  type: "alert" | "warning" | "info" | "success";
  timestamp: string; // ISO format
  read: boolean;
  priority: "high" | "medium" | "low";
  category: "pest-alert" | "threshold" | "forecast" | "system" | "action-required";
  metadata?: {
    pestType?: string;
    location?: string;
    count?: number;
    threshold?: number;
  };
}
```

## 📊 Data Integrity

### CSV to Frontend Mapping

- **Pest Type**: RBB → "Black Rice Bug"
- **Threshold**: Determined from "Threshold Status" column
  - "Economic Threshold" → threshold: 10.0
  - "Economic Damage" → threshold: 5.0
  - "Below Threshold" → threshold: 5.0
- **Above Threshold**: `true` if status is "Economic Threshold" or "Economic Damage"
- **Action Taken**: `true` if Action column is "1"
- **Date Format**: Converted to YYYY-MM-DD string format

### Data Validation

- All numeric values are properly typed (float/int)
- Dates are validated and formatted consistently
- Missing values are handled gracefully
- Empty datasets return appropriate defaults

## 🛡️ Error Handling

All endpoints return consistent error format:

```json
{
  "success": false,
  "error": "Error message",
  "details": {} // Optional, for validation errors
}
```

Success responses:

```json
{
  "success": true,
  "data": {}
}
```

## 🔍 Testing Checklist

- [x] Observations endpoint returns correct format
- [x] KPI endpoint matches frontend KPIMetrics
- [x] Forecast endpoint uses indexed objects
- [x] Alerts endpoint returns AlertRecord[]
- [x] Threshold actions endpoint implemented
- [x] Operational dashboard includes all required fields
- [x] Error handling is consistent
- [x] Data transformation preserves accuracy

## 📝 Notes

- All endpoints maintain backward compatibility where possible
- Data transformation happens server-side for consistency
- Frontend can now use real API data instead of mocks
- All numeric values are properly rounded to 1 decimal place
- Dates are consistently formatted as ISO strings
