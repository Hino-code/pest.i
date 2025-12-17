from fastapi import APIRouter
from api.data_loader import df

filter_router = APIRouter(prefix="/filters")


@filter_router.get("/")
def filters_root():
    return {"success": True, "message": "At filters router"}


@filter_router.get("/basic")
def basic_filters():
    return {
        "success": True,
        "data": {
            "field_stages": df["Field Stage"].unique().tolist(),
            "pest_types": df["Pest"].unique().tolist(),
            "date": {"min": str(df["Date"].min()), "max": str(df["Date"].max())},
            "years": df["Date"].dt.year.unique().tolist(),
        },
    }


@filter_router.get("/advanced")
def advanced_filters():
    return {
        "success": True,
        "data": {
            "season": df["Season"].unique().tolist(),
            "threshold_status": df["Threshold Status"].unique().tolist(),
            "isActionTaken": df["Action"].unique().tolist(),
    
        },
    }
