"""Member directory and milestone tracking endpoints."""

from datetime import date, datetime, timedelta
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, or_, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, joinedload

from app.database.session import get_db
from app.models.attendance import AttendanceRecord
from app.models.finance import Contribution
from app.models.household import Household
from app.models.member import Member
from app.models.ministry import MemberMinistry, Ministry
from app.models.pastoral import PastoralCareNote, PrayerRequest
from app.schemas.member import MemberCreate, MemberDetail, MemberRead, MemberUpdate, MilestoneItem

router = APIRouter(prefix="/members", tags=["members"])


def get_member_or_404(member_id: int, db: Session) -> Member:
    member = db.get(Member, member_id)
    if member is None:
        raise HTTPException(status_code=404, detail="Member not found")
    return member


def _format_member_read(member: Member) -> MemberRead:
    household_name = member.household.name if member.household else None
    ministries = [mm.ministry.name for mm in member.ministry_memberships if mm.ministry]
    
    data = {
        "id": member.id,
        "first_name": member.first_name,
        "middle_name": member.middle_name,
        "last_name": member.last_name,
        "title": member.title,
        "email": member.email,
        "phone": member.phone,
        "alternate_phone": member.alternate_phone,
        "address": member.address,
        "city": member.city,
        "state": member.state,
        "postal_code": member.postal_code,
        "gender": member.gender,
        "marital_status": member.marital_status,
        "occupation": member.occupation,
        "avatar_url": member.avatar_url,
        "status": member.status,
        "member_type": member.member_type,
        "date_of_birth": member.date_of_birth,
        "wedding_anniversary": member.wedding_anniversary,
        "baptism_date": member.baptism_date,
        "baptism_location": member.baptism_location,
        "confirmation_date": member.confirmation_date,
        "joined_date": member.joined_date,
        "first_visit_date": member.first_visit_date,
        "household_id": member.household_id,
        "household_role": member.household_role,
        "notes": member.notes,
        "created_at": member.created_at,
        "updated_at": member.updated_at,
        "household_name": household_name,
        "ministries": ministries,
    }
    return MemberRead(**data)


@router.get("", response_model=list[MemberRead])
def list_members(
    search: str | None = None,
    status: str | None = None,
    member_type: str | None = None,
    gender: str | None = None,
    household_id: int | None = None,
    ministry_id: int | None = None,
    db: Session = Depends(get_db),
) -> list[MemberRead]:
    query = (
        select(Member)
        .options(
            joinedload(Member.household),
            joinedload(Member.ministry_memberships).joinedload(MemberMinistry.ministry),
        )
        .order_by(Member.last_name, Member.first_name)
    )

    if search:
        search_term = f"%{search.strip()}%"
        query = query.where(
            or_(
                Member.first_name.ilike(search_term),
                Member.last_name.ilike(search_term),
                Member.email.ilike(search_term),
                Member.phone.ilike(search_term),
                Member.city.ilike(search_term),
            )
        )

    if status:
        query = query.where(Member.status == status)

    if member_type:
        query = query.where(Member.member_type == member_type)

    if gender:
        query = query.where(Member.gender == gender)

    if household_id is not None:
        query = query.where(Member.household_id == household_id)

    if ministry_id is not None:
        query = query.join(Member.ministry_memberships).where(MemberMinistry.ministry_id == ministry_id)

    members = list(db.scalars(query).unique())
    return [_format_member_read(m) for m in members]


@router.get("/milestones/upcoming", response_model=list[MilestoneItem])
def get_upcoming_milestones(
    days: int = Query(default=30, ge=1, le=365),
    milestone_type: str | None = None,  # "Birthday", "Wedding Anniversary", "Baptism Anniversary", "Membership Anniversary"
    db: Session = Depends(get_db),
) -> list[MilestoneItem]:
    """Calculate all upcoming birthdays, anniversaries, and spiritual milestones within the next N days."""
    today = date.today()
    members = list(db.scalars(select(Member)))
    milestones: list[MilestoneItem] = []

    def check_milestone(
        m: Member,
        dt: date | None,
        label: str,
    ) -> None:
        if not dt:
            return
        if milestone_type and milestone_type != label:
            return

        # Determine next occurrence this year or next year
        this_year_event = date(today.year, dt.month, dt.day)
        if this_year_event < today:
            next_event = date(today.year + 1, dt.month, dt.day)
        else:
            next_event = this_year_event

        days_until = (next_event - today).days
        if 0 <= days_until <= days:
            years = next_event.year - dt.year
            full_name = f"{m.first_name} {m.last_name}"
            milestones.append(
                MilestoneItem(
                    member_id=m.id,
                    member_name=full_name,
                    member_avatar=m.avatar_url,
                    milestone_type=label,
                    event_date=next_event,
                    days_until=days_until,
                    years=years if years > 0 else None,
                    phone=m.phone,
                    email=m.email,
                )
            )

    for member in members:
        # 1. Birthday
        check_milestone(member, member.date_of_birth, "Birthday")
        # 2. Wedding Anniversary
        check_milestone(member, member.wedding_anniversary, "Wedding Anniversary")
        # 3. Baptism Anniversary
        check_milestone(member, member.baptism_date, "Baptism Anniversary")
        # 4. Membership Anniversary
        check_milestone(member, member.joined_date, "Membership Anniversary")

    # Sort by days until the milestone
    milestones.sort(key=lambda item: item.days_until)
    return milestones


@router.post("", response_model=MemberRead, status_code=status.HTTP_201_CREATED)
def create_member(payload: MemberCreate, db: Session = Depends(get_db)) -> MemberRead:
    member_data = payload.model_dump()
    member = Member(**member_data)
    db.add(member)
    try:
        db.commit()
    except IntegrityError as error:
        db.rollback()
        raise HTTPException(status_code=409, detail="A member with this email already exists") from error
    db.refresh(member)
    
    # Reload with relations
    reloaded = db.scalar(
        select(Member)
        .options(
            joinedload(Member.household),
            joinedload(Member.ministry_memberships).joinedload(MemberMinistry.ministry),
        )
        .where(Member.id == member.id)
    )
    return _format_member_read(reloaded or member)


@router.get("/{member_id}", response_model=MemberDetail)
def get_member(member_id: int, db: Session = Depends(get_db)) -> MemberDetail:
    member = db.scalar(
        select(Member)
        .options(
            joinedload(Member.household),
            joinedload(Member.ministry_memberships).joinedload(MemberMinistry.ministry),
        )
        .where(Member.id == member_id)
    )
    if member is None:
        raise HTTPException(status_code=404, detail="Member not found")

    base_read = _format_member_read(member)
    
    # Aggregate stats
    year_start = date(date.today().year, 1, 1)
    ytd_contributions = db.scalar(
        select(func.coalesce(func.sum(Contribution.amount), 0.0))
        .where(Contribution.member_id == member_id, Contribution.date >= year_start)
    ) or 0.0

    # Attendance calculations
    attendance_records = list(
        db.scalars(
            select(AttendanceRecord)
            .where(AttendanceRecord.member_id == member_id)
            .order_by(AttendanceRecord.check_in_time.desc())
        )
    )
    present_count = sum(1 for r in attendance_records if r.status in ("Present", "Late"))
    total_records = len(attendance_records)
    attendance_rate = (present_count / total_records * 100) if total_records > 0 else 0.0
    last_attended = attendance_records[0].check_in_time.date() if attendance_records else None

    # Counts
    prayer_count = db.scalar(select(func.count(PrayerRequest.id)).where(PrayerRequest.member_id == member_id)) or 0
    notes_count = db.scalar(select(func.count(PastoralCareNote.id)).where(PastoralCareNote.member_id == member_id)) or 0

    detail_data = base_read.model_dump()
    detail_data.update({
        "total_contributions_ytd": float(ytd_contributions),
        "attendance_rate_percent": round(attendance_rate, 1),
        "last_attended_date": last_attended,
        "prayer_requests_count": prayer_count,
        "pastoral_notes_count": notes_count,
    })
    return MemberDetail(**detail_data)


@router.patch("/{member_id}", response_model=MemberRead)
def update_member(member_id: int, payload: MemberUpdate, db: Session = Depends(get_db)) -> MemberRead:
    member = get_member_or_404(member_id, db)
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(member, field, value)
    try:
        db.commit()
    except IntegrityError as error:
        db.rollback()
        raise HTTPException(status_code=409, detail="A member with this email already exists") from error
    db.refresh(member)
    
    reloaded = db.scalar(
        select(Member)
        .options(
            joinedload(Member.household),
            joinedload(Member.ministry_memberships).joinedload(MemberMinistry.ministry),
        )
        .where(Member.id == member.id)
    )
    return _format_member_read(reloaded or member)


@router.delete("/{member_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_member(member_id: int, db: Session = Depends(get_db)) -> None:
    member = get_member_or_404(member_id, db)
    db.delete(member)
    db.commit()
