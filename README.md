# Early Warning System for Pest Monitoring and Forecasting

A comprehensive full-stack application for monitoring pest activity in rice fields and forecasting future outbreaks using data-driven models. Developed as a capstone project in partnership with PhilRice-MES.

## 📋 Project Structure

```
System/
├── frontend/          # React + TypeScript frontend application
│   ├── src/          # Source code
│   ├── public/       # Static assets
│   └── package.json  # Frontend dependencies
│
├── backend/          # Backend services
│   ├── api/         # FastAPI application (data & analytics)
│   ├── server-auth/ # Express.js authentication server
│   ├── data/        # Data files
│   ├── models/      # ML models
│   ├── app.py       # FastAPI entry point
│   └── requirements.txt  # Python dependencies
│
├── .gitignore       # Git ignore rules
└── README.md        # This file
```

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+ and npm
- **Python** 3.8+ and pip
- **MongoDB** database

### Installation

1. **Clone the repository** (if not already done)

   ```bash
   git clone <repository-url>
   cd System
   ```

2. **Install Frontend Dependencies**

   ```bash
   cd frontend
   npm install
   cd ..
   ```

3. **Install Backend Dependencies**

   **Python (FastAPI):**

   ```bash
   cd backend
   pip install -r requirements.txt
   ```

4. **Configure Environment Variables**

   **Frontend** - Create `frontend/.env`:

   ```env
   VITE_API_BASE_URL=http://localhost:8000
   VITE_USE_MOCKS=false
   ```

   **Backend** - Create `backend/.env`:

   ```env
   # MongoDB Atlas Account #1: User Management Database
   MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/users_db?retryWrites=true&w=majority

   # MongoDB Atlas Account #2: Model Storage Database (SEPARATE from users)
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

   **Important**:

   - `MONGODB_URI` is **REQUIRED** for user authentication
   - `MONGODB_MODELS_URI` is **OPTIONAL** - system automatically uses local models if not configured or connection fails

### Running the Application

#### Option 1: Run Services Separately (Recommended for Development)

**Terminal 1 - FastAPI Backend:**

```bash
cd backend
uvicorn app:app --reload --port 8001
```

**Terminal 2 - Frontend:**

```bash
cd frontend
npm run dev
```

#### Option 2: Use Concurrently (All Services Together)

Install concurrently globally:

```bash
npm install -g concurrently
```

Run all services:

```bash
concurrently \
  "cd backend && uvicorn app:app --reload --port 8001" \
  "cd frontend && npm run dev" \
  --names "api,frontend" \
  --prefix-colors "cyan,green"
```

Or use the npm script:

```bash
npm run dev:all
```

## 🌐 Service URLs

Once all services are running:

- **Frontend**: http://localhost:3000
- **FastAPI Backend API**: http://localhost:8001

## 📚 Documentation

- **[Frontend README](./frontend/README.md)** - Frontend-specific documentation
- **[Backend README](./backend/README.md)** - Backend services documentation
- **[Frontend Docs](./frontend/docs/)** - Additional frontend documentation

## 🏗️ Architecture

### Frontend (React + TypeScript)

- **Port**: 3000
- **Framework**: React 18.3 with Vite
- **State Management**: Zustand
- **UI Components**: shadcn/ui, Radix UI
- **Charts**: Recharts

### Backend Services

#### FastAPI Backend Server (Python)

- **Port**: 8001
- **Technology**: Python + FastAPI
- **Purpose**:
  - User authentication, registration, profile management
  - Data processing, forecasting, analytics
  - Admin user management
- **Databases**:
  - MongoDB Atlas Account #1: User management (users collection)
  - MongoDB Atlas Account #2: Model storage (GridFS)
- **Authentication**: JWT tokens
- **ML Models**: XGBoost models for forecasting
- **Note**: Single unified backend - all API endpoints in one FastAPI application

## 🔧 Development

### Frontend Development

```bash
cd frontend
npm run dev      # Start dev server
npm run build    # Build for production
npm run test     # Run tests
```

### Backend Development

```bash
cd backend
uvicorn app:app --reload --port 8001
```

## 🧪 Testing

### Frontend Tests

```bash
cd frontend
npm run test
```

### Backend Tests

Add test scripts to respective backend services as needed.

## 🚢 Deployment

### Frontend Deployment (Vercel)

1. Push code to GitHub
2. Import repository to Vercel
3. Configure environment variables
4. Deploy

See [Frontend README](./frontend/README.md) for detailed deployment instructions.

### Backend Deployment

- FastAPI server can be deployed to services like Heroku, Railway, DigitalOcean, or AWS
- Can use Docker for containerized deployment
- Single backend simplifies deployment and scaling

## 🔒 Security

- JWT-based authentication
- Password hashing with bcrypt
- CORS configuration
- Role-based access control
- Input validation with Zod schemas

## 👥 User Roles

- **Administrator**: Full system access, user management
- **Researcher**: Monitoring, analysis, forecasting
- **Field Manager**: Dashboard access, threshold management
- **Demo User**: Read-only demo access

## 🐛 Troubleshooting

### Common Issues

**MongoDB Connection Issues**

- Ensure both MongoDB Atlas accounts are accessible
- Check `MONGODB_URI` in `backend/.env` (users database)
- Check `MONGODB_MODELS_URI` in `backend/.env` (models database)
- Verify network connectivity and Atlas IP whitelist settings

**Port Already in Use**

- Change port in configuration
- Stop conflicting services
- Check what's using the port: `lsof -i :8000` (or respective port)

**CORS Errors**

- Verify CORS configuration in backend servers
- Check frontend URL matches allowed origins
- Ensure credentials are properly configured

**Authentication Failures**

- Verify JWT_SECRET is set
- Check token expiration
- Ensure user status is "approved"

## 📝 License

This project is developed as a capstone project. All rights reserved.

## 🙏 Acknowledgments

- **PhilRice-MES** - Project partner and domain expertise
- All open-source contributors and libraries used in this project

---

**Version**: 0.1.0  
**Last Updated**: December 2024
