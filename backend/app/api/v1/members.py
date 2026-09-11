"""Member directory, photo management, and milestone tracking API endpoints."""

from datetime import date

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile, status
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.models.member import Member
from app.schemas.member import MemberCreate, MemberDetail, MemberRead, MemberUpdate, MilestoneItem
from app.services.member_service import ALLOWED_IMAGE_TYPES, MemberService

router = APIRouter(prefix="/members", tags=["members"])


def get_member_service(db: Session = Depends(get_db)) -> MemberService:
    """Dependency provider for MemberService."""
    return MemberService(db)


def get_member_or_404(member_id: int, db: Session) -> Member:
    """Convenience helper preserving backwards compatibility."""
    return MemberService(db).get_member_or_404(member_id)


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
    service: MemberService = Depends(get_member_service),
) -> list[MemberRead]:
    """List members with comprehensive filtering and stable server-side sorting."""
    return service.list_members(
        search=search,
        status=status,
        member_type=member_type,
        gender=gender,
        marital_status=marital_status,
        leadership_role=leadership_role,
        household_id=household_id,
        ministry_id=ministry_id,
        baptism_location=baptism_location,
        has_baptism=has_baptism,
        baptism_date_from=baptism_date_from,
        baptism_date_to=baptism_date_to,
        joined_date_from=joined_date_from,
        joined_date_to=joined_date_to,
        dob_from=dob_from,
        dob_to=dob_to,
        sort_by=sort_by,
        sort_order=sort_order,
    )


@router.post("/upload-avatar")
async def upload_standalone_avatar(
    file: UploadFile = File(...),
    service: MemberService = Depends(get_member_service),
) -> dict[str, str]:
    """Upload a member avatar image file before creation and return its public static URL."""
    if file.content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(
            status_code=400,
            detail="Invalid image file format. Supported formats: JPEG, PNG, WebP, GIF",
        )

    content = await file.read()
    avatar_url = service.save_standalone_avatar(content, file.filename or "")
    return {"avatar_url": avatar_url}


@router.post("/{member_id}/avatar", response_model=MemberRead)
async def upload_member_avatar(
    member_id: int,
    file: UploadFile = File(...),
    service: MemberService = Depends(get_member_service),
) -> MemberRead:
    """Upload and update a member's profile avatar."""
    if file.content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(
            status_code=400,
            detail="Invalid image file format. Supported formats: JPEG, PNG, WebP, GIF",
        )

    content = await file.read()
    return service.update_member_avatar(member_id, content, file.filename or "")


@router.delete("/{member_id}/avatar", response_model=MemberRead)
def remove_member_avatar(
    member_id: int,
    service: MemberService = Depends(get_member_service),
) -> MemberRead:
    """Remove member profile photo and revert to initials."""
    return service.remove_member_avatar(member_id)


@router.get("/milestones/upcoming", response_model=list[MilestoneItem])
def get_upcoming_milestones(
    days: int = Query(default=30, ge=1, le=365),
    milestone_type: str | None = None,
    db: Session = Depends(get_db),
) -> list[MilestoneItem]:
    """Calculate all upcoming birthdays, anniversaries, and spiritual milestones within the next N days."""
    service = MemberService(db)
    return service.calculate_upcoming_milestones(days=days, milestone_type=milestone_type)


@router.post("", response_model=MemberRead, status_code=status.HTTP_201_CREATED)
def create_member(
    payload: MemberCreate,
    service: MemberService = Depends(get_member_service),
) -> MemberRead:
    """Create a new member record with duplicate email detection."""
    return service.create_member(payload)


@router.get("/{member_id}", response_model=MemberDetail)
def get_member(
    member_id: int,
    service: MemberService = Depends(get_member_service),
) -> MemberDetail:
    """Retrieve full profile details and analytical metrics for a single member."""
    return service.get_member_detail(member_id)


@router.patch("/{member_id}", response_model=MemberRead)
def update_member(
    member_id: int,
    payload: MemberUpdate,
    service: MemberService = Depends(get_member_service),
) -> MemberRead:
    """Update profile fields for an existing member."""
    return service.update_member(member_id, payload)


@router.delete("/{member_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_member(
    member_id: int,
    service: MemberService = Depends(get_member_service),
) -> None:
    """Delete a member record from the directory."""
    service.delete_member(member_id)
