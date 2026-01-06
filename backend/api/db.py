"""
Database connection for user management.
Uses MongoDB Atlas Account #1 (separate from models database).
"""
import os
from pymongo import MongoClient
from pymongo.server_api import ServerApi
from dotenv import load_dotenv

load_dotenv()

# MongoDB connection for users (separate from models database)
MONGODB_URI = os.getenv("MONGODB_URI")
if not MONGODB_URI:
    raise ValueError("MONGODB_URI environment variable is required")

# Create MongoDB client
client = MongoClient(
    MONGODB_URI,
    server_api=ServerApi("1"),
)

# Get database
db = client.get_default_database()
users_collection = db["users"]

# Create indexes
def create_indexes():
    """Create database indexes for performance."""
    try:
        users_collection.create_index("email", unique=True)
        users_collection.create_index("status")
        users_collection.create_index("role")
        users_collection.create_index([("createdAt", -1)])
        print("✅ User database indexes created")
    except Exception as e:
        print(f"⚠️  Index creation warning: {e}")
