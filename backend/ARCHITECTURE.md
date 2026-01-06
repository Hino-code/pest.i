# Backend Architecture

## Overview

The backend consists of two separate services that use **different technologies** and **different MongoDB Atlas accounts**:

1. **Express Authentication Server** (Node.js) - Port 8000
2. **FastAPI Application Server** (Python) - Port 8001

## Service Details

### Express Authentication Server (Node.js)

**Location**: `backend/server-auth/`

**Technology Stack**:

- Node.js + Express.js
- Mongoose (MongoDB ODM)
- JWT for authentication
- bcrypt for password hashing

**Purpose**:

- User authentication (login/register)
- User profile management
- Admin user approval workflow
- Profile photo uploads

**Database**:

- **MongoDB Atlas Account #1** (User Management)
- Connection string: `MONGODB_URI` in `server-auth/.env`
- Collections: `users`

**Environment Variables** (`server-auth/.env`):

```env
PORT=8000
MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/users_db?retryWrites=true&w=majority
JWT_SECRET=your-secret-key
FRONTEND_URL=http://localhost:3000
ADMIN_EMAIL=admin@ews.local
ADMIN_PASSWORD=admin123
```

**Note**: This server was moved from `frontend/server/` to `backend/server-auth/` but **remains Node.js/Express** (not converted to Python).

### FastAPI Application Server (Python)

**Location**: `backend/api/`

**Technology Stack**:

- Python + FastAPI
- PyMongo (MongoDB driver)
- XGBoost (ML models)
- Pandas (data processing)

**Purpose**:

- Dashboard data endpoints
- Forecasting predictions
- Filter management
- Threshold actions
- ML model loading and inference

**Database**:

- **MongoDB Atlas Account #2** (Model Storage)
- Connection string: `MONGODB_MODELS_URI` in `backend/.env`
- Database: `models_db` (configurable)
- Storage: GridFS for ML model files

**Environment Variables** (`backend/.env`):

```env
MONGODB_MODELS_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/forecast_db?retryWrites=true&w=majority
MONGODB_MODELS_DB_NAME=models_db
```

**Model Loading**:

- On startup, FastAPI connects to MongoDB Atlas Account #2
- Downloads latest ML model from GridFS
- Falls back to local models if connection fails
- Models stored in `backend/models/` directory

## Database Architecture

### Two Separate MongoDB Atlas Accounts

The system uses **TWO COMPLETELY SEPARATE** MongoDB Atlas accounts:

1. **Users Database** (Express Server)

   - Account credentials in `backend/server-auth/.env`
   - Variable: `MONGODB_URI`
   - Used for: User accounts, authentication, profiles

2. **Models Database** (FastAPI Server)
   - Account credentials in `backend/.env`
   - Variable: `MONGODB_MODELS_URI`
   - Used for: ML model storage (GridFS), forecast results

**Why Separate?**

- Security: User data and model data have different access requirements
- Scalability: Can scale databases independently
- Isolation: Issues with one database don't affect the other

## API Endpoints

### Express Server (Port 8000)

- `POST /auth/login` - User login
- `POST /auth/register` - User registration
- `GET /user/me` - Get current user (requires auth)
- `PATCH /user/me` - Update profile (requires auth)
- `POST /user/me/photo` - Upload profile photo (requires auth)
- `GET /admin/pending-users` - List pending users (admin only)
- `POST /admin/pending-users/:id/approve` - Approve user (admin only)
- `POST /admin/pending-users/:id/reject` - Reject user (admin only)

### FastAPI Server (Port 8001)

- `GET /dashboard/*` - Dashboard data endpoints
- `GET /forecast/*` - Forecasting endpoints
- `GET /filters/*` - Filter endpoints
- `GET /threshold/*` - Threshold management endpoints

## Data Flow

```
Frontend (Port 3000)
    │
    ├─→ Express Auth Server (Port 8000)
    │       └─→ MongoDB Atlas Account #1 (Users)
    │
    └─→ FastAPI Server (Port 8001)
            └─→ MongoDB Atlas Account #2 (Models)
```

## Development Workflow

1. **Start Express Server**:

   ```bash
   cd backend/server-auth
   npm install
   npm run dev
   ```

2. **Start FastAPI Server**:

   ```bash
   cd backend
   pip install -r requirements.txt
   uvicorn app:app --reload --port 8001
   ```

3. **Both servers run independently** and can be started/stopped separately.

## Security Considerations

- **JWT Tokens**: Express server generates JWT tokens for authentication
- **Password Hashing**: bcrypt with salt rounds
- **CORS**: Configured for frontend origin
- **Environment Variables**: Never commit `.env` files
- **Separate Databases**: User data and model data isolated

## Troubleshooting

### Express Server Issues

- **MongoDB Connection Failed**: Check `MONGODB_URI` in `server-auth/.env`
- **JWT Errors**: Verify `JWT_SECRET` is set
- **Port Already in Use**: Change `PORT` in `.env`

### FastAPI Server Issues

- **Model Loading Failed**: Check `MONGODB_MODELS_URI` in `backend/.env`
- **Connection Timeout**: Verify MongoDB Atlas IP whitelist
- **Model Not Found**: Check GridFS storage or local `models/` directory

## Migration Notes

- Express server was moved from `frontend/server/` to `backend/server-auth/`
- **No conversion to Python** - remains Node.js/Express
- All functionality preserved
- Environment variables updated for new location
