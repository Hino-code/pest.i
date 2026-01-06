# ML Models - MongoDB Optional

## Overview

The backend can work **WITHOUT** MongoDB for models. The system has a built-in fallback mechanism.

## How Model Loading Works

### 1. Primary: MongoDB GridFS (Optional)

- If `MONGODB_MODELS_URI` is configured and connection succeeds
- Downloads latest model from GridFS
- Caches model locally in `backend/models/` directory
- Useful for: Updating models remotely, version control

### 2. Fallback: Local Models (Default)

- If MongoDB connection fails or `MONGODB_MODELS_URI` is not set
- Automatically uses local models from `backend/models/` directory
- Uses most recently modified model file
- **This is the default behavior**

## Current Local Models

The repository includes pre-trained models:

- `final-model(xgboost)-1.json`
- `final-model(xgboost)-2.json`

These models are ready to use without any MongoDB connection.

## Configuration

### Option 1: Use Local Models Only (Simplest)

**No configuration needed!** Just ensure model files exist in `backend/models/` directory.

The system will automatically:

1. Try to connect to MongoDB (if `MONGODB_MODELS_URI` is set)
2. If connection fails → Use local models
3. If no `MONGODB_MODELS_URI` → Use local models directly

### Option 2: Use MongoDB for Models (Optional)

Add to `backend/.env`:

```env
MONGODB_MODELS_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/forecast_db?retryWrites=true&w=majority
MONGODB_MODELS_DB_NAME=models_db
```

**Benefits:**

- Remote model updates
- Version control
- Centralized model management

**Note:** Even with MongoDB configured, if connection fails, system automatically falls back to local models.

## Startup Behavior

When the server starts:

1. **Try MongoDB connection** (if `MONGODB_MODELS_URI` is set)

   - ✅ Success → Download/use model from GridFS
   - ❌ Failure → Fallback to local models

2. **No MongoDB configured**

   - ✅ Use local models directly

3. **No models found** (neither MongoDB nor local)
   - ⚠️ Warning: "No model found. Predictions will fail."
   - Server still starts, but forecast endpoints will error

## Example Startup Logs

### With MongoDB (Online Mode):

```
🔌 Connecting to MongoDB...
✅ Connected successfully (Online Mode)!
🔎 Latest DB Model: model-v2.json (Size: 123456 bytes)
⬇️ Downloading model-v2.json...
✅ Download complete.
✅ Model loaded successfully!
```

### Without MongoDB (Offline Mode):

```
🔌 Connecting to MongoDB...
⚠️ NETWORK ERROR: Could not connect to MongoDB.
🔄 Switching to OFFLINE MODE...
📂 OFFLINE MODE: Selected local model: final-model(xgboost)-1.json
✅ Model loaded successfully!
```

## Summary

- **MongoDB for models**: OPTIONAL
- **Local models**: Always available as fallback
- **User MongoDB**: REQUIRED (for authentication)
- **System works**: Even without model MongoDB connection

## Recommendation

For development/testing:

- Use local models only (no `MONGODB_MODELS_URI` needed)
- Faster startup
- No external dependencies

For production:

- Consider MongoDB for centralized model management
- But local fallback ensures reliability
