"""Church event endpoints."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session, joinedload

from app.database.session import get_db
from app.models.attendance import AttendanceRecord
from app.models.event import Event
from app.schemas.event import EventCreate, EventRead, EventUpdate

router = APIRouter(prefix="/events", tags=["events"])


def get_event_or_404(event_id: int, db: Session) -> Event:
    event = db.scalar(
        select(Event)
        .options(joinedload(Event.attendance_records))
        .where(Event.id == event_id)
    )
    if event is None:
        raise HTTPException(status_code=404, detail="Event not found")
    return event


def _format_event_read(e: Event) -> EventRead:
    roster_count = len([r for r in e.attendance_records if r.status in ("Present", "Late")])
    physical_headcount = (e.headcount_adults or 0) + (e.headcount_children or 0)
    # Total attendance definition: max of physical headcount and roster check-in count + online
    physical_total = max(physical_headcount, roster_count)
    total_attendance = physical_total + (e.headcount_online or 0)
    return EventRead(
        id=e.id,
        title=e.title,
        event_type=e.event_type,
        starts_at=e.starts_at,
        ends_at=e.ends_at,
        location=e.location,
        description=e.description,
        headcount_adults=e.headcount_adults or 0,
        headcount_children=e.headcount_children or 0,
        headcount_online=e.headcount_online or 0,
        is_completed=e.is_completed,
        created_at=e.created_at,
        total_headcount=total_attendance,
        roster_checked_in_count=roster_count,
    )


@router.get("", response_model=list[EventRead])
def list_events(
    event_type: str | None = None,
    is_completed: bool | None = None,
    db: Session = Depends(get_db),
) -> list[EventRead]:
    query = select(Event).options(joinedload(Event.attendance_records)).order_by(Event.starts_at.desc())

    if event_type:
        query = query.where(Event.event_type == event_type)
    if is_completed is not None:
        query = query.where(Event.is_completed == is_completed)

    events = list(db.scalars(query).unique())
    return [_format_event_read(e) for e in events]


@router.post("", response_model=EventRead, status_code=status.HTTP_201_CREATED)
def create_event(payload: EventCreate, db: Session = Depends(get_db)) -> EventRead:
    event = Event(**payload.model_dump())
    db.add(event)
    db.commit()
    db.refresh(event)
    return _format_event_read(event)


@router.get("/{event_id}", response_model=EventRead)
def get_event(event_id: int, db: Session = Depends(get_db)) -> EventRead:
    return _format_event_read(get_event_or_404(event_id, db))


@router.patch("/{event_id}", response_model=EventRead)
def update_event(event_id: int, payload: EventUpdate, db: Session = Depends(get_db)) -> EventRead:
    event = get_event_or_404(event_id, db)
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(event, field, value)
    db.commit()
    db.refresh(event)
    return _format_event_read(event)


@router.delete("/{event_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_event(event_id: int, db: Session = Depends(get_db)) -> None:
    event = get_event_or_404(event_id, db)
    db.delete(event)
    db.commit()
