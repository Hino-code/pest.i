# Minimal .env Configuration

## Minimum Required Configuration

For the system to work, you only need **2 things**:

```env
# 1. REQUIRED: User authentication database
MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/users_db?retryWrites=true&w=majority

# 2. REQUIRED: JWT secret key
JWT_SECRET=your-secret-key-change-in-production
```

That's it! Everything else is optional.

## Complete Example (All Options)

```env
# ============================================
# REQUIRED
# ============================================
MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/users_db?retryWrites=true&w=majority
JWT_SECRET=your-secret-key-change-in-production

# ============================================
# OPTIONAL - Models (uses local models if not set)
# ============================================
# MONGODB_MODELS_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/forecast_db?retryWrites=true&w=majority
# MONGODB_MODELS_DB_NAME=models_db

# ============================================
# OPTIONAL - Admin User (defaults shown)
# ============================================
ADMIN_EMAIL=admin@ews.local
ADMIN_PASSWORD=admin123
ADMIN_NAME=System Administrator
ADMIN_ROLE=Administrator

# ============================================
# OPTIONAL - Frontend URL (defaults to localhost:3000)
# ============================================
FRONTEND_URL=http://localhost:3000
```

## Quick Setup

1. Copy the template:

   ```bash
   cp backend/.env.example backend/.env
   ```

2. Edit `backend/.env` and add your MongoDB URI:

   ```env
   MONGODB_URI=your-actual-mongodb-connection-string
   JWT_SECRET=any-random-secret-string
   ```

3. That's it! Start the server.

## What Each Field Does

| Field                    | Required?  | Purpose                                      |
| ------------------------ | ---------- | -------------------------------------------- |
| `MONGODB_URI`            | ✅ **YES** | User authentication database                 |
| `JWT_SECRET`             | ✅ **YES** | JWT token signing                            |
| `MONGODB_MODELS_URI`     | ❌ No      | Model storage (uses local if not set)        |
| `MONGODB_MODELS_DB_NAME` | ❌ No      | Model database name (default: models_db)     |
| `ADMIN_EMAIL`            | ❌ No      | Admin email (default: admin@ews.local)       |
| `ADMIN_PASSWORD`         | ❌ No      | Admin password (default: admin123)           |
| `ADMIN_NAME`             | ❌ No      | Admin name (default: System Administrator)   |
| `ADMIN_ROLE`             | ❌ No      | Admin role (default: Administrator)          |
| `FRONTEND_URL`           | ❌ No      | CORS origin (default: http://localhost:3000) |

## Notes

- **Models**: System automatically uses local models if `MONGODB_MODELS_URI` is not set
- **Admin User**: Created automatically on first startup with default values if not specified
- **CORS**: Defaults to `http://localhost:3000` if `FRONTEND_URL` not set
