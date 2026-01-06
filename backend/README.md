# Backend - Early Warning System

This directory contains the unified FastAPI backend for the Early Warning System for Pest Monitoring and Forecasting.

## 📁 Structure

```
backend/
├── api/                    # FastAPI application code
│   ├── routes/            # API route handlers
│   │   ├── auth.py        # Authentication (login, register)
│   │   ├── user.py        # User profile management
│   │   ├── admin.py       # Admin user approval
│   │   ├── dashboard.py   # Dashboard data endpoints
│   │   ├── filters.py     # Filter endpoints
│   │   ├── forecast.py   # Forecasting endpoints
│   │   └── threshold_actions.py  # Threshold management
│   ├── models/            # Pydantic models
│   │   └── user.py       # User models and schemas
│   ├── utils/             # Utility functions
│   │   ├── lifespan.py    # Application lifespan management
│   │   └── startup.py    # Database initialization
│   ├── dependencies.py   # FastAPI dependencies (auth)
│   ├── auth_utils.py     # JWT and password utilities
│   ├── db.py             # User database connection
│   ├── data_loader.py    # Data loading utilities
│   ├── model_loader.py   # ML model loading
│   └── mongo_client.py  # Models database connection
├── data/                  # Data files
│   └── data1.csv         # Sample data
├── models/                # ML models (local cache)
├── uploads/              # User-uploaded files (profile photos)
├── app.py                # FastAPI application entry point
├── requirements.txt      # Python dependencies
└── README.md            # This file
```

## 🚀 Getting Started

### Prerequisites

- **Python 3.8+** and pip
- **MongoDB Atlas account** (REQUIRED for user management)
- **MongoDB Atlas account for models** (OPTIONAL - system works with local models)

### Installation

1. **Install Python dependencies:**

   ```bash
   cd backend
   pip install -r requirements.txt
   ```

2. **Configure environment variables:**

   Create a `.env` file in the root `backend/` directory:

   ```env
   # MongoDB Atlas Account #1: User Management Database (REQUIRED)
   MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/users_db?retryWrites=true&w=majority

   # MongoDB Atlas Account #2: Model Storage Database (OPTIONAL)
   # If not provided, system will use local models from backend/models/ directory
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

   **Note**:

   - `MONGODB_URI` is **REQUIRED** for user authentication
   - `MONGODB_MODELS_URI` is **OPTIONAL** - if not set or connection fails, the system automatically uses local models from `backend/models/` directory
   - Local model files are already included: `final-model(xgboost)-1.json` and `final-model(xgboost)-2.json`

### Running the Server

```bash
cd backend
uvicorn app:app --reload --port 8001
```

The API will be available at `http://localhost:8001`

## 🔧 API Endpoints

### Authentication

- `POST /auth/register` - Register new user (pending approval)
- `POST /auth/login` - Authenticate user and get JWT token

### User Management

- `GET /user/me` - Get current user profile (requires auth)
- `PATCH /user/me` - Update user profile (requires auth)
- `PATCH /user/me/password` - Change password (requires auth)
- `POST /user/me/photo` - Upload profile photo (requires auth)

### Admin

- `GET /admin/pending-users` - List pending users (admin only)
- `POST /admin/pending-users/{id}/approve` - Approve user (admin only)
- `POST /admin/pending-users/{id}/reject` - Reject user (admin only)

### Data & Analytics

- `GET /dashboard/*` - Dashboard data endpoints
- `GET /forecast/*` - Forecast data endpoints
- `GET /filters/*` - Filter endpoints
- `GET /threshold/*` - Threshold management endpoints

## 🗄️ Database Architecture

### Two Separate MongoDB Atlas Accounts

1. **User Management Database** (MongoDB Atlas Account #1) - **REQUIRED**

   - Connection: `MONGODB_URI` in `.env`
   - Purpose: User accounts, authentication, profiles
   - Collections: `users`
   - **Status**: Required for authentication to work

2. **Model Storage Database** (MongoDB Atlas Account #2) - **OPTIONAL**

   - Connection: `MONGODB_MODELS_URI` in `.env`
   - Purpose: ML model storage (GridFS) for downloading/updating models
   - Database: `models_db` (configurable)
   - **Status**: Optional - system has automatic fallback to local models
   - **Fallback**: If connection fails or not configured, uses local models from `backend/models/` directory

## 🔒 Security

- JWT-based authentication with 7-day expiration
- Password hashing with bcrypt
- Role-based access control (Administrator, Researcher, Field Manager)
- CORS configuration for frontend
- Input validation with Pydantic models

## 🧪 Testing

```bash
cd backend
# Add test scripts as needed
```

## 📝 Notes

- **Unified Backend**: All API endpoints (auth, data, admin) in single FastAPI application
- **Single Technology Stack**: Python + FastAPI (no Node.js/Express)
- **Database Separation**: User data and model data use separate MongoDB Atlas accounts
- **Auto-seeding**: Admin user is automatically created on first startup
- **File Uploads**: Profile photos stored in `uploads/` directory

## 🐛 Troubleshooting

**Issue**: Cannot connect to MongoDB

- **Solution**: Ensure MongoDB Atlas accounts are accessible and IP whitelist is configured

**Issue**: Port already in use

- **Solution**: Change port: `uvicorn app:app --reload --port 8002`

**Issue**: JWT authentication fails

- **Solution**: Verify `JWT_SECRET` is set and consistent

**Issue**: CORS errors

- **Solution**: Check `FRONTEND_URL` matches your frontend URL

**Issue**: Admin user not created

- **Solution**: Check `ADMIN_EMAIL` and `ADMIN_PASSWORD` in `.env`

## 📚 Additional Resources

- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [MongoDB Documentation](https://docs.mongodb.com/)
- [Pydantic Documentation](https://docs.pydantic.dev/)
