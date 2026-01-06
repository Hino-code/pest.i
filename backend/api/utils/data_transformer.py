"""
Data transformation utilities to convert backend data to frontend format.
"""
import pandas as pd
from typing import List, Dict
from datetime import datetime
import uuid


def csv_to_observations(df: pd.DataFrame) -> List[Dict]:
    """
    Convert CSV DataFrame to PestObservation format expected by frontend.
    
    Frontend expects:
    {
        id: string,
        date: string (ISO format),
        pestType: "Black Rice Bug",
        count: number,
        threshold: number,
        aboveThreshold: boolean,
        season: "Dry" | "Wet",
        fieldStage: string,
        location?: string,
        actionTaken: boolean,
        actionType?: string,
        actionDate?: string
    }
    """
    observations = []
    
    # Ensure Date is datetime
    df = df.copy()
    df['Date'] = pd.to_datetime(df['Date'])
    
    # Map pest names
    pest_mapping = {
        'RBB': 'Black Rice Bug',
        'Black Rice Bug': 'Black Rice Bug',
    }
    
    # Determine threshold value based on Threshold Status
    def get_threshold_value(threshold_status: str) -> float:
        """Extract threshold value from status."""
        if 'Economic Threshold' in threshold_status:
            return 10.0
        elif 'Economic Damage' in threshold_status:
            return 5.0
        else:
            return 5.0  # Default threshold
    
    for idx, row in df.iterrows():
        pest_type = pest_mapping.get(row.get('Pest', 'RBB'), 'Black Rice Bug')
        count = float(row.get('Pest Count/Damage', 0))
        threshold_status = str(row.get('Threshold Status', 'Below Threshold'))
        threshold_value = get_threshold_value(threshold_status)
        above_threshold = threshold_status in ['Economic Threshold', 'Economic Damage']
        action_taken = str(row.get('Action', '0')) == '1'
        
        observation = {
            'id': str(uuid.uuid4()),
            'date': row['Date'].strftime('%Y-%m-%d'),
            'pestType': pest_type,
            'count': round(count, 1),
            'threshold': threshold_value,
            'aboveThreshold': above_threshold,
            'season': row.get('Season', 'Dry'),
            'fieldStage': row.get('Field Stage', 'Vegetative'),
            'actionTaken': action_taken,
            'actionType': 'Intervention' if action_taken else None,
            'actionDate': row['Date'].strftime('%Y-%m-%d') if action_taken else None,
        }
        
        observations.append(observation)
    
    return observations


def calculate_kpis_from_observations(observations: List[Dict]) -> Dict:
    """
    Calculate KPIs from observations in frontend format.
    
    Returns:
    {
        totalObservations: number,
        averagePestCount: number,
        percentAboveThreshold: number,
        totalActionsTaken: number,
        actionRate: number,
        currentFieldStage: string,
        mostAffectedStage: string
    }
    """
    if not observations:
        return {
            'totalObservations': 0,
            'averagePestCount': 0,
            'percentAboveThreshold': 0,
            'totalActionsTaken': 0,
            'actionRate': 0,
            'currentFieldStage': 'N/A',
            'mostAffectedStage': 'N/A'
        }
    
    total_observations = len(observations)
    total_pest_count = sum(obs['count'] for obs in observations)
    average_pest_count = total_pest_count / total_observations if total_observations > 0 else 0
    above_threshold_count = sum(1 for obs in observations if obs['aboveThreshold'])
    percent_above_threshold = (above_threshold_count / total_observations * 100) if total_observations > 0 else 0
    total_actions_taken = sum(1 for obs in observations if obs['actionTaken'])
    action_rate = (total_actions_taken / total_observations * 100) if total_observations > 0 else 0
    
    # Get most recent stage as current
    sorted_obs = sorted(observations, key=lambda x: x['date'], reverse=True)
    current_field_stage = sorted_obs[0]['fieldStage'] if sorted_obs else 'N/A'
    
    # Find most affected stage (by total pest count)
    stage_counts: Dict[str, float] = {}
    for obs in observations:
        stage = obs['fieldStage']
        stage_counts[stage] = stage_counts.get(stage, 0) + obs['count']
    
    most_affected_stage = max(stage_counts.items(), key=lambda x: x[1])[0] if stage_counts else 'N/A'
    
    return {
        'totalObservations': total_observations,
        'averagePestCount': round(average_pest_count, 1),
        'percentAboveThreshold': round(percent_above_threshold, 1),
        'totalActionsTaken': total_actions_taken,
        'actionRate': round(action_rate, 1),
        'currentFieldStage': current_field_stage,
        'mostAffectedStage': most_affected_stage
    }
