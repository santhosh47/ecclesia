"""Standardized error responses and global exception handlers for Ecclesia."""

from typing import Any

from fastapi import FastAPI, Request, status
from fastapi.encoders import jsonable_encoder
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.core.logging import get_logger, request_id_ctx

logger = get_logger("errors")

STATUS_CODE_TO_ERROR_CODE: dict[int, str] = {
    400: "BAD_REQUEST",
    401: "UNAUTHORIZED",
    403: "FORBIDDEN",
    404: "NOT_FOUND",
    405: "METHOD_NOT_ALLOWED",
    409: "CONFLICT",
    422: "VALIDATION_ERROR",
    429: "RATE_LIMIT_EXCEEDED",
    500: "INTERNAL_SERVER_ERROR",
    502: "BAD_GATEWAY",
    503: "SERVICE_UNAVAILABLE",
    504: "GATEWAY_TIMEOUT",
}


def build_error_envelope(
    *,
    status_code: int,
    detail: Any,
    message: str | None = None,
    error_code: str | None = None,
    extra_details: Any = None,
    request_id: str | None = None,
) -> dict[str, Any]:
    """Build a structured error envelope while preserving the legacy 'detail' field for backward compatibility."""
    req_id = request_id or request_id_ctx.get()
    if req_id == "-":
        req_id = None

    code = error_code or STATUS_CODE_TO_ERROR_CODE.get(status_code, "HTTP_ERROR")

    # If detail is a string and no custom message is provided, use detail as human message
    msg = message
    if msg is None:
        if isinstance(detail, str):
            msg = detail
        else:
            msg = f"HTTP {status_code} Error"

    return {
        "detail": detail,
        "error": {
            "code": code,
            "message": msg,
            "status_code": status_code,
            "details": extra_details,
            "request_id": req_id,
        },
    }


async def http_exception_handler(request: Request, exc: StarletteHTTPException) -> JSONResponse:
    """Handle HTTP exceptions with the standardized error envelope."""
    headers = dict(getattr(exc, "headers", None) or {})
    req_id = request_id_ctx.get()
    if req_id and req_id != "-":
        headers["X-Request-ID"] = req_id

    content = build_error_envelope(
        status_code=exc.status_code,
        detail=exc.detail,
    )
    return JSONResponse(status_code=exc.status_code, content=content, headers=headers)


async def validation_exception_handler(request: Request, exc: RequestValidationError) -> JSONResponse:
    """Handle request validation errors (Pydantic / 422) with standardized envelope."""
    req_id = request_id_ctx.get()
    headers = {"X-Request-ID": req_id} if req_id and req_id != "-" else {}

    errors = jsonable_encoder(exc.errors())
    content = build_error_envelope(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        detail=errors,
        message="Request validation failed",
        error_code="VALIDATION_ERROR",
        extra_details=errors,
    )
    return JSONResponse(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, content=content, headers=headers)


async def unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """Catch-all handler for unhandled exceptions (500) to prevent raw trace leakage."""
    req_id = request_id_ctx.get()
    logger.error(f"Unhandled exception on {request.method} {request.url.path}: {exc}", exc_info=True)

    headers = {"X-Request-ID": req_id} if req_id and req_id != "-" else {}
    content = build_error_envelope(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        detail="Internal Server Error",
        message="An unexpected internal server error occurred",
        error_code="INTERNAL_SERVER_ERROR",
    )
    return JSONResponse(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, content=content, headers=headers)


def register_error_handlers(app: FastAPI) -> None:
    """Register all centralized error handlers on the FastAPI application."""
    app.add_exception_handler(StarletteHTTPException, http_exception_handler)
    app.add_exception_handler(RequestValidationError, validation_exception_handler)
    app.add_exception_handler(Exception, unhandled_exception_handler)
