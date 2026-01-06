"""
Authentication utilities: JWT tokens, password hashing, etc.
"""
import os
import jwt
import bcrypt
from datetime import datetime, timedelta
from typing import Optional, Dict
from dotenv import load_dotenv

load_dotenv()

JWT_SECRET = os.getenv("JWT_SECRET", "change-me-in-prod")
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_DAYS = 7


def hash_password(password: str) -> str:
    """Hash a password using bcrypt."""
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode("utf-8"), salt)
    return hashed.decode("utf-8")


def verify_password(password: str, password_hash: str) -> bool:
    """Verify a password against a hash."""
    return bcrypt.checkpw(
        password.encode("utf-8"),
        password_hash.encode("utf-8")
    )


def create_token(user_id: str, role: str) -> str:
    """Create a JWT token for a user."""
    payload = {
        "sub": user_id,
        "role": role,
        "exp": datetime.utcnow() + timedelta(days=JWT_EXPIRATION_DAYS),
        "iat": datetime.utcnow(),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def verify_token(token: str) -> Optional[Dict]:
    """Verify and decode a JWT token."""
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None
