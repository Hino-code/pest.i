from sys import prefix
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api.utils.lifespan import lifespan
from api.utils.dashboard_utils import dashboard_filter
from api.data_loader import df

# routers

from api.routes.dashboard import dashboard_router
from api.routes.auth import auth_router
from api.routes.filters import filter_router
from api.routes.forecast import forecast_router
from api.routes.threshold_actions import threshold_router

app = FastAPI(lifespan=lifespan)

origins = [
    "http://localhost:3000",  # React dev
    "http://127.0.0.1:3000",
    "http://localhost:5173",
    "*",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def root():
    return "Welcome hahaha"


app.include_router(dashboard_router)
app.include_router(auth_router)
app.include_router(filter_router)
app.include_router(forecast_router)
app.include_router(threshold_router)
