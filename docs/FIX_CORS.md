# Fixing CORS Error

## The Problem

You're getting CORS errors because:

- Frontend is running on **port 3001** (not 3000)
- Backend CORS config has been updated to include port 3001
- **But the backend server needs to be restarted** for changes to take effect

## Solution: Restart Backend Server

### Step 1: Stop the Current Backend Server

In the terminal where the backend is running:

- Press `Ctrl+C` to stop the server

### Step 2: Restart the Backend

```bash
cd backend
source venv/bin/activate  # If using venv
uvicorn app:app --reload --port 8001
```

The `--reload` flag should auto-reload, but sometimes a full restart is needed.

## Verify CORS is Fixed

After restarting, the CORS errors should be gone. You should see:

1. ✅ No more CORS errors in browser console
2. ✅ Login requests succeed
3. ✅ API calls work properly

## If Still Getting CORS Errors

### Option 1: Check Backend Logs

Look for the CORS origins in startup logs. You should see port 3001 is included.

### Option 2: Test CORS Directly

```bash
curl -X OPTIONS http://localhost:8001/auth/login \
  -H "Origin: http://localhost:3001" \
  -H "Access-Control-Request-Method: POST" \
  -v
```

Should return headers like:

```
Access-Control-Allow-Origin: http://localhost:3001
Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS
```

### Option 3: Temporary Fix - Allow All Origins (Development Only)

If still having issues, you can temporarily allow all origins (ONLY for development):

```python
# In app.py, change:
allow_origins=["*"]  # TEMPORARY - for development only
```

**⚠️ WARNING**: Never use `["*"]` in production! It's a security risk.

## Current CORS Configuration

The backend is configured to allow:

- `http://localhost:3000`
- `http://localhost:3001` ✅ (your current frontend port)
- `http://127.0.0.1:3000`
- `http://127.0.0.1:3001`
- `http://localhost:5173` (Vite default)

After restart, everything should work! 🎉
