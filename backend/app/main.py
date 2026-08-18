"""FastAPI application entry point."""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.router import router as api_v1_router
from app.core.config import get_settings
from app.database.init_db import initialize_database

settings = get_settings()


@asynccontextmanager
async def lifespan(_: FastAPI):
    """Initialize resources required by the application."""

    initialize_database()
    yield


app = FastAPI(
    title=settings.app_name,
    debug=settings.debug,
    lifespan=lifespan,
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in settings.cors_origins.split(",")],
    allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1)(:\d+)?$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(api_v1_router, prefix=settings.api_v1_prefix)


@app.get("/", tags=["system"])
def root() -> dict[str, str]:
    """Return a small service-identification response."""

    return {"service": settings.app_name, "status": "running"}


@app.get("/api/v1/health", tags=["system"])
def health_check() -> dict[str, str]:
    """Health check response."""
    return {"status": "ok"}

