# Quick Start Guide

## ✅ Frontend is Running!

The frontend server is already running at: **http://localhost:3000**

You can open it in your browser now!

## 🚀 Starting the Backend

### Step 1: Install Python Dependencies

```bash
cd backend

# Create virtual environment (recommended)
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

### Step 2: Create .env File

Create `backend/.env` with your MongoDB credentials:

```env
# REQUIRED: User authentication database
MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/users_db?retryWrites=true&w=majority

# OPTIONAL: Model storage (if not set, uses local models from backend/models/)
MONGODB_MODELS_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/forecast_db?retryWrites=true&w=majority
MONGODB_MODELS_DB_NAME=models_db

JWT_SECRET=your-secret-key-change-in-production
ADMIN_EMAIL=admin@ews.local
ADMIN_PASSWORD=admin123
ADMIN_NAME=System Administrator
ADMIN_ROLE=Administrator
FRONTEND_URL=http://localhost:3000
```

**Note**: `MONGODB_MODELS_URI` is optional. The system automatically uses local models if MongoDB connection fails or is not configured.

### Step 3: Start Backend Server

```bash
cd backend
source venv/bin/activate  # If using venv
uvicorn app:app --reload --port 8001
```

You should see:

```
🚀 SERVER STARTUP: Initializing System...
✅ SERVER READY: API is listening for requests.
INFO:     Uvicorn running on http://127.0.0.1:8001
```

## 🧪 Verify Everything Works

### Test Backend Health:

```bash
curl http://localhost:8001/health
# Should return: {"ok": true}
```

### Test Observations API:

```bash
curl http://localhost:8001/dashboard/observations
```

### Open Frontend:

Open **http://localhost:3000** in your browser

## 📝 Current Status

- ✅ Frontend: Running on port 3000
- ⏳ Backend: Needs dependencies installed and .env configured
- ✅ Code: All syntax errors fixed, ready to run

## 🐛 Troubleshooting

If backend won't start:

1. Check Python version: `python3 --version` (needs 3.8+)
2. Verify dependencies: `python3 test_backend.py`
3. Check .env file exists and has correct MongoDB URIs
4. Ensure MongoDB Atlas IP whitelist includes your IP

For more details, see `START_SERVERS.md`
