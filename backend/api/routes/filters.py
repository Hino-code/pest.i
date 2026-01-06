from fastapi import APIRouter
from api.data_loader import df

filter_router = APIRouter(prefix="/filters")


@filter_router.get("/")
def filters_root():
    return {"success": True, "message": "At filters router"}


@filter_router.get("/basic")
def basic_filters():
    """
    Get basic filter options from actual data.
    Returns only values that exist in the backend data.
    Maps pest types to match frontend format (RBB -> Black Rice Bug).
    """
    # Sort years descending (newest first)
    years = sorted(df["Date"].dt.year.unique().tolist(), reverse=True)
    
    # Map pest types to match frontend format (same mapping as in data_transformer)
    pest_mapping = {
        'RBB': 'Black Rice Bug',
        'Black Rice Bug': 'Black Rice Bug',
    }
    
    # Get unique pest types and map them
    raw_pest_types = df["Pest"].unique().tolist()
    mapped_pest_types = sorted(list(set([
        pest_mapping.get(pest, 'Black Rice Bug') for pest in raw_pest_types
    ])))
    
    return {
        "success": True,
        "data": {
            "field_stages": sorted(df["Field Stage"].unique().tolist()),
            "pest_types": mapped_pest_types,  # Mapped to match frontend format
            "date": {
                "min": str(df["Date"].min()),
                "max": str(df["Date"].max())
            },
            "years": years,  # Sorted descending (newest first)
        },
    }


@filter_router.get("/advanced")
def advanced_filters():
    """
    Get advanced filter options from actual data.
    Returns only values that exist in the backend data.
    """
    return {
        "success": True,
        "data": {
            "season": sorted(df["Season"].unique().tolist()),
            "threshold_status": sorted(df["Threshold Status"].unique().tolist()),
            "isActionTaken": sorted(df["Action"].unique().tolist()),
        },
    }
