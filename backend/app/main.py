import os
import time
import uuid
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import Depends, FastAPI, HTTPException, Request, Response, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.api.v1.router import router as api_v1_router
from app.core.config import get_settings
from app.core.errors import register_error_handlers
from app.core.logging import get_logger, request_id_ctx, setup_logging
from app.core.metrics import PrometheusMetricsMiddleware, prometheus_metrics_response
from app.database.init_db import initialize_database
from app.database.session import dispose_engine, get_db

settings = get_settings()
logger = get_logger("main")


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
    setup_logging(log_level=settings.log_level, log_file=settings.log_file)
    logger.info("Initializing Ecclesia application and database...")
    initialize_database()
    logger.info("Ecclesia application ready.")
    yield
    logger.info("Ecclesia application shutting down.")
    dispose_engine()
    logger.info("Database connection pool cleanly disposed.")


OPENAPI_DESCRIPTION = """
## Ecclesia Church Management System (ChMS) REST API

**Ecclesia** is a modern, enterprise-grade Church Management System engineered for churches, dioceses, and Christian non-profit organizations.

### Key Capabilities
- **Security & RBAC**: RFC 7519 signed JWT tokens with sliding-window rate limiting on login and strict role hierarchies (`super_admin`, `admin`, `pastor`, `treasurer`, `staff`, `viewer`).
- **Congregation & Ministry Management**: Full membership lifecycle, household groupings, and ministry team rosters.
- **Double-Entry Financial Ledger**: Immutable double-entry bookkeeping, fund accounting, tithe tracking, and statutory compliance.
- **Pastoral Care & Milestones**: Confidential counseling records, visitation logs, and official sacramental certificates.
- **Asynchronous Operations**: Background task worker for automated SMS/email broadcasts.
- **Audit Trail & System Resilience**: Append-only audit logs for regulatory compliance and ACID-safe database live backups with gzip compression.

### Authentication
Protected endpoints require an `Authorization: Bearer <token>` header. Authenticate via the `POST /api/v1/auth/login` endpoint to receive a valid bearer token.
"""

TAGS_METADATA = [
    {
        "name": "auth",
        "description": "Authentication services, credential verification, and RFC 7519 signed JWT session issuance.",
    },
    {
        "name": "users",
        "description": "Church staff, pastor, and administrative user account lifecycle management with role-based access control.",
    },
    {
        "name": "members",
        "description": "Congregation membership directory, profiles, contact records, spiritual milestones, and status tracking.",
    },
    {
        "name": "households",
        "description": "Family and household unit groupings, primary contacts, and multi-generational congregation relations.",
    },
    {
        "name": "ministries",
        "description": "Church ministry teams, committee rosters, volunteer assignments, and departmental leadership.",
    },
    {
        "name": "finances",
        "description": "Donation tracking, tithes, pledge campaigns, fund allocations, and donor statements.",
    },
    {
        "name": "ledger",
        "description": "Double-entry accounting journal, chart of accounts, trial balances, and financial reporting.",
    },
    {
        "name": "compliance",
        "description": "Statutory regulatory compliance, donor tax documentation, and automated validation rules.",
    },
    {
        "name": "pastoral",
        "description": "Confidential pastoral care records, member visitation logs, prayer requests, and counseling notes.",
    },
    {
        "name": "certificates",
        "description": "Official sacramental and milestone certificates (Baptism, Confirmation, Marriage, Dedication).",
    },
    {
        "name": "messaging",
        "description": "Congregational SMS, email announcements, and automated communication dispatch via background tasks.",
    },
    {
        "name": "calendar",
        "description": "Church calendar, liturgical schedules, recurring services, and campus facility reservations.",
    },
    {
        "name": "events",
        "description": "Church events, conferences, registrations, and volunteer assignments.",
    },
    {
        "name": "attendance",
        "description": "Service attendance tracking, headcounts, visitor check-ins, and trend analysis.",
    },
    {
        "name": "audit-logs",
        "description": "Immutable statutory audit trail recording all administrative mutations, logins, and downloads.",
    },
    {
        "name": "system",
        "description": "System administration, ACID-safe database snapshots, backup downloads, and retention management.",
    },
    {
        "name": "health",
        "description": "System health diagnostics, active database connection probes, and service readiness checks.",
    },
    {
        "name": "localization",
        "description": "Multi-language locale support, translation bundles, and regional church formatting preferences.",
    },
    {
        "name": "csv-migration",
        "description": "Bulk CSV import and export utilities for membership data, contributions, and historical records.",
    },
    {
        "name": "seed",
        "description": "Database initialization, demo dataset seeding, and development fixture generation.",
    },
    {
        "name": "metrics",
        "description": "Prometheus operational telemetry, request latency histograms, and database connection pool states.",
    },
]

app = FastAPI(
    title=settings.app_name,
    version="1.0.0",
    description=OPENAPI_DESCRIPTION,
    openapi_tags=TAGS_METADATA,
    contact={
        "name": "Ecclesia Engineering Team",
        "url": "https://github.com/santhosh47/ecclesia",
        "email": "support@ecclesia.org",
    },
    license_info={
        "name": "MIT License",
        "url": "https://opensource.org/licenses/MIT",
    },
    swagger_ui_parameters={
        "defaultModelsExpandDepth": -1,
        "docExpansion": "none",
        "filter": True,
        "persistAuthorization": True,
        "syntaxHighlight.theme": "monokai",
        "tryItOutEnabled": True,
    },
    debug=settings.debug,
    lifespan=lifespan,
)


def custom_openapi():
    """Generate OpenAPI schema with explicit BearerAuth security scheme configuration."""
    if app.openapi_schema:
        return app.openapi_schema

    from fastapi.openapi.utils import get_openapi

    openapi_schema = get_openapi(
        title=app.title,
        version=app.version,
        description=app.description,
        routes=app.routes,
        tags=app.openapi_tags,
        contact=app.contact,
        license_info=app.license_info,
    )

    # Register HTTPBearer security scheme
    components = openapi_schema.setdefault("components", {})
    security_schemes = components.setdefault("securitySchemes", {})
    security_schemes["BearerAuth"] = {
        "type": "http",
        "scheme": "bearer",
        "bearerFormat": "JWT",
        "description": "Enter your RFC 7519 signed JWT token obtained from `/api/v1/auth/login`",
    }

    # Optional global security declaration
    openapi_schema["security"] = [{"BearerAuth": []}]

    app.openapi_schema = openapi_schema
    return app.openapi_schema


app.openapi = custom_openapi

register_error_handlers(app)

cors_origins = [origin.strip() for origin in settings.cors_origins.split(",") if origin.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins or ["*"],
    allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1)(:\d+)?$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(PrometheusMetricsMiddleware)


@app.middleware("http")
async def log_requests(request: Request, call_next) -> Response:
    """Log incoming HTTP request, measure latency, track correlation ID, and record errors."""
    req_id = request.headers.get("X-Request-ID") or str(uuid.uuid4())[:8]
    token = request_id_ctx.set(req_id)

    client_ip = request.client.host if request.client else "unknown"
    method = request.method
    path = request.url.path
    query = request.url.query
    full_path = f"{path}?{query}" if query else path

    logger.info(f"--> {method} {full_path} from {client_ip}")
    start_time = time.perf_counter()

    try:
        response = await call_next(request)
        elapsed_ms = (time.perf_counter() - start_time) * 1000.0
        response.headers["X-Request-ID"] = req_id
        logger.info(f"<-- {method} {path} {response.status_code} ({elapsed_ms:.1f}ms)")
        return response
    except Exception as exc:
        elapsed_ms = (time.perf_counter() - start_time) * 1000.0
        logger.error(f"<-- {method} {path} ERROR: {exc} ({elapsed_ms:.1f}ms)", exc_info=True)
        raise exc
    finally:
        request_id_ctx.reset(token)


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


@app.get(
    "/metrics",
    tags=["metrics"],
    summary="Prometheus Telemetry Metrics",
    description="Expose live Prometheus metrics including HTTP request rates, latency distributions, and database connection pool states.",
    response_class=Response,
)
def get_metrics() -> Response:
    """Return Prometheus formatted exposition text for monitoring and scrapers."""
    return prometheus_metrics_response()


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
        # Never intercept API, uploads, documentation, or metrics routes
        if (
            full_path.startswith("api/")
            or full_path.startswith("uploads/")
            or full_path in {"docs", "openapi.json", "redoc", "metrics"}
        ):
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


