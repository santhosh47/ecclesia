"""Prometheus metrics instrumentation and operational telemetry for Ecclesia."""

import platform
import time
from typing import Callable

from fastapi import FastAPI, Request, Response
from prometheus_client import (
    CONTENT_TYPE_LATEST,
    Counter,
    Gauge,
    Histogram,
    Info,
    REGISTRY,
    generate_latest,
)
from starlette.middleware.base import BaseHTTPMiddleware

from app.core.config import get_settings
from app.database.session import engine

settings = get_settings()

# 1. Application Metadata Info
APP_INFO = Info(
    "ecclesia_app",
    "Ecclesia application metadata and runtime environment",
)
APP_INFO.info({
    "version": "0.4.0",
    "service": settings.app_name,
    "python_version": platform.python_version(),
    "environment": "production" if not settings.debug else "development",
})

# 2. HTTP Request Counters and Gauges
HTTP_REQUESTS_TOTAL = Counter(
    "ecclesia_http_requests_total",
    "Total count of HTTP requests processed by Ecclesia API",
    ["method", "endpoint", "status_code"],
)

HTTP_REQUEST_DURATION_SECONDS = Histogram(
    "ecclesia_http_request_duration_seconds",
    "HTTP request execution latency distribution in seconds",
    ["method", "endpoint"],
    buckets=(0.005, 0.01, 0.025, 0.05, 0.075, 0.1, 0.25, 0.5, 0.75, 1.0, 2.5, 5.0),
)

HTTP_REQUESTS_IN_PROGRESS = Gauge(
    "ecclesia_http_requests_in_progress",
    "Number of HTTP requests currently being processed",
    ["method", "endpoint"],
)

# 3. Database Connection Pool Telemetry
DB_POOL_SIZE = Gauge(
    "ecclesia_db_pool_size",
    "Configured maximum capacity of SQLAlchemy database connection pool",
)
DB_POOL_CHECKED_OUT = Gauge(
    "ecclesia_db_pool_checked_out_connections",
    "Number of active database connections currently checked out",
)
DB_POOL_OVERFLOW = Gauge(
    "ecclesia_db_pool_overflow_connections",
    "Number of overflow connections active in connection pool",
)


def update_database_pool_metrics() -> None:
    """Sample current SQLAlchemy connection pool metrics and update gauges."""
    try:
        pool = engine.pool
        if hasattr(pool, "size"):
            DB_POOL_SIZE.set(pool.size())
        if hasattr(pool, "checkedout"):
            DB_POOL_CHECKED_OUT.set(pool.checkedout())
        if hasattr(pool, "overflow"):
            DB_POOL_OVERFLOW.set(pool.overflow())
    except Exception:
        pass


def get_normalized_path(request: Request) -> str:
    """Extract low-cardinality endpoint pattern to prevent Prometheus metric explosion."""
    route = request.scope.get("endpoint")
    if route and hasattr(route, "__name__"):
        return route.__name__
    
    path = request.url.path
    # Group API dynamic ID paths: /api/v1/members/123 -> /api/v1/members/{id}
    segments = path.strip("/").split("/")
    normalized = []
    for seg in segments:
        if seg.isdigit():
            normalized.append("{id}")
        else:
            normalized.append(seg)
    return "/" + "/".join(normalized) if normalized else "/"


class PrometheusMetricsMiddleware(BaseHTTPMiddleware):
    """Asynchronous HTTP middleware tracking request rates, durations, and active counts."""

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        path = request.url.path
        # Exclude /metrics itself and static assets from metrics tracking to avoid feedback loops
        if path == "/metrics" or path.startswith("/assets") or path.startswith("/uploads"):
            return await call_next(request)

        method = request.method
        endpoint = get_normalized_path(request)
        
        HTTP_REQUESTS_IN_PROGRESS.labels(method=method, endpoint=endpoint).inc()
        start_time = time.perf_counter()
        status_code = 500

        try:
            response = await call_next(request)
            status_code = response.status_code
            return response
        except Exception:
            status_code = 500
            raise
        finally:
            elapsed = time.perf_counter() - start_time
            HTTP_REQUESTS_IN_PROGRESS.labels(method=method, endpoint=endpoint).dec()
            HTTP_REQUESTS_TOTAL.labels(method=method, endpoint=endpoint, status_code=str(status_code)).inc()
            HTTP_REQUEST_DURATION_SECONDS.labels(method=method, endpoint=endpoint).observe(elapsed)


def prometheus_metrics_response() -> Response:
    """Generate Prometheus exposition text response."""
    update_database_pool_metrics()
    return Response(
        content=generate_latest(REGISTRY),
        media_type=CONTENT_TYPE_LATEST,
    )
