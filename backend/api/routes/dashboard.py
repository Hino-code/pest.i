from fastapi import APIRouter, Query
import pandas as pd
from typing import Optional

from api.utils.dashboard_utils import (
    pest_sum,
    average_pest_count,
    above_threshold_level,
    economic_damage,
    action_rate,
    most_affected_field_stage,
    current_field_stage,
    threshold_status_counts,
    filter_dataset,
)
from api.utils.data_transformer import csv_to_observations, calculate_kpis_from_observations
from api._pydanticModel import FilterAll, FilterByDate
from api.data_loader import df
from api.utils.forecast_utils import create_feature, recursive_forecast
from api.model_loader import model

dashboard_router = APIRouter(prefix="/dashboard")


@dashboard_router.get("/")
def dashboard_root():
    return {"success": True, "message": "At dashboard router"}


@dashboard_router.get("/observations")
def get_observations(
    start: Optional[str] = Query(None, description="Start date (YYYY-MM-DD)"),
    end: Optional[str] = Query(None, description="End date (YYYY-MM-DD)"),
    season: Optional[str] = Query(None, description="Season filter"),
    field_stage: Optional[str] = Query(None, description="Field stage filter"),
):
    """
    Get pest observations in frontend format.
    Returns PestObservation[] compatible with frontend.
    """
    filtered_df = df.copy()
    
    # Apply filters if provided
    if start and end:
        start_date = pd.to_datetime(start)
        end_date = pd.to_datetime(end)
        filtered_df = filter_dataset(filtered_df, start_date, end_date, season, field_stage)
    
    # Convert to frontend format
    observations = csv_to_observations(filtered_df)
    
    return {
        "success": True,
        "data": observations,
    }


@dashboard_router.post(
    "/kpi",
    summary="KPI Response",
    description="Compute key performance indicators (KPIs) for a given date range, season, and stage.",
)
def dashboard_kpi(request: FilterAll):
    """
    Get KPIs in frontend-compatible format.
    Returns KPIMetrics matching frontend expectations.
    """
    start_date = pd.to_datetime(request.start)
    end_date = pd.to_datetime(request.end)
    season = request.season if request.season != "All" else None
    field_stage = request.field_stage if request.field_stage != "All" else None
    
    # Filter data
    filtered_df = filter_dataset(df, start_date, end_date, season, field_stage)
    
    # Convert to observations and calculate KPIs
    observations = csv_to_observations(filtered_df)
    kpis = calculate_kpis_from_observations(observations)
    
    return {
        "success": True,
        "data": kpis,
    }


@dashboard_router.get("/forecast")
def dashboard_forecast(horizon: int = Query(7, ge=1, le=30, description="Forecast horizon in days")):
    """
    Get XGBoost forecast data in frontend-compatible format.
    Uses XGBoost model for AI-powered predictions.
    Returns forecast with future_dates, forecast, ci_lower, ci_upper as indexed objects.
    
    Args:
        horizon: Number of days to forecast (1-30, default: 7)
    """
    try:
        features, y = create_feature(df)
        # Use XGBoost model for forecasting with dynamic horizon
        forecasted = recursive_forecast(model, features, horizon=horizon)
        
        # recursive_forecast returns dict directly with index-based keys
        return {
            "success": True,
            "data": {
                "max_pest_count": float(df["Pest Count/Damage"].max()),
                "min_pest_count": float(df["Pest Count/Damage"].min()),
                "current_dates": df["Date"].dt.strftime("%Y-%m-%d").tolist(),
                "actual": [float(x) for x in df["Pest Count/Damage"].tolist()],
                "forecasted": forecasted,
            },
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "data": {
                "max_pest_count": 0,
                "min_pest_count": 0,
                "current_dates": [],
                "actual": [],
                "forecasted": {
                    "future_dates": {},
                    "forecast": {},
                    "ci_lower": {},
                    "ci_upper": {},
                },
            },
        }


@dashboard_router.post("/operational")
def dashboard_operational(request: FilterAll):
    """
    Get operational dashboard data: threshold status, action tracker, recent alerts.
    """
    start_date = pd.to_datetime(request.start)
    end_date = pd.to_datetime(request.end)
    season = request.season if request.season != "All" else None
    field_stage = request.field_stage if request.field_stage != "All" else None
    
    # Filter data
    filtered_df = filter_dataset(df, start_date, end_date, season, field_stage)
    
    # Threshold status counts
    threshold_status = threshold_status_counts(filtered_df, start_date, end_date, season, field_stage)
    
    # Action tracker - count actions by type
    action_tracker = {}
    if not filtered_df.empty:
        action_df = filtered_df[filtered_df['Action'] == '1']
        if not action_df.empty:
            # Group by date and count
            action_counts = action_df.groupby(action_df['Date'].dt.date).size().to_dict()
            action_tracker = {
                str(date): int(count) for date, count in action_counts.items()
            }
    
    # Recent alerts - observations above threshold in last 7 days
    recent_alerts = []
    if not filtered_df.empty:
        recent_df = filtered_df[
            (filtered_df['Date'] >= end_date - pd.Timedelta(days=7)) &
            (filtered_df['Threshold Status'].isin(['Economic Threshold', 'Economic Damage']))
        ].sort_values('Date', ascending=False).head(10)
        
        for idx, row in recent_df.iterrows():
            recent_alerts.append({
                'id': f"alert-{idx}",
                'date': row['Date'].strftime('%Y-%m-%d'),
                'pestType': 'Black Rice Bug',
                'count': float(row['Pest Count/Damage']),
                'threshold': 10.0 if 'Economic Threshold' in str(row['Threshold Status']) else 5.0,
                'fieldStage': row['Field Stage'],
                'status': row['Threshold Status'],
            })
    
    return {
        "success": True,
        "data": {
            "threshold_status": threshold_status,
            "action_tracker": action_tracker,
            "recent_alerts": recent_alerts,
        },
    }
