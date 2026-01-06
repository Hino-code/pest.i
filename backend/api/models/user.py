"""
User models and schemas.
"""
from typing import Optional
from datetime import datetime
from pydantic import BaseModel, EmailStr, Field
from bson import ObjectId


class PyObjectId(ObjectId):
    """Custom ObjectId for Pydantic."""
    @classmethod
    def __get_validators__(cls):
        yield cls.validate

    @classmethod
    def validate(cls, v):
        if not ObjectId.is_valid(v):
            raise ValueError("Invalid objectid")
        return ObjectId(v)

    @classmethod
    def __modify_schema__(cls, field_schema):
        field_schema.update(type="string")


# Pydantic models for API
class UserBase(BaseModel):
    name: str
    email: EmailStr
    role: str
    agency: Optional[str] = None
    phone: Optional[str] = None
    jobTitle: Optional[str] = None
    department: Optional[str] = None
    location: Optional[str] = None
    bio: Optional[str] = None


class UserCreate(UserBase):
    password: str = Field(..., min_length=6)


class UserUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    jobTitle: Optional[str] = None
    department: Optional[str] = None
    location: Optional[str] = None
    bio: Optional[str] = None
    photoUrl: Optional[str] = None
    theme: Optional[str] = None
    language: Optional[str] = None
    dateFormat: Optional[str] = None
    timeFormat: Optional[str] = None
    density: Optional[str] = None


class PasswordChange(BaseModel):
    currentPassword: str
    newPassword: str = Field(..., min_length=6)


class LoginRequest(BaseModel):
    username: str
    password: str


class AppUser(BaseModel):
    """User model for API responses (matches frontend expectations)."""
    id: str
    username: str
    email: str
    role: str
    status: str
    phone: str = ""
    jobTitle: str = ""
    department: str = ""
    location: str = ""
    bio: str = ""
    photoUrl: str = ""
    theme: str = "system"
    language: str = "en"
    dateFormat: str = "MM/DD/YYYY"
    timeFormat: str = "12"
    density: str = "comfortable"


class PendingUser(BaseModel):
    """Pending user model for admin approval."""
    id: str
    name: str
    email: str
    agency: str = ""
    role: str
    submittedAt: str


class AuthSession(BaseModel):
    """Authentication session response."""
    token: str
    user: AppUser


def user_to_app_user(user_doc: dict, base_url: str = "") -> AppUser:
    """Convert MongoDB user document to AppUser model."""
    photo_url = user_doc.get("photoUrl", "")
    if photo_url and not photo_url.startswith("http"):
        photo_url = f"{base_url}{photo_url}" if base_url else photo_url
    
    return AppUser(
        id=str(user_doc["_id"]),
        username=user_doc.get("name") or user_doc.get("email", ""),
        email=user_doc.get("email", ""),
        role=user_doc.get("role", ""),
        status=user_doc.get("status", "pending"),
        phone=user_doc.get("phone", ""),
        jobTitle=user_doc.get("jobTitle", ""),
        department=user_doc.get("department", ""),
        location=user_doc.get("location", ""),
        bio=user_doc.get("bio", ""),
        photoUrl=photo_url,
        theme=user_doc.get("theme", "system"),
        language=user_doc.get("language", "en"),
        dateFormat=user_doc.get("dateFormat", "MM/DD/YYYY"),
        timeFormat=user_doc.get("timeFormat", "12"),
        density=user_doc.get("density", "comfortable"),
    )


def user_to_pending_user(user_doc: dict) -> PendingUser:
    """Convert MongoDB user document to PendingUser model."""
    created_at = user_doc.get("createdAt")
    if isinstance(created_at, datetime):
        submitted_at = created_at.isoformat()
    else:
        submitted_at = str(created_at) if created_at else ""
    
    return PendingUser(
        id=str(user_doc["_id"]),
        name=user_doc.get("name", ""),
        email=user_doc.get("email", ""),
        agency=user_doc.get("agency", ""),
        role=user_doc.get("role", ""),
        submittedAt=submitted_at,
    )
