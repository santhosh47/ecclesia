"""Church activities, services, and gatherings calendar endpoints."""

import csv
import io
from datetime import date, datetime

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.models.church_activity import ChurchActivity
from app.models.event import Event
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
    """Create a new church activity or service gathering with optional attendance tracking."""
    activity_data = payload.model_dump()
    track_att = activity_data.get("track_attendance", False)

    linked_event = None
    if track_att:
        linked_event = Event(
            title=activity_data["title"],
            event_type=activity_data.get("category", "Worship Service"),
            starts_at=activity_data["starts_at"],
            ends_at=activity_data.get("ends_at"),
            location=activity_data.get("location"),
            description=activity_data.get("description"),
            headcount_adults=0,
            headcount_children=0,
            headcount_online=0,
        )
        db.add(linked_event)
        db.flush()
        activity_data["event_id"] = linked_event.id

    activity = ChurchActivity(**activity_data)
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
    """Update scheduled church activity and synchronize attendance event if linked."""
    activity = db.get(ChurchActivity, activity_id)
    if not activity:
        raise HTTPException(status_code=404, detail="Church activity not found")

    update_dict = payload.model_dump(exclude_unset=True)
    for key, value in update_dict.items():
        setattr(activity, key, value)

    # Sync with Event if attendance tracking is active
    if activity.track_attendance:
        if activity.event_id:
            event = db.get(Event, activity.event_id)
            if event:
                event.title = activity.title
                event.event_type = activity.category
                event.starts_at = activity.starts_at
                event.ends_at = activity.ends_at
                event.location = activity.location
                event.description = activity.description
        else:
            # Create new backing event
            new_event = Event(
                title=activity.title,
                event_type=activity.category,
                starts_at=activity.starts_at,
                ends_at=activity.ends_at,
                location=activity.location,
                description=activity.description,
                headcount_adults=0,
                headcount_children=0,
                headcount_online=0,
            )
            db.add(new_event)
            db.flush()
            activity.event_id = new_event.id

    db.commit()
    db.refresh(activity)
    return activity


@router.delete("/activities/{activity_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_church_activity(activity_id: int, db: Session = Depends(get_db)) -> None:
    """Delete a church activity."""
    activity = db.get(ChurchActivity, activity_id)
    if not activity:
        raise HTTPException(status_code=404, detail="Church activity not found")

    # If linked event exists, delete event (which cascades attendance records safely)
    if activity.event_id:
        linked_event = db.get(Event, activity.event_id)
        if linked_event:
            db.delete(linked_event)

    db.delete(activity)
    db.commit()


@router.get("/csv/export")
def export_church_activities_to_csv(
    category: str | None = None,
    activity_type: str | None = None,
    db: Session = Depends(get_db),
) -> Response:
    """Export church calendar activities to downloadable CSV."""
    query = select(ChurchActivity).order_by(ChurchActivity.starts_at.asc())
    if category and category != "All":
        query = query.where(ChurchActivity.category == category)
    if activity_type and activity_type != "All":
        query = query.where(ChurchActivity.activity_type == activity_type)

    activities = list(db.scalars(query))
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "ID",
        "Title",
        "Category",
        "Frequency",
        "Starts At",
        "Ends At",
        "Location",
        "Leader / Organizer",
        "Target Group",
        "Is Recurring",
        "Recurrence Pattern",
        "Track Attendance",
        "Linked Event ID",
        "Contact Phone",
        "Description",
    ])

    for act in activities:
        writer.writerow([
            act.id,
            act.title,
            act.category,
            act.activity_type,
            act.starts_at.strftime("%Y-%m-%d %H:%M") if act.starts_at else "",
            act.ends_at.strftime("%Y-%m-%d %H:%M") if act.ends_at else "",
            act.location or "",
            act.organizer_name or "",
            act.target_group or "",
            "Yes" if act.is_recurring else "No",
            act.recurrence_pattern or "",
            "Yes" if act.track_attendance else "No",
            act.event_id or "",
            act.contact_phone or "",
            act.description or "",
        ])

    csv_data = output.getvalue().encode("utf-8-sig")
    filename = f"church_activities_export_{date.today().strftime('%Y%m%d')}.csv"
    return Response(
        content=csv_data,
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
