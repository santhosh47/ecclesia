"""System health check router validating service liveness and database connectivity."""

from fastapi import APIRouter, Depends, status
from fastapi.responses import JSONResponse
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.core.logging import get_logger
from app.database.session import get_db

logger = get_logger("health")

router = APIRouter(prefix="/health", tags=["system"])


@router.get("", status_code=status.HTTP_200_OK)
def health_check(db: Session = Depends(get_db)):
    """Health check endpoint validating application liveness and database connectivity."""
    try:
        db.execute(text("SELECT 1"))
        return {
            "status": "ok",
            "database": "connected",
            "version": "0.3.0",
        }
    except Exception as exc:
        logger.error(f"Database health probe failed: {exc}")
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content={
                "status": "degraded",
                "database": "disconnected",
                "error": str(exc),
            },
        )
