import os
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from app.api.v1.router import router as api_v1_router
from app.core.config import get_settings
from app.database.init_db import initialize_database

settings = get_settings()


def get_frontend_dist_path() -> Path | None:
    """Locate the built React frontend dist directory if it exists."""
    env_dir = os.environ.get("FRONTEND_DIST_DIR")
    if env_dir:
        p = Path(env_dir)
        if p.is_dir() and (p / "index.html").is_file():
            return p

    backend_dir = Path(__file__).resolve().parent.parent
    candidates = [
        backend_dir.parent / "admin-portal" / "dist",
        backend_dir / "static",
        backend_dir / "dist",
        Path("admin-portal/dist"),
        Path("static"),
        Path("dist"),
    ]
    for candidate in candidates:
        if candidate.is_dir() and (candidate / "index.html").is_file():
            return candidate.resolve()
    return None


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

cors_origins = [origin.strip() for origin in settings.cors_origins.split(",") if origin.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins or ["*"],
    allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1)(:\d+)?$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def add_security_headers(request, call_next):
    """Add defensive security headers to all HTTP responses."""
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"
    return response


app.include_router(api_v1_router, prefix=settings.api_v1_prefix)


@app.get("/api/v1/health", tags=["system"])
def health_check() -> dict[str, str]:
    """Health check response."""
    return {"status": "ok"}


uploads_dir = Path(__file__).resolve().parent.parent / "uploads"
uploads_dir.mkdir(parents=True, exist_ok=True)
(uploads_dir / "avatars").mkdir(parents=True, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=str(uploads_dir)), name="uploads")


dist_path = get_frontend_dist_path()
if dist_path:
    assets_dir = dist_path / "assets"
    if assets_dir.is_dir():
        app.mount("/assets", StaticFiles(directory=str(assets_dir)), name="static-assets")

    @app.get("/{full_path:path}", include_in_schema=False)
    async def serve_spa(full_path: str):
        """Serve static files or fallback to React index.html for client-side routing."""
        # Never intercept API, uploads, or documentation routes
        if full_path.startswith("api/") or full_path.startswith("uploads/") or full_path in {"docs", "openapi.json", "redoc"}:
            raise HTTPException(status_code=404, detail="Not Found")

        target_file = dist_path / full_path
        if full_path and target_file.is_file():
            return FileResponse(target_file)

        return FileResponse(dist_path / "index.html")
else:
    @app.get("/", tags=["system"])
    def root() -> dict[str, str]:
        """Return a small service-identification response when no frontend build is present."""
        return {"service": settings.app_name, "status": "running"}


