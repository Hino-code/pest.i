from fastapi import APIRouter
import pandas as pd

from api.utils.dashboard_utils import (
    pest_sum,
    average_pest_count,
    above_threshold_level,
    economic_damage,
    action_rate,
    most_affected_field_stage,
    current_field_stage,
    threshold_status_counts,
)
from api._pydanticModel import FilterAll, FilterByDate
from api.data_loader import df
from api.utils.forecast_utils import create_feature, recursive_forecast
from api.model_loader import model

dashboard_router = APIRouter(prefix="/dashboard")


@dashboard_router.get("/")
def dashboard_root():
    return {"success": True, "message": "At dashboard router"}


@dashboard_router.post(
    "/kpi",
    summary="KPI Response",
    description="Compute key performance indicators (KPIs) for a given date range, season, and stage.",
)
def dashboard_kpi(request: FilterAll):
    start_date = pd.to_datetime(request.start)
    end_date = pd.to_datetime(request.end)
    season = request.season
    field_stage = request.field_stage

    return {
        "success": True,
        "data": {
            "pest_sum": pest_sum(df, start_date, end_date, season, field_stage),
            "average_pest_count": average_pest_count(
                df, start_date, end_date, season, field_stage
            ),
            "above_threshold%": above_threshold_level(
                df, start_date, end_date, season, field_stage
            ),
            "economic_damage%": economic_damage(
                df, start_date, end_date, season, field_stage
            ),
            "action_rate%": action_rate(df, start_date, end_date, season, field_stage),
            "most_affected_field_stage": most_affected_field_stage(
                df, start_date, end_date, season
            ),
            "current_field_stage": current_field_stage(
                df, start_date, end_date, season
            ),
        },
    }


@dashboard_router.get("/forecast")
def dashboard_forecast():

    features, y = create_feature(df)
    forecast = recursive_forecast(model, features, horizon=7)
    return {
        "success": True,
        "data": {
            "max_pest_count": df["Pest Count/Damage"].max(),
            "min_pest_count": df["Pest Count/Damage"].min(),
            "current_dates": df["Date"].dt.strftime("%Y-%m-%d").tolist(),
            "actual": df["Pest Count/Damage"].tolist(),
            "forecasted": forecast,
        },
    }


@dashboard_router.post("/operational")
def dashboard_operational(request: FilterAll):
    start_date = pd.to_datetime(request.start)
    end_date = pd.to_datetime(request.end)
    season = request.season
    field_stage = request.field_stage
    return {
        "success": True,
        "data": {
            "threshold_status": threshold_status_counts(df, start_date, end_date, season, field_stage),
            "action_tracker": "",
            "recent_alerts": "",
        },
    }
