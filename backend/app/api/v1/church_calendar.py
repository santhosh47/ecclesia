"""Church activities, services, and gatherings calendar endpoints."""

from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.models.church_activity import ChurchActivity
from app.schemas.church_activity import (
    ChurchActivityCreate,
    ChurchActivityRead,
    ChurchActivityUpdate,
)

router = APIRouter(prefix="/church-calendar", tags=["church-calendar"])


@router.get("/activities", response_model=list[ChurchActivityRead])
def list_church_activities(
    category: str | None = None,
    activity_type: str | None = None,
    is_active: bool | None = True,
    limit: int = Query(default=100, ge=1, le=500),
    db: Session = Depends(get_db),
) -> list[ChurchActivity]:
    """List church activities and scheduled gatherings."""
    query = select(ChurchActivity).order_by(ChurchActivity.starts_at.asc())

    if category:
        query = query.where(ChurchActivity.category == category)
    if activity_type:
        query = query.where(ChurchActivity.activity_type == activity_type)
    if is_active is not None:
        query = query.where(ChurchActivity.is_active == is_active)

    return list(db.scalars(query.limit(limit)))


@router.post("/activities", response_model=ChurchActivityRead, status_code=status.HTTP_201_CREATED)
def create_church_activity(payload: ChurchActivityCreate, db: Session = Depends(get_db)) -> ChurchActivity:
    """Create a new church activity or service gathering."""
    activity = ChurchActivity(**payload.model_dump())
    db.add(activity)
    db.commit()
    db.refresh(activity)
    return activity


@router.get("/activities/{activity_id}", response_model=ChurchActivityRead)
def get_church_activity(activity_id: int, db: Session = Depends(get_db)) -> ChurchActivity:
    """Retrieve specific church activity by ID."""
    activity = db.get(ChurchActivity, activity_id)
    if not activity:
        raise HTTPException(status_code=404, detail="Church activity not found")
    return activity


@router.patch("/activities/{activity_id}", response_model=ChurchActivityRead)
def update_church_activity(
    activity_id: int, payload: ChurchActivityUpdate, db: Session = Depends(get_db)
) -> ChurchActivity:
    """Update scheduled church activity."""
    activity = db.get(ChurchActivity, activity_id)
    if not activity:
        raise HTTPException(status_code=404, detail="Church activity not found")

    update_dict = payload.model_dump(exclude_unset=True)
    for key, value in update_dict.items():
        setattr(activity, key, value)

    db.commit()
    db.refresh(activity)
    return activity


@router.delete("/activities/{activity_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_church_activity(activity_id: int, db: Session = Depends(get_db)) -> None:
    """Delete a church activity."""
    activity = db.get(ChurchActivity, activity_id)
    if not activity:
        raise HTTPException(status_code=404, detail="Church activity not found")

    db.delete(activity)
    db.commit()
