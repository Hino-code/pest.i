from fastapi import APIRouter, Query
from typing import Optional, List, Dict
import pandas as pd
from api.data_loader import df
from api.utils.dashboard_utils import filter_dataset
from api._pydanticModel import FilterAll

threshold_router = APIRouter(prefix="/threshold", tags=["threshold"])


@threshold_router.get("/")
def threshold_root():
    return {"success": True, "message": "At threshold router"}


@threshold_router.get("/actions")
def get_threshold_actions(
    start: Optional[str] = Query(None, description="Start date (YYYY-MM-DD)"),
    end: Optional[str] = Query(None, description="End date (YYYY-MM-DD)"),
    season: Optional[str] = Query(None, description="Season filter"),
    field_stage: Optional[str] = Query(None, description="Field stage filter"),
):
    """
    Get threshold actions taken.
    Returns list of actions with details.
    """
    filtered_df = df.copy()
    
    # Apply filters if provided
    if start and end:
        start_date = pd.to_datetime(start)
        end_date = pd.to_datetime(end)
        filtered_df = filter_dataset(filtered_df, start_date, end_date, season, field_stage)
    
    # Get actions taken
    actions_df = filtered_df[filtered_df['Action'] == '1'].copy()
    
    actions: List[Dict] = []
    for idx, row in actions_df.iterrows():
        actions.append({
            'id': f"action-{idx}",
            'date': row['Date'].strftime('%Y-%m-%d') if isinstance(row['Date'], pd.Timestamp) else str(row['Date']),
            'pestType': 'Black Rice Bug',
            'count': float(row['Pest Count/Damage']),
            'threshold': 10.0 if 'Economic Threshold' in str(row['Threshold Status']) else 5.0,
            'fieldStage': row['Field Stage'],
            'season': row['Season'],
            'actionType': 'Intervention',
            'status': row['Threshold Status'],
        })
    
    # Sort by date (newest first)
    actions.sort(key=lambda x: x['date'], reverse=True)
    
    return {
        "success": True,
        "data": actions,
    }


@threshold_router.post("/actions")
def get_threshold_actions_filtered(request: FilterAll):
    """
    Get threshold actions with full filter support.
    """
    start_date = pd.to_datetime(request.start)
    end_date = pd.to_datetime(request.end)
    season = request.season if request.season != "All" else None
    field_stage = request.field_stage if request.field_stage != "All" else None
    
    # Filter data
    filtered_df = filter_dataset(df, start_date, end_date, season, field_stage)
    
    # Get actions taken
    actions_df = filtered_df[filtered_df['Action'] == '1'].copy()
    
    actions: List[Dict] = []
    for idx, row in actions_df.iterrows():
        actions.append({
            'id': f"action-{idx}",
            'date': row['Date'].strftime('%Y-%m-%d') if isinstance(row['Date'], pd.Timestamp) else str(row['Date']),
            'pestType': 'Black Rice Bug',
            'count': float(row['Pest Count/Damage']),
            'threshold': 10.0 if 'Economic Threshold' in str(row['Threshold Status']) else 5.0,
            'fieldStage': row['Field Stage'],
            'season': row['Season'],
            'actionType': 'Intervention',
            'status': row['Threshold Status'],
        })
    
    # Sort by date (newest first)
    actions.sort(key=lambda x: x['date'], reverse=True)
    
    return {
        "success": True,
        "data": actions,
    }


@threshold_router.get("/status")
def get_threshold_status():
    """
    Get current threshold status summary.
    """
    # Get recent data (last 30 days)
    end_date = pd.to_datetime('today')
    start_date = end_date - pd.Timedelta(days=30)
    recent_df = filter_dataset(df, start_date, end_date)
    
    if recent_df.empty:
        return {
            "success": True,
            "data": {
                "critical": 0,
                "warning": 0,
                "normal": 0,
            }
        }
    
    # Count by threshold status
    status_counts = recent_df['Threshold Status'].value_counts().to_dict()
    
    critical = status_counts.get('Economic Damage', 0)
    warning = status_counts.get('Economic Threshold', 0)
    normal = status_counts.get('Below Threshold', 0)
    
    return {
        "success": True,
        "data": {
            "critical": int(critical),
            "warning": int(warning),
            "normal": int(normal),
        }
    }
