from fastapi import APIRouter


auth_router = APIRouter(prefix="/auth")


@auth_router.get("/")
def auth_root():
    return {"success": True, "message": "At auth router"}

