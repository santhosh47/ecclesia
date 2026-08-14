"""Top-level router for version 1 of the API."""

from fastapi import APIRouter

from app.api.v1.events import router as events_router
from app.api.v1.members import router as members_router

router = APIRouter()
router.include_router(events_router)
router.include_router(members_router)


@router.get("/health", tags=["system"])
def health_check() -> dict[str, str]:
    """Return a lightweight liveness response."""

    return {"status": "ok"}
