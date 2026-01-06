"""
Authentication routes: login, register, user management.
"""
from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.responses import JSONResponse
from api.models.user import (
    LoginRequest,
    UserCreate,
    UserUpdate,
    PasswordChange,
    AppUser,
    PendingUser,
    AuthSession,
    user_to_app_user,
    user_to_pending_user,
)
from api.db import users_collection
from api.auth_utils import hash_password, verify_password, create_token
from api.dependencies import get_current_user, require_admin
from bson import ObjectId
from datetime import datetime
import os

auth_router = APIRouter(prefix="/auth", tags=["auth"])


def get_base_url(request: Request) -> str:
    """Get base URL for constructing absolute photo URLs."""
    return f"{request.url.scheme}://{request.url.netloc}"


@auth_router.get("/")
def auth_root():
    return {"success": True, "message": "Authentication router"}


@auth_router.post("/register", status_code=status.HTTP_201_CREATED)
async def register(user_data: UserCreate):
    """Register a new user (pending approval)."""
    # Check if user already exists
    existing = users_collection.find_one({"email": user_data.email.lower()})
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="User already exists",
        )
    
    # Hash password
    password_hash = hash_password(user_data.password)
    
    # Create user document
    user_doc = {
        "name": user_data.name,
        "email": user_data.email.lower(),
        "agency": user_data.agency or "",
        "role": user_data.role,
        "passwordHash": password_hash,
        "status": "pending",
        "phone": user_data.phone or "",
        "jobTitle": user_data.jobTitle or "",
        "department": user_data.department or "",
        "location": user_data.location or "",
        "bio": user_data.bio or "",
        "photoUrl": "",
        "theme": "system",
        "language": "en",
        "dateFormat": "MM/DD/YYYY",
        "timeFormat": "12",
        "density": "comfortable",
        "createdAt": datetime.utcnow(),
        "updatedAt": datetime.utcnow(),
    }
    
    result = users_collection.insert_one(user_doc)
    return {"pendingId": str(result.inserted_id)}


@auth_router.post("/login", response_model=AuthSession)
async def login(credentials: LoginRequest, request: Request):
    """Authenticate user and return JWT token."""
    email = credentials.username.lower()
    
    user = users_collection.find_one({"email": email})
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials",
        )
    
    # Verify password
    if not verify_password(credentials.password, user["passwordHash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials",
        )
    
    # Check if user is approved
    if user.get("status") != "approved":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Account pending approval",
        )
    
    # Create token
    token = create_token(str(user["_id"]), user.get("role", ""))
    
    # Convert to AppUser
    base_url = get_base_url(request)
    app_user = user_to_app_user(user, base_url)
    
    return AuthSession(token=token, user=app_user)
