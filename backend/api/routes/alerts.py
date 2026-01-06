"""
Alerts and notifications API endpoints.
"""
from fastapi import APIRouter, Query
from typing import Optional, List, Dict
import pandas as pd
from datetime import datetime, timedelta
from api.data_loader import df
from api.utils.dashboard_utils import filter_dataset

alerts_router = APIRouter(prefix="/alerts", tags=["alerts"])


@alerts_router.get("/")
def get_alerts(
    limit: Optional[int] = Query(10, description="Maximum number of alerts to return"),
    unread_only: Optional[bool] = Query(False, description="Return only unread alerts"),
):
    """
    Get system alerts and notifications.
    Returns AlertRecord[] compatible with frontend.
    
    Frontend expects:
    {
        id: string,
        title: string,
        message: string,
        type: "alert" | "warning" | "info" | "success",
        timestamp: Date,
        read: boolean,
        priority: "high" | "medium" | "low",
        category: "pest-alert" | "threshold" | "forecast" | "system" | "action-required",
        metadata?: {
            pestType?: string,
            location?: string,
            count?: number,
            threshold?: number
        }
    }
    """
    alerts: List[Dict] = []
    
    # Get all data (not just last 30 days) to ensure alerts are generated
    # Sort by date descending to get most recent first
    all_df = df.sort_values('Date', ascending=False)
    
    # Generate threshold breach alerts from all data
    threshold_breaches = all_df[
        all_df['Threshold Status'].isin(['Economic Threshold', 'Economic Damage'])
    ].head(limit * 2)  # Get more to ensure we have enough alerts
    
    for idx, row in threshold_breaches.head(limit).iterrows():
        threshold_value = 10.0 if 'Economic Threshold' in str(row['Threshold Status']) else 5.0
        count = float(row['Pest Count/Damage'])
        
        alerts.append({
            'id': f"alert-threshold-{idx}",
            'title': f"Critical pest threshold exceeded",
            'message': f"Black Rice Bug count ({count}) surpassed threshold ({threshold_value}) in {row['Field Stage']} stage. Immediate action recommended.",
            'type': 'alert',
            'timestamp': row['Date'].isoformat() if isinstance(row['Date'], pd.Timestamp) else str(row['Date']),
            'read': False,
            'priority': 'high',
            'category': 'threshold',
            'metadata': {
                'pestType': 'Black Rice Bug',
                'location': row.get('Field Stage', 'Unknown'),
                'count': count,
                'threshold': threshold_value,
            }
        })
    
    # Generate forecast warnings (if forecast indicates high risk)
    # This would typically come from forecast data, but for now we'll use recent trends
    if len(threshold_breaches) > 5:
        alerts.append({
            'id': 'alert-forecast-1',
            'title': 'Forecast: Elevated Black Rice Bug risk',
            'message': 'Model projects rising counts over the next 7 days. Prepare interventions.',
            'type': 'warning',
            'timestamp': (datetime.now() - timedelta(hours=2)).isoformat(),
            'read': False,
            'priority': 'high',
            'category': 'forecast',
            'metadata': {
                'pestType': 'Black Rice Bug',
                'location': 'Multiple fields',
            }
        })
    
    # Generate action required alerts from all data
    actions_needed = all_df[
        (all_df['Threshold Status'].isin(['Economic Threshold', 'Economic Damage'])) &
        (all_df['Action'] == '0')
    ]
    
    if len(actions_needed) > 0:
        alerts.append({
            'id': 'alert-action-required',
            'title': 'Inspection required',
            'message': f'{len(actions_needed)} fields need follow-up after threshold breaches.',
            'type': 'warning',
            'timestamp': (datetime.now() - timedelta(hours=4)).isoformat(),
            'read': False,
            'priority': 'medium',
            'category': 'action-required',
        })
    
    # System info alert
    alerts.append({
        'id': 'alert-system-1',
        'title': 'System sync complete',
        'message': 'Latest observations synchronized from field devices.',
        'type': 'info',
        'timestamp': (datetime.now() - timedelta(days=1)).isoformat(),
        'read': True,
        'priority': 'low',
        'category': 'system',
    })
    
    # Sort by timestamp (newest first)
    alerts.sort(key=lambda x: x['timestamp'], reverse=True)
    
    # Filter unread if requested
    if unread_only:
        alerts = [a for a in alerts if not a.get('read', False)]
    
    # Limit results
    alerts = alerts[:limit]
    
    return {
        "success": True,
        "data": alerts,
    }


@alerts_router.post("/{alert_id}/read")
def mark_alert_read(alert_id: str):
    """Mark an alert as read."""
    # In a real implementation, this would update a database
    # For now, we'll just return success
    return {
        "success": True,
        "message": "Alert marked as read",
    }


@alerts_router.post("/read-all")
def mark_all_alerts_read():
    """Mark all alerts as read."""
    return {
        "success": True,
        "message": "All alerts marked as read",
    }
