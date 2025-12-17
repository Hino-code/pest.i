from fastapi import APIRouter


threshold_router = APIRouter(prefix="/threshold")


@threshold_router.get("/")
def threshold_root():
    return {"success": True, "message": "At threshold router"}
