from contextlib import asynccontextmanager
from api.mongo_client import get_latest_model, verify_and_load_model

@asynccontextmanager
async def lifespan(app):
    print("\n🚀 SERVER STARTUP: Initializing System...")

    try:
        
        model_path = get_latest_model()

        if model_path:
            # Check if it works
            loaded_model = verify_and_load_model(model_path)
            
        else:
            print("⚠️ WARNING: No model found (Online or Offline). Predictions will fail.")

    except Exception as e:
        print(f"❌ Critical Startup Error: {e}")

    print("✅ SERVER READY: API is listening for requests.\n")
    yield  
    print("🛑 SERVER SHUTDOWN: Cleaning up resources...")