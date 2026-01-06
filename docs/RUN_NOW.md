# 🚀 Ready to Run!

Your `.env` file is configured. Here's how to start everything:

## Step 1: Start Backend Server

Open a terminal and run:

```bash
cd backend

# If using virtual environment (recommended)
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Start the server
uvicorn app:app --reload --port 8001
```

**Expected output:**

```
🚀 SERVER STARTUP: Initializing System...
🔧 Initializing database...
✅ User database indexes created
👤 Seeded admin user at admin@ews.local (role: Administrator)
🔌 Connecting to MongoDB...
✅ Connected successfully (Online Mode)!
✅ Model loaded successfully!
✅ SERVER READY: API is listening for requests.

INFO:     Uvicorn running on http://127.0.0.1:8001
```

## Step 2: Verify Backend is Running

In another terminal, test the health endpoint:

```bash
curl http://localhost:8001/health
```

Should return: `{"ok": true}`

## Step 3: Start Frontend (if not already running)

Open another terminal:

```bash
cd frontend
npm run dev
```

**Expected output:**

```
  VITE v6.3.5  ready in XXX ms

  ➜  Local:   http://localhost:3000/
```

## Step 4: Open in Browser

Open **http://localhost:3000** in your browser!

## 🧪 Quick Tests

### Test Backend APIs:

```bash
# Health check
curl http://localhost:8001/health

# Get observations
curl http://localhost:8001/dashboard/observations

# Get forecast
curl http://localhost:8001/dashboard/forecast
```

### Test Frontend:

1. Open http://localhost:3000
2. Try to login with:
   - Email: `admin@ews.local`
   - Password: `admin123`
3. Check if dashboard loads data

## 🐛 Troubleshooting

### Backend won't start:

**Missing dependencies:**

```bash
cd backend
pip install -r requirements.txt
```

**Port 8001 already in use:**

```bash
lsof -ti:8001 | xargs kill -9
# Or use different port:
uvicorn app:app --reload --port 8002
```

**MongoDB connection error:**

- Check `.env` file has correct `MONGODB_URI`
- Verify MongoDB Atlas IP whitelist includes your IP (0.0.0.0/0 for testing)
- Check network connectivity

### Frontend can't connect to backend:

- Verify backend is running on port 8001
- Check browser console for errors
- Verify `VITE_API_BASE_URL` in frontend (defaults to http://localhost:8001)

## ✅ Success Indicators

You'll know everything is working when:

1. ✅ Backend shows "SERVER READY" message
2. ✅ `curl http://localhost:8001/health` returns `{"ok": true}`
3. ✅ Frontend loads at http://localhost:3000
4. ✅ You can login with admin credentials
5. ✅ Dashboard shows data (observations, KPIs, forecasts)

## 📝 Next Steps After Running

Once both servers are running:

1. **Login** with admin account
2. **Check Dashboard** - should show real data from CSV
3. **Test Forecast** - should show 7-day predictions
4. **Test Filters** - should filter data correctly
5. **Check Alerts** - should show threshold breaches

Enjoy! 🎉
