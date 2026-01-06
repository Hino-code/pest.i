# Starting the Application

## Prerequisites

### Backend (Python)

1. **Create a virtual environment** (recommended):

   ```bash
   cd backend
   python3 -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

2. **Install dependencies**:

   ```bash
   pip install -r requirements.txt
   ```

3. **Create `.env` file** in `backend/` directory:

   ```env
   # MongoDB Atlas Account #1: User Management Database
   MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/users_db?retryWrites=true&w=majority

   # MongoDB Atlas Account #2: Model Storage Database
   MONGODB_MODELS_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/forecast_db?retryWrites=true&w=majority
   MONGODB_MODELS_DB_NAME=models_db

   # JWT Authentication
   JWT_SECRET=your-secret-key-change-in-production

   # Admin User (seeded on startup)
   ADMIN_EMAIL=admin@ews.local
   ADMIN_PASSWORD=admin123
   ADMIN_NAME=System Administrator
   ADMIN_ROLE=Administrator

   # Frontend URL (for CORS)
   FRONTEND_URL=http://localhost:3000
   ```

### Frontend (Node.js)

1. **Install dependencies** (if not already done):

   ```bash
   cd frontend
   npm install
   ```

2. **Create `.env` file** in `frontend/` directory (optional):
   ```env
   VITE_API_BASE_URL=http://localhost:8001
   VITE_USE_MOCKS=false
   ```

## Starting the Servers

### Option 1: Run Separately (Recommended for Development)

**Terminal 1 - Backend:**

```bash
cd backend
source venv/bin/activate  # If using venv
uvicorn app:app --reload --port 8001
```

**Terminal 2 - Frontend:**

```bash
cd frontend
npm run dev
```

### Option 2: Use npm script (from root)

```bash
npm run dev:all
```

## Verify Installation

### Backend Health Check

```bash
curl http://localhost:8001/health
# Should return: {"ok": true}
```

### Frontend

Open browser to: http://localhost:3000

## Troubleshooting

### Backend Issues

**Port 8001 already in use:**

```bash
# Find and kill the process
lsof -ti:8001 | xargs kill -9
# Or use a different port
uvicorn app:app --reload --port 8002
```

**MongoDB connection error:**

- Check `.env` file has correct `MONGODB_URI`
- Verify MongoDB Atlas IP whitelist includes your IP
- Check network connectivity

**Module not found errors:**

- Ensure virtual environment is activated
- Run `pip install -r requirements.txt` again

### Frontend Issues

**Port 3000 already in use:**

```bash
# Find and kill the process
lsof -ti:3000 | xargs kill -9
# Or Vite will automatically use next available port
```

**API connection errors:**

- Verify backend is running on port 8001
- Check `VITE_API_BASE_URL` in frontend `.env`
- Check browser console for CORS errors

**Build errors:**

```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
```

## Expected Output

### Backend Startup:

```
🚀 SERVER STARTUP: Initializing System...
🔧 Initializing database...
✅ User database indexes created
👤 Seeded admin user at admin@ews.local (role: Administrator)
🔌 Connecting to MongoDB...
✅ Connected successfully (Online Mode)!
✅ SERVER READY: API is listening for requests.

INFO:     Uvicorn running on http://127.0.0.1:8001
```

### Frontend Startup:

```
  VITE v6.3.5  ready in XXX ms

  ➜  Local:   http://localhost:3000/
  ➜  Network: use --host to expose
```

## Testing the APIs

### Test Observations Endpoint:

```bash
curl http://localhost:8001/dashboard/observations
```

### Test Forecast Endpoint:

```bash
curl http://localhost:8001/dashboard/forecast
```

### Test Health:

```bash
curl http://localhost:8001/health
```
