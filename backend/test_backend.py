#!/usr/bin/env python3
"""
Quick test script to verify backend setup.
Run this before starting the servers.
"""
import sys
import os

# Add backend to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))

def test_imports():
    """Test if all required modules can be imported."""
    print("Testing imports...")
    
    try:
        import fastapi
        print(f"✅ FastAPI {fastapi.__version__}")
    except ImportError:
        print("❌ FastAPI not installed. Run: pip install fastapi")
        return False
    
    try:
        import uvicorn
        print(f"✅ Uvicorn {uvicorn.__version__}")
    except ImportError:
        print("❌ Uvicorn not installed. Run: pip install uvicorn")
        return False
    
    try:
        import pymongo
        print(f"✅ PyMongo {pymongo.__version__}")
    except ImportError:
        print("❌ PyMongo not installed. Run: pip install pymongo")
        return False
    
    try:
        import pandas
        print(f"✅ Pandas {pandas.__version__}")
    except ImportError:
        print("❌ Pandas not installed. Run: pip install pandas")
        return False
    
    try:
        import xgboost
        print(f"✅ XGBoost {xgboost.__version__}")
    except ImportError:
        print("❌ XGBoost not installed. Run: pip install xgboost")
        return False
    
    try:
        from dotenv import load_dotenv
        print("✅ python-dotenv")
    except ImportError:
        print("❌ python-dotenv not installed. Run: pip install python-dotenv")
        return False
    
    try:
        import bcrypt
        print("✅ bcrypt")
    except ImportError:
        print("❌ bcrypt not installed. Run: pip install bcrypt")
        return False
    
    try:
        import jwt
        print("✅ PyJWT")
    except ImportError:
        print("❌ PyJWT not installed. Run: pip install PyJWT")
        return False
    
    try:
        from PIL import Image
        print("✅ Pillow")
    except ImportError:
        print("❌ Pillow not installed. Run: pip install Pillow")
        return False
    
    return True

def test_data_loader():
    """Test if data can be loaded."""
    print("\nTesting data loader...")
    try:
        from api.data_loader import df
        if df is not None and not df.empty:
            print(f"✅ Data loaded: {len(df)} rows")
            return True
        else:
            print("❌ Data is empty or None")
            return False
    except Exception as e:
        print(f"❌ Error loading data: {e}")
        return False

def test_env_file():
    """Check if .env file exists."""
    print("\nChecking .env file...")
    env_path = os.path.join('backend', '.env')
    if os.path.exists(env_path):
        print("✅ .env file exists")
        return True
    else:
        print("⚠️  .env file not found. Create it in backend/.env")
        print("   See START_SERVERS.md for template")
        return False

if __name__ == "__main__":
    print("=" * 50)
    print("Backend Setup Verification")
    print("=" * 50)
    
    all_ok = True
    all_ok = test_imports() and all_ok
    all_ok = test_data_loader() and all_ok
    test_env_file()  # Warning only
    
    print("\n" + "=" * 50)
    if all_ok:
        print("✅ All checks passed! Ready to start backend.")
        print("\nTo start backend:")
        print("  cd backend")
        print("  source venv/bin/activate  # if using venv")
        print("  uvicorn app:app --reload --port 8001")
    else:
        print("❌ Some checks failed. Please install missing dependencies.")
        print("\nTo install all dependencies:")
        print("  cd backend")
        print("  pip install -r requirements.txt")
    print("=" * 50)
