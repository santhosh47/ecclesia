"""System health check router."""

from fastapi import APIRouter

router = APIRouter(prefix="/health", tags=["system"])


@router.get("", status_code=200)
def health_check() -> dict[str, str]:
    """Health check ping endpoint."""
    return {"status": "ok"}
