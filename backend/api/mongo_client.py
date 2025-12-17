import gridfs
import os
import certifi
import xgboost as xgb
from pymongo import MongoClient
from pymongo.errors import ServerSelectionTimeoutError, ConnectionFailure
from pymongo.server_api import ServerApi
from pathlib import Path

# --- CONFIGURATION ---
URI = "mongodb+srv://user1:khair12345@cluster0.886rdzt.mongodb.net/forecast_db?retryWrites=true&w=majority"
DB_NAME = "models_db"
LOCAL_MODEL_FOLDER = "models"


def get_latest_local_model():
    """
    FALLBACK FUNCTION:
    Finds the most recently modified file in the local 'models' directory.
    """
    try:
        base_path = os.getcwd()
        full_folder_path = os.path.join(base_path, LOCAL_MODEL_FOLDER)

        if not os.path.exists(full_folder_path):
            print("❌ Offline mode failed: Model directory does not exist.")
            return None

        # List all files in the directory
        files = [
            os.path.join(full_folder_path, f) for f in os.listdir(full_folder_path)
        ]

        # Filter out directories, keep only files
        files = [f for f in files if os.path.isfile(f)]

        if not files:
            print("❌ Offline mode failed: No models found locally.")
            return None

        # Sort by modification time (newest first)
        latest_file = max(files, key=os.path.getmtime)
        print(f"📂 OFFLINE MODE: Selected local model: {os.path.basename(latest_file)}")
        return latest_file

    except Exception as e:
        print(f"❌ Error finding local model: {e}")
        return None


def get_latest_model():
    print("🔌 Connecting to MongoDB...")

    # 1. SET TIMEOUT (e.g., 3000ms = 3 seconds)
    # This prevents the server from hanging if there is no internet.
    client = MongoClient(
        URI,
        server_api=ServerApi("1"),
        tlsCAFile=certifi.where(),
        serverSelectionTimeoutMS=3000,
    )

    try:
        # 2. Attempt Connection
        client.admin.command("ping")
        print("✅ Connected successfully (Online Mode)!")

        # --- ONLINE LOGIC (Your original code) ---
        db = client[DB_NAME]
        fs = gridfs.GridFS(db)

        latest_file = db["fs.files"].find_one(sort=[("uploadDate", -1)])

        if not latest_file:
            print("❌ No models found in the database.")
            # Try local fallback even if DB connects but is empty
            return get_latest_local_model()

        mongo_filename = latest_file["filename"]
        file_id = latest_file["_id"]
        db_file_size = latest_file["length"]

        print(f"🔎 Latest DB Model: {mongo_filename} (Size: {db_file_size} bytes)")

        base_path = os.getcwd()
        full_folder_path = os.path.join(base_path, LOCAL_MODEL_FOLDER)

        if not os.path.exists(full_folder_path):
            os.makedirs(full_folder_path)

        final_file_path = os.path.join(full_folder_path, mongo_filename)

        should_download = True
        if os.path.exists(final_file_path):
            local_file_size = os.path.getsize(final_file_path)
            if local_file_size == db_file_size:
                print(f"✋ Model already exists locally. Skipping download.")
                should_download = False
            else:
                print(f"⚠️ Size mismatch. Redownloading...")

        if should_download:
            print(f"⬇️ Downloading {mongo_filename}...")
            grid_out = fs.get(file_id)
            with open(final_file_path, "wb") as f:
                f.write(grid_out.read())
            print(f"✅ Download complete.")

        return final_file_path

    # 3. CATCH NETWORK ERRORS
    except (ServerSelectionTimeoutError, ConnectionFailure):
        print("\n⚠️ NETWORK ERROR: Could not connect to MongoDB.")
        print("🔄 Switching to OFFLINE MODE...")
        return get_latest_local_model()

    except Exception as e:
        print(f"❌ Unexpected Error: {e}")
        print("🔄 Switching to OFFLINE MODE...")
        return get_latest_local_model()


def verify_and_load_model(model_path):
    if not model_path:
        return

    print("\n--- 🧪 Verifying Model Integrity ---")
    try:
        model = xgb.XGBRegressor()
        model.load_model(model_path)
        params = model.get_params()
        n_estimators = params.get("n_estimators", "Unknown")
        print(f"✅ Model loaded successfully! (n_estimators: {n_estimators})")

        # You might want to return the loaded model object here if you need to assign it globally
        return model

    except Exception as e:
        print(f"❌ Corrupted model file: {e}")
