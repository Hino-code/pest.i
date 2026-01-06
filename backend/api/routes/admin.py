"""
Admin routes: user approval, pending users management.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from api.models.user import PendingUser, user_to_pending_user
from api.db import users_collection
from api.dependencies import require_admin
from bson import ObjectId

admin_router = APIRouter(prefix="/admin", tags=["admin"])


@admin_router.get("/pending-users", response_model=list[PendingUser])
async def get_pending_users(
    current_user: dict = Depends(require_admin),
):
    """Get list of pending users (admin only)."""
    pending_users = users_collection.find(
        {"status": "pending"}
    ).sort("createdAt", -1)
    
    return [user_to_pending_user(user) for user in pending_users]


@admin_router.post("/pending-users/{user_id}/approve", status_code=status.HTTP_204_NO_CONTENT)
async def approve_user(
    user_id: str,
    current_user: dict = Depends(require_admin),
):
    """Approve a pending user (admin only)."""
    if not ObjectId.is_valid(user_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid user ID",
        )
    
    result = users_collection.update_one(
        {"_id": ObjectId(user_id), "status": "pending"},
        {"$set": {"status": "approved"}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Pending user not found",
        )


@admin_router.post("/pending-users/{user_id}/reject", status_code=status.HTTP_204_NO_CONTENT)
async def reject_user(
    user_id: str,
    current_user: dict = Depends(require_admin),
):
    """Reject and delete a pending user (admin only)."""
    if not ObjectId.is_valid(user_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid user ID",
        )
    
    result = users_collection.delete_one(
        {"_id": ObjectId(user_id), "status": "pending"}
    )
    
    if result.deleted_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Pending user not found",
        )
