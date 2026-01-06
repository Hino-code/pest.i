"""
User management routes: profile, settings, photo upload.
"""
from fastapi import APIRouter, Depends, HTTPException, status, Request, UploadFile, File
from api.models.user import AppUser, UserUpdate, PasswordChange, user_to_app_user
from api.db import users_collection
from api.auth_utils import hash_password, verify_password
from api.dependencies import get_current_user
from bson import ObjectId
from datetime import datetime
from PIL import Image
import os
import io
import shutil
from pathlib import Path

user_router = APIRouter(prefix="/user", tags=["user"])

# Upload directory
UPLOAD_DIR = Path(__file__).parent.parent.parent / "uploads"
UPLOAD_DIR.mkdir(exist_ok=True)


def get_base_url(request: Request) -> str:
    """Get base URL for constructing absolute photo URLs."""
    return f"{request.url.scheme}://{request.url.netloc}"


@user_router.get("/me", response_model=dict)
async def get_current_user_profile(
    request: Request,
    current_user: dict = Depends(get_current_user),
):
    """Get current user profile."""
    base_url = get_base_url(request)
    app_user = user_to_app_user(current_user, base_url)
    return {"user": app_user.dict()}


@user_router.patch("/me", response_model=dict)
async def update_profile(
    user_update: UserUpdate,
    request: Request,
    current_user: dict = Depends(get_current_user),
):
    """Update user profile."""
    # Allowed fields to update
    allowed_fields = [
        "name", "phone", "jobTitle", "department", "location", "bio",
        "photoUrl", "theme", "language", "dateFormat", "timeFormat", "density"
    ]
    
    update_data = {}
    for field in allowed_fields:
        value = getattr(user_update, field, None)
        if value is not None:
            update_data[field] = value
    
    if not update_data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No fields to update",
        )
    
    update_data["updatedAt"] = datetime.utcnow()
    users_collection.update_one(
        {"_id": current_user["_id"]},
        {"$set": update_data}
    )
    
    # Fetch updated user
    updated_user = users_collection.find_one({"_id": current_user["_id"]})
    base_url = get_base_url(request)
    app_user = user_to_app_user(updated_user, base_url)
    
    return {"user": app_user.dict()}


@user_router.patch("/me/password", status_code=status.HTTP_204_NO_CONTENT)
async def change_password(
    password_data: PasswordChange,
    current_user: dict = Depends(get_current_user),
):
    """Change user password."""
    # Verify current password
    if not verify_password(password_data.currentPassword, current_user["passwordHash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Current password is incorrect",
        )
    
    # Hash new password
    new_password_hash = hash_password(password_data.newPassword)
    
    # Update password
    users_collection.update_one(
        {"_id": current_user["_id"]},
        {
            "$set": {
                "passwordHash": new_password_hash,
                "updatedAt": datetime.utcnow(),
            }
        }
    )


@user_router.post("/me/photo", response_model=dict)
async def upload_photo(
    request: Request,
    current_user: dict = Depends(get_current_user),
    photo: UploadFile = File(...),
):
    """Upload user profile photo."""
    # Validate file type
    if not photo.content_type or not photo.content_type.startswith("image/"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only image uploads are allowed",
        )
    
    # Generate unique filename
    unique = f"{int(datetime.utcnow().timestamp() * 1000)}-{os.urandom(4).hex()}"
    filename = f"{unique}.jpg"
    file_path = UPLOAD_DIR / filename
    
    try:
        # Read and process image
        contents = await photo.read()
        
        # Process with PIL
        image = Image.open(io.BytesIO(contents))
        # Auto-rotate based on EXIF
        try:
            from PIL.ExifTags import ORIENTATION
            exif = image._getexif()
            if exif:
                orientation = exif.get(ORIENTATION)
                if orientation == 3:
                    image = image.rotate(180, expand=True)
                elif orientation == 6:
                    image = image.rotate(270, expand=True)
                elif orientation == 8:
                    image = image.rotate(90, expand=True)
        except:
            pass
        
        # Resize and save
        image.thumbnail((800, 800), Image.Resampling.LANCZOS)
        image = image.convert("RGB")
        image.save(file_path, "JPEG", quality=90)
        
    except Exception as e:
        # Fallback: save raw file
        with open(file_path, "wb") as f:
            f.write(contents)
    
    # Update user photoUrl
    public_path = f"/uploads/{filename}"
    users_collection.update_one(
        {"_id": current_user["_id"]},
        {
            "$set": {
                "photoUrl": public_path,
                "updatedAt": datetime.utcnow(),
            }
        }
    )
    
    # Fetch updated user
    updated_user = users_collection.find_one({"_id": current_user["_id"]})
    base_url = get_base_url(request)
    photo_url = f"{base_url}{public_path}"
    app_user = user_to_app_user(updated_user, base_url)
    
    return {
        "photoUrl": photo_url,
        "user": app_user.dict(),
    }


# Note: Uploads are served via StaticFiles mount in app.py
