from fastapi import APIRouter

import numpy as np
from api.utils.forecast_utils import (
    create_feature,
    peak_day,
    recursive_forecast,
    risk_levels,
)
from api.data_loader import df
from api.model_loader import model


forecast_router = APIRouter(prefix="/forecast")

features, y = create_feature(df)
forecast = recursive_forecast(model, features, horizon=7)


@forecast_router.get("/")
def forecast_root():
    return {"success": True, "message": "At forecast router"}


@forecast_router.get("/predict")
def model_predict():
    """
    XGBoost model prediction endpoint.
    Returns forecast data using XGBoost AI model.
    """
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


@forecast_router.get("/kpi")
def forecast_kpi():
    """
    XGBoost forecast KPI endpoint.
    Returns key performance indicators from XGBoost model predictions.
    """
    return {
        "success": True,
        "data": {
            "risk_levels": risk_levels(forecast),
            "day_above_threshold": len(
                [i for i in forecast["forecast"].values() if i >= 10]
            ),
            "avg_predicted": np.round(
                np.array([v for v in forecast["forecast"].values()]).mean(), 1
            ),  # Changed to 1 decimal for consistency with frontend
            "peak_day": peak_day(forecast),
        },
    }
