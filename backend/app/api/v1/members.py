"""Member directory, photo management, and milestone tracking endpoints."""

import os
import shutil
import uuid
from datetime import date, datetime, timedelta
from pathlib import Path
from typing import Any

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile, status
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

ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif", "image/jpg"}
MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024  # 5MB


def _get_avatars_dir() -> Path:
    backend_dir = Path(__file__).resolve().parent.parent.parent
    avatars_dir = backend_dir / "uploads" / "avatars"
    avatars_dir.mkdir(parents=True, exist_ok=True)
    return avatars_dir


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
        "leadership_role": member.leadership_role,
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
        "pan_number": member.pan_number,
        "tax_id": member.tax_id,
        "gift_aid_eligible": member.gift_aid_eligible,
        "language_preference": member.language_preference,
        "gdpr_opt_out": member.gdpr_opt_out,
        "whatsapp_opt_in": member.whatsapp_opt_in,
        "emergency_contact_name": member.emergency_contact_name,
        "emergency_contact_phone": member.emergency_contact_phone,
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
    marital_status: str | None = None,
    leadership_role: str | None = None,
    household_id: int | None = None,
    ministry_id: int | None = None,
    baptism_location: str | None = None,
    has_baptism: bool | None = None,
    baptism_date_from: date | None = None,
    baptism_date_to: date | None = None,
    joined_date_from: date | None = None,
    joined_date_to: date | None = None,
    dob_from: date | None = None,
    dob_to: date | None = None,
    sort_by: str | None = None,
    sort_order: str = Query(default="asc", pattern="^(asc|desc)$"),
    db: Session = Depends(get_db),
) -> list[MemberRead]:
    """List members with comprehensive filtering and stable server-side sorting."""
    query = (
        select(Member)
        .outerjoin(Member.household)
        .options(
            joinedload(Member.household),
            joinedload(Member.ministry_memberships).joinedload(MemberMinistry.ministry),
        )
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
                Member.leadership_role.ilike(search_term),
                Household.name.ilike(search_term),
            )
        )

    if status and status != "ALL":
        query = query.where(Member.status == status)

    if member_type and member_type != "ALL":
        query = query.where(Member.member_type == member_type)

    if gender and gender != "ALL":
        query = query.where(Member.gender == gender)

    if marital_status and marital_status != "ALL":
        query = query.where(Member.marital_status == marital_status)

    if leadership_role and leadership_role != "ALL":
        if leadership_role == "LEADERS_ONLY":
            query = query.where(Member.leadership_role.is_not(None), Member.leadership_role != "")
        elif leadership_role == "GENERAL_ONLY":
            query = query.where(or_(Member.leadership_role.is_(None), Member.leadership_role == ""))
        else:
            query = query.where(Member.leadership_role == leadership_role)

    if household_id is not None:
        query = query.where(Member.household_id == household_id)

    if ministry_id is not None:
        query = query.join(Member.ministry_memberships).where(MemberMinistry.ministry_id == ministry_id)

    if baptism_location:
        query = query.where(Member.baptism_location.ilike(f"%{baptism_location.strip()}%"))

    if has_baptism is True:
        query = query.where(Member.baptism_date.is_not(None))
    elif has_baptism is False:
        query = query.where(Member.baptism_date.is_(None))

    if baptism_date_from:
        query = query.where(Member.baptism_date >= baptism_date_from)
    if baptism_date_to:
        query = query.where(Member.baptism_date <= baptism_date_to)

    if joined_date_from:
        query = query.where(Member.joined_date >= joined_date_from)
    if joined_date_to:
        query = query.where(Member.joined_date <= joined_date_to)

    if dob_from:
        query = query.where(Member.date_of_birth >= dob_from)
    if dob_to:
        query = query.where(Member.date_of_birth <= dob_to)

    # Sorting
    is_desc = sort_order.lower() == "desc"
    if sort_by == "name" or sort_by == "last_name":
        query = query.order_by(
            Member.last_name.desc() if is_desc else Member.last_name.asc(),
            Member.first_name.desc() if is_desc else Member.first_name.asc(),
        )
    elif sort_by == "first_name":
        query = query.order_by(
            Member.first_name.desc() if is_desc else Member.first_name.asc(),
            Member.last_name.desc() if is_desc else Member.last_name.asc(),
        )
    elif sort_by == "age" or sort_by == "date_of_birth":
        # For age ascending, younger -> later DOB; age descending, older -> earlier DOB
        query = query.order_by(
            Member.date_of_birth.asc().nulls_last() if is_desc else Member.date_of_birth.desc().nulls_last()
        )
    elif sort_by == "baptism_date":
        query = query.order_by(
            Member.baptism_date.desc().nulls_last() if is_desc else Member.baptism_date.asc().nulls_last()
        )
    elif sort_by == "baptism_location":
        query = query.order_by(
            Member.baptism_location.desc().nulls_last() if is_desc else Member.baptism_location.asc().nulls_last()
        )
    elif sort_by == "joined_date":
        query = query.order_by(
            Member.joined_date.desc().nulls_last() if is_desc else Member.joined_date.asc().nulls_last()
        )
    elif sort_by == "gender":
        query = query.order_by(Member.gender.desc() if is_desc else Member.gender.asc())
    elif sort_by == "status":
        query = query.order_by(Member.status.desc() if is_desc else Member.status.asc())
    elif sort_by == "member_type":
        query = query.order_by(Member.member_type.desc() if is_desc else Member.member_type.asc())
    elif sort_by == "leadership_role":
        query = query.order_by(
            Member.leadership_role.desc().nulls_last() if is_desc else Member.leadership_role.asc().nulls_last()
        )
    elif sort_by == "household_name":
        query = query.order_by(
            Household.name.desc().nulls_last() if is_desc else Household.name.asc().nulls_last()
        )
    elif sort_by == "created_at":
        query = query.order_by(Member.created_at.desc() if is_desc else Member.created_at.asc())
    else:
        # Default sort: Last Name, First Name
        query = query.order_by(Member.last_name.asc(), Member.first_name.asc())

    members = list(db.scalars(query).unique())
    return [_format_member_read(m) for m in members]


@router.post("/upload-avatar")
async def upload_standalone_avatar(file: UploadFile = File(...)) -> dict[str, str]:
    """Upload a member avatar image file before creation and return its public static URL."""
    if file.content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(
            status_code=400,
            detail="Invalid image file format. Supported formats: JPEG, PNG, WebP, GIF",
        )

    avatars_dir = _get_avatars_dir()
    file_ext = os.path.splitext(file.filename or "")[1].lower() or ".jpg"
    filename = f"avatar_{uuid.uuid4().hex}{file_ext}"
    dest_path = avatars_dir / filename

    content = await file.read()
    if len(content) > MAX_FILE_SIZE_BYTES:
        raise HTTPException(status_code=400, detail="Image size exceeds maximum limit of 5MB")

    with open(dest_path, "wb") as f:
        f.write(content)

    return {"avatar_url": f"/uploads/avatars/{filename}"}


@router.post("/{member_id}/avatar", response_model=MemberRead)
async def upload_member_avatar(
    member_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
) -> MemberRead:
    """Upload and update a member's profile avatar."""
    member = get_member_or_404(member_id, db)

    if file.content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(
            status_code=400,
            detail="Invalid image file format. Supported formats: JPEG, PNG, WebP, GIF",
        )

    content = await file.read()
    if len(content) > MAX_FILE_SIZE_BYTES:
        raise HTTPException(status_code=400, detail="Image size exceeds maximum limit of 5MB")

    avatars_dir = _get_avatars_dir()
    file_ext = os.path.splitext(file.filename or "")[1].lower() or ".jpg"
    filename = f"member_{member.id}_{uuid.uuid4().hex[:8]}{file_ext}"
    dest_path = avatars_dir / filename

    with open(dest_path, "wb") as f:
        f.write(content)

    # Delete previous local avatar file if it existed
    if member.avatar_url and member.avatar_url.startswith("/uploads/avatars/"):
        prev_filename = os.path.basename(member.avatar_url)
        prev_path = avatars_dir / prev_filename
        if prev_path.is_file():
            try:
                prev_path.unlink()
            except Exception:
                pass

    member.avatar_url = f"/uploads/avatars/{filename}"
    db.commit()
    db.refresh(member)
    return _format_member_read(member)


@router.delete("/{member_id}/avatar", response_model=MemberRead)
def remove_member_avatar(member_id: int, db: Session = Depends(get_db)) -> MemberRead:
    """Remove member profile photo and revert to initials."""
    member = get_member_or_404(member_id, db)
    if member.avatar_url and member.avatar_url.startswith("/uploads/avatars/"):
        avatars_dir = _get_avatars_dir()
        prev_filename = os.path.basename(member.avatar_url)
        prev_path = avatars_dir / prev_filename
        if prev_path.is_file():
            try:
                prev_path.unlink()
            except Exception:
                pass

    member.avatar_url = None
    db.commit()
    db.refresh(member)
    return _format_member_read(member)


@router.get("/milestones/upcoming", response_model=list[MilestoneItem])
def get_upcoming_milestones(
    days: int = Query(default=30, ge=1, le=365),
    milestone_type: str | None = None,
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

        try:
            this_year_event = date(today.year, dt.month, dt.day)
        except ValueError:
            # Handle Feb 29 leap year cases
            this_year_event = date(today.year, dt.month, dt.day - 1)

        if this_year_event < today:
            try:
                next_event = date(today.year + 1, dt.month, dt.day)
            except ValueError:
                next_event = date(today.year + 1, dt.month, dt.day - 1)
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
        check_milestone(member, member.date_of_birth, "Birthday")
        check_milestone(member, member.wedding_anniversary, "Wedding Anniversary")
        check_milestone(member, member.baptism_date, "Baptism Anniversary")
        check_milestone(member, member.joined_date, "Membership Anniversary")

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
    
    year_start = date(date.today().year, 1, 1)
    ytd_contributions = db.scalar(
        select(func.coalesce(func.sum(Contribution.amount), 0.0))
        .where(Contribution.member_id == member_id, Contribution.date >= year_start)
    ) or 0.0

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
    if member.avatar_url and member.avatar_url.startswith("/uploads/avatars/"):
        avatars_dir = _get_avatars_dir()
        prev_filename = os.path.basename(member.avatar_url)
        prev_path = avatars_dir / prev_filename
        if prev_path.is_file():
            try:
                prev_path.unlink()
            except Exception:
                pass

    db.delete(member)
    db.commit()
