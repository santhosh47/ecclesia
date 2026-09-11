"""Pastoral care, prayer requests, and visitor follow-up pipeline endpoints."""

from datetime import date, datetime

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from app.database.session import get_db
from app.models.member import Member
from app.models.notifications import InAppNotification
from app.models.pastoral import PastoralCareNote, PrayerRequest, VisitorFollowUp
from app.schemas.pastoral import (
    AnswerPrayerPayload,
    AnsweredPrayerStats,
    PastoralCareNoteCreate,
    PastoralCareNoteRead,
    PrayerRequestCreate,
    PrayerRequestRead,
    PrayerRequestUpdate,
    VisitorFollowUpCreate,
    VisitorFollowUpRead,
    VisitorFollowUpUpdate,
)

router = APIRouter(prefix="/pastoral", tags=["pastoral"])


# --- Pastoral Care Notes ---
@router.get("/notes", response_model=list[PastoralCareNoteRead])
def list_pastoral_notes(
    member_id: int | None = None,
    category: str | None = None,
    db: Session = Depends(get_db),
) -> list[PastoralCareNoteRead]:
    query = (
        select(PastoralCareNote)
        .options(joinedload(PastoralCareNote.member))
        .order_by(PastoralCareNote.date.desc(), PastoralCareNote.id.desc())
    )
    if member_id is not None:
        query = query.where(PastoralCareNote.member_id == member_id)
    if category:
        query = query.where(PastoralCareNote.category == category)

    notes = list(db.scalars(query).unique())
    results: list[PastoralCareNoteRead] = []
    for n in notes:
        member_name = f"{n.member.first_name} {n.member.last_name}" if n.member else None
        results.append(
            PastoralCareNoteRead(
                id=n.id,
                member_id=n.member_id,
                author_name=n.author_name,
                category=n.category,
                content=n.content,
                date=n.date,
                is_confidential=n.is_confidential,
                follow_up_needed=n.follow_up_needed,
                created_at=n.created_at,
                member_name=member_name,
            )
        )
    return results


@router.post("/notes", response_model=PastoralCareNoteRead, status_code=status.HTTP_201_CREATED)
def create_pastoral_note(payload: PastoralCareNoteCreate, db: Session = Depends(get_db)) -> PastoralCareNoteRead:
    member = db.get(Member, payload.member_id)
    if not member:
        raise HTTPException(status_code=404, detail="Member not found")

    note = PastoralCareNote(**payload.model_dump())
    db.add(note)
    db.commit()
    db.refresh(note)

    return PastoralCareNoteRead(
        id=note.id,
        member_id=note.member_id,
        author_name=note.author_name,
        category=note.category,
        content=note.content,
        date=note.date,
        is_confidential=note.is_confidential,
        follow_up_needed=note.follow_up_needed,
        created_at=note.created_at,
        member_name=f"{member.first_name} {member.last_name}",
    )


@router.delete("/notes/{note_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_pastoral_note(note_id: int, db: Session = Depends(get_db)) -> None:
    note = db.get(PastoralCareNote, note_id)
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    db.delete(note)
    db.commit()


# --- Prayer Requests ---
@router.get("/prayers", response_model=list[PrayerRequestRead])
def list_prayer_requests(
    status: str | None = None,
    category: str | None = None,
    member_id: int | None = None,
    db: Session = Depends(get_db),
) -> list[PrayerRequestRead]:
    query = select(PrayerRequest).order_by(PrayerRequest.date_requested.desc(), PrayerRequest.id.desc())

    if status:
        query = query.where(PrayerRequest.status == status)
    if category:
        query = query.where(PrayerRequest.category == category)
    if member_id is not None:
        query = query.where(PrayerRequest.member_id == member_id)

    prayers = list(db.scalars(query))
    return [PrayerRequestRead.model_validate(p) for p in prayers]


@router.post("/prayers", response_model=PrayerRequestRead, status_code=status.HTTP_201_CREATED)
def create_prayer_request(payload: PrayerRequestCreate, db: Session = Depends(get_db)) -> PrayerRequestRead:
    prayer = PrayerRequest(**payload.model_dump())
    db.add(prayer)
    db.commit()
    db.refresh(prayer)
    return PrayerRequestRead.model_validate(prayer)


@router.get("/prayers/answered", response_model=list[PrayerRequestRead], summary="List Answered Prayers & Testimonies")
def list_answered_prayers(
    category: str | None = None,
    search: str | None = None,
    public_only: bool = False,
    db: Session = Depends(get_db),
) -> list[PrayerRequestRead]:
    """Retrieve all answered prayers and praise reports for the testimony wall."""
    query = (
        select(PrayerRequest)
        .where(PrayerRequest.status == "Answered")
        .order_by(PrayerRequest.date_answered.desc().nullslast(), PrayerRequest.id.desc())
    )
    if public_only:
        query = query.where(PrayerRequest.is_confidential.is_(False))
    if category:
        query = query.where(PrayerRequest.category == category)
    if search:
        search_fmt = f"%{search.strip()}%"
        query = query.where(
            (PrayerRequest.title.ilike(search_fmt))
            | (PrayerRequest.details.ilike(search_fmt))
            | (PrayerRequest.answer_notes.ilike(search_fmt))
            | (PrayerRequest.requester_name.ilike(search_fmt))
        )

    prayers = list(db.scalars(query))
    return [PrayerRequestRead.model_validate(p) for p in prayers]


@router.get("/prayers/stats", response_model=AnsweredPrayerStats, summary="Prayer Request and Answer Statistics")
def get_prayer_stats(db: Session = Depends(get_db)) -> AnsweredPrayerStats:
    """Retrieve prayer aggregate metrics, answered prayer count, and praise reports."""
    all_prayers = list(db.scalars(select(PrayerRequest)))
    total_prayers = len(all_prayers)
    answered = [p for p in all_prayers if p.status == "Answered"]
    active = [p for p in all_prayers if p.status == "Active"]
    archived = [p for p in all_prayers if p.status == "Archived"]

    answered_count = len(answered)
    active_count = len(active)
    archived_count = len(archived)

    resolved = answered_count + archived_count
    answer_rate = round((answered_count / resolved * 100), 1) if resolved > 0 else (100.0 if answered_count > 0 else 0.0)

    # Average days to answer
    days_list = []
    for p in answered:
        if p.date_answered and p.date_requested:
            diff = (p.date_answered - p.date_requested).days
            if diff >= 0:
                days_list.append(diff)

    avg_days = round(sum(days_list) / len(days_list), 1) if days_list else None

    # By category for answered
    by_category: dict[str, int] = {}
    for p in answered:
        cat = p.category or "Other"
        by_category[cat] = by_category.get(cat, 0) + 1

    # Recent answered testimonies
    recent_answered = sorted(
        answered,
        key=lambda x: (x.date_answered or date.min, x.id),
        reverse=True,
    )[:5]

    return AnsweredPrayerStats(
        total_prayers=total_prayers,
        answered_count=answered_count,
        active_count=active_count,
        archived_count=archived_count,
        answer_rate_percent=answer_rate,
        average_days_to_answer=avg_days,
        by_category=by_category,
        recent_testimonies=[PrayerRequestRead.model_validate(p) for p in recent_answered],
    )


@router.post("/prayers/{prayer_id}/answer", response_model=PrayerRequestRead, summary="Record Answered Prayer & Praise Report")
def answer_prayer_request(
    prayer_id: int,
    payload: AnswerPrayerPayload,
    db: Session = Depends(get_db),
) -> PrayerRequestRead:
    """Record an answered prayer, testimonial notes, and trigger celebration notifications."""
    prayer = db.get(PrayerRequest, prayer_id)
    if not prayer:
        raise HTTPException(status_code=404, detail="Prayer request not found")

    prayer.status = "Answered"
    prayer.answer_notes = payload.answer_notes
    prayer.date_answered = payload.date_answered or date.today()
    if payload.is_confidential is not None:
        prayer.is_confidential = payload.is_confidential

    # Create an in-app celebration notice for pastoral team
    celebration_note = InAppNotification(
        title=f"Praise Report: Prayer Answered for {prayer.requester_name}",
        message=f"'{prayer.title}': {payload.answer_notes[:180]}...",
        notification_type="answered_prayer",
        target_role="pastor",
        channels_dispatched="in_app",
        action_url="/pastoral?tab=answered",
    )
    db.add(celebration_note)

    db.commit()
    db.refresh(prayer)
    return PrayerRequestRead.model_validate(prayer)


@router.patch("/prayers/{prayer_id}", response_model=PrayerRequestRead)
def update_prayer_request(
    prayer_id: int,
    payload: PrayerRequestUpdate,
    db: Session = Depends(get_db),
) -> PrayerRequestRead:
    prayer = db.get(PrayerRequest, prayer_id)
    if not prayer:
        raise HTTPException(status_code=404, detail="Prayer request not found")

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(prayer, field, value)

    # If marked as Answered without date, set today
    if prayer.status == "Answered" and not prayer.date_answered:
        prayer.date_answered = date.today()

    db.commit()
    db.refresh(prayer)
    return PrayerRequestRead.model_validate(prayer)


@router.delete("/prayers/{prayer_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_prayer_request(prayer_id: int, db: Session = Depends(get_db)) -> None:
    prayer = db.get(PrayerRequest, prayer_id)
    if not prayer:
        raise HTTPException(status_code=404, detail="Prayer request not found")
    db.delete(prayer)
    db.commit()


# --- Visitor Follow-Ups ---
@router.get("/visitors", response_model=list[VisitorFollowUpRead])
def list_visitor_follow_ups(
    status: str | None = None,
    db: Session = Depends(get_db),
) -> list[VisitorFollowUpRead]:
    query = select(VisitorFollowUp).order_by(VisitorFollowUp.visit_date.desc(), VisitorFollowUp.id.desc())
    if status:
        query = query.where(VisitorFollowUp.status == status)
    visitors = list(db.scalars(query))
    return [VisitorFollowUpRead.model_validate(v) for v in visitors]


@router.post("/visitors", response_model=VisitorFollowUpRead, status_code=status.HTTP_201_CREATED)
def create_visitor_follow_up(payload: VisitorFollowUpCreate, db: Session = Depends(get_db)) -> VisitorFollowUpRead:
    visitor = VisitorFollowUp(**payload.model_dump())
    db.add(visitor)
    db.commit()
    db.refresh(visitor)
    return VisitorFollowUpRead.model_validate(visitor)


@router.patch("/visitors/{visitor_id}", response_model=VisitorFollowUpRead)
def update_visitor_follow_up(
    visitor_id: int,
    payload: VisitorFollowUpUpdate,
    db: Session = Depends(get_db),
) -> VisitorFollowUpRead:
    visitor = db.get(VisitorFollowUp, visitor_id)
    if not visitor:
        raise HTTPException(status_code=404, detail="Visitor follow up not found")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(visitor, field, value)
    db.commit()
    db.refresh(visitor)
    return VisitorFollowUpRead.model_validate(visitor)


@router.delete("/visitors/{visitor_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_visitor_follow_up(visitor_id: int, db: Session = Depends(get_db)) -> None:
    visitor = db.get(VisitorFollowUp, visitor_id)
    if not visitor:
        raise HTTPException(status_code=404, detail="Visitor follow up not found")
    db.delete(visitor)
    db.commit()
