"""Top-level router for version 1 of the API."""

from fastapi import APIRouter

router = APIRouter()


@router.get("/health", tags=["system"])
def health_check() -> dict[str, str]:
    """Return a lightweight liveness response."""

    return {"status": "ok"}
