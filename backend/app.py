from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException
from pathlib import Path
import os
import logging
from dotenv import load_dotenv

from api.utils.lifespan import lifespan
from api.utils.dashboard_utils import dashboard_filter
from api.data_loader import df
from api.middleware.error_handler import (
    validation_exception_handler,
    http_exception_handler,
    general_exception_handler,
)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Routers
from api.routes.dashboard import dashboard_router
from api.routes.auth import auth_router
from api.routes.user import user_router
from api.routes.admin import admin_router
from api.routes.filters import filter_router
from api.routes.forecast import forecast_router
from api.routes.threshold_actions import threshold_router
from api.routes.alerts import alerts_router

load_dotenv()

app = FastAPI(
    title="Early Warning System API",
    description="Backend API for Pest Monitoring and Forecasting",
    version="0.1.0",
    lifespan=lifespan,
)

# CORS configuration
origins = [
    "http://localhost:3000",  # React dev (default)
    "http://localhost:3001",  # React dev (alternative port)
    "http://127.0.0.1:3000",
    "http://127.0.0.1:3001",
    "http://localhost:5173",  # Vite default
    os.getenv("FRONTEND_URL", "http://localhost:3000"),
]

# Remove duplicates and None values
origins = list(set([o for o in origins if o]))

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# Serve uploaded files
UPLOAD_DIR = Path(__file__).parent / "uploads"
UPLOAD_DIR.mkdir(exist_ok=True)
app.mount("/uploads", StaticFiles(directory=str(UPLOAD_DIR)), name="uploads")


@app.get("/")
def root():
    return {"message": "Early Warning System API", "status": "running"}


@app.get("/health")
def health():
    return {"ok": True}


# Include routers
app.include_router(auth_router)
app.include_router(user_router)
app.include_router(admin_router)
app.include_router(dashboard_router)
app.include_router(filter_router)
app.include_router(forecast_router)
app.include_router(threshold_router)
app.include_router(alerts_router)

# Add exception handlers
app.add_exception_handler(RequestValidationError, validation_exception_handler)
app.add_exception_handler(StarletteHTTPException, http_exception_handler)
app.add_exception_handler(Exception, general_exception_handler)
