"""
Startup utilities: database initialization, admin user seeding.
"""
import os
import bcrypt
from datetime import datetime
from api.db import users_collection, create_indexes
from api.auth_utils import hash_password
from dotenv import load_dotenv

load_dotenv()

ADMIN_EMAIL = (os.getenv("ADMIN_EMAIL") or "admin@ews.local").lower()
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD") or "admin123"
ADMIN_NAME = os.getenv("ADMIN_NAME") or "System Administrator"
ADMIN_ROLE = os.getenv("ADMIN_ROLE") or "Administrator"


async def initialize_database():
    """Initialize database: create indexes and seed admin user."""
    print("🔧 Initializing database...")
    
    # Create indexes
    create_indexes()
    
    # Seed admin user if it doesn't exist
    existing_admin = users_collection.find_one({"email": ADMIN_EMAIL})
    if not existing_admin:
        password_hash = hash_password(ADMIN_PASSWORD)
        admin_user = {
            "name": ADMIN_NAME,
            "email": ADMIN_EMAIL,
            "agency": "",
            "role": ADMIN_ROLE,
            "passwordHash": password_hash,
            "status": "approved",
            "phone": "",
            "jobTitle": "",
            "department": "",
            "location": "",
            "bio": "",
            "photoUrl": "",
            "theme": "system",
            "language": "en",
            "dateFormat": "MM/DD/YYYY",
            "timeFormat": "12",
            "density": "comfortable",
            "createdAt": datetime.utcnow(),
            "updatedAt": datetime.utcnow(),
        }
        users_collection.insert_one(admin_user)
        print(f"👤 Seeded admin user at {ADMIN_EMAIL} (role: {ADMIN_ROLE})")
    else:
        print(f"✅ Admin user already exists: {ADMIN_EMAIL}")
