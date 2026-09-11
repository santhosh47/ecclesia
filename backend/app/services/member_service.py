"""Member service containing business logic for member directory, milestones, and photo management."""

import os
import uuid
from datetime import date
from pathlib import Path
from typing import Any

from fastapi import HTTPException
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models.member import Member
from app.repositories.member_repository import MemberRepository
from app.schemas.member import MemberCreate, MemberDetail, MemberRead, MemberUpdate, MilestoneItem
from app.services.audit_service import AuditService

ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif", "image/jpg"}
MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024  # 5MB


class MemberService:
    """Service layer coordinating Member business workflows and repository calls."""

    def __init__(self, db: Session) -> None:
        self.db = db
        self.repo = MemberRepository(db)

    @staticmethod
    def get_avatars_dir() -> Path:
        """Resolve and ensure the avatars storage directory exists."""
        backend_dir = Path(__file__).resolve().parent.parent.parent
        avatars_dir = backend_dir / "uploads" / "avatars"
        avatars_dir.mkdir(parents=True, exist_ok=True)
        return avatars_dir

    def format_member_read(self, member: Member) -> MemberRead:
        """Convert a Member ORM model into a standardized MemberRead schema."""
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

    def get_member_or_404(self, member_id: int) -> Member:
        """Fetch member or raise HTTP 404."""
        member = self.repo.get(member_id)
        if member is None:
            raise HTTPException(status_code=404, detail="Member not found")
        return member

    def list_members(self, **filters: Any) -> list[MemberRead]:
        """Query and return formatted member listing."""
        members = self.repo.filter_and_sort(**filters)
        return [self.format_member_read(m) for m in members]

    def get_member_detail(self, member_id: int) -> MemberDetail:
        """Fetch full member profile with calculated metrics (YTD giving, attendance rate, counts)."""
        member = self.repo.get_with_relations(member_id)
        if member is None:
            raise HTTPException(status_code=404, detail="Member not found")

        base_read = self.format_member_read(member)
        year_start = date(date.today().year, 1, 1)

        ytd_contributions = self.repo.get_ytd_contributions(member_id, year_start)
        attendance_records = self.repo.get_attendance_records(member_id)

        present_count = sum(1 for r in attendance_records if r.status in ("Present", "Late"))
        total_records = len(attendance_records)
        attendance_rate = (present_count / total_records * 100) if total_records > 0 else 0.0
        last_attended = attendance_records[0].check_in_time.date() if attendance_records else None

        prayer_count, notes_count = self.repo.get_pastoral_counts(member_id)

        detail_data = base_read.model_dump()
        detail_data.update({
            "total_contributions_ytd": ytd_contributions,
            "attendance_rate_percent": round(attendance_rate, 1),
            "last_attended_date": last_attended,
            "prayer_requests_count": prayer_count,
            "pastoral_notes_count": notes_count,
        })
        return MemberDetail(**detail_data)

    def create_member(self, payload: MemberCreate) -> MemberRead:
        """Create a new member record with unique email validation."""
        member = Member(**payload.model_dump())
        self.db.add(member)
        try:
            self.repo.commit()
        except IntegrityError as error:
            self.repo.rollback()
            raise HTTPException(
                status_code=409,
                detail="A member with this email already exists",
            ) from error
        self.db.refresh(member)

        reloaded = self.repo.get_with_relations(member.id)
        result = self.format_member_read(reloaded or member)
        AuditService(self.db).record(
            action="CREATE",
            entity_type="Member",
            entity_id=str(member.id),
            details=f"Created member record for {member.first_name} {member.last_name} ({member.email or 'no email'})",
        )
        return result

    def update_member(self, member_id: int, payload: MemberUpdate) -> MemberRead:
        """Update existing member fields with conflict handling."""
        member = self.get_member_or_404(member_id)
        for field, value in payload.model_dump(exclude_unset=True).items():
            setattr(member, field, value)
        try:
            self.repo.commit()
        except IntegrityError as error:
            self.repo.rollback()
            raise HTTPException(
                status_code=409,
                detail="A member with this email already exists",
            ) from error
        self.db.refresh(member)

        reloaded = self.repo.get_with_relations(member.id)
        result = self.format_member_read(reloaded or member)
        AuditService(self.db).record(
            action="UPDATE",
            entity_type="Member",
            entity_id=str(member.id),
            details=f"Updated member record for {member.first_name} {member.last_name}",
        )
        return result

    def delete_member(self, member_id: int) -> None:
        """Remove member and delete physical avatar file if one exists."""
        member = self.get_member_or_404(member_id)
        member_name = f"{member.first_name} {member.last_name}"
        if member.avatar_url and member.avatar_url.startswith("/uploads/avatars/"):
            avatars_dir = self.get_avatars_dir()
            prev_filename = os.path.basename(member.avatar_url)
            prev_path = avatars_dir / prev_filename
            if prev_path.is_file():
                try:
                    prev_path.unlink()
                except Exception:
                    pass

        self.repo.delete(member)
        AuditService(self.db).record(
            action="DELETE",
            entity_type="Member",
            entity_id=str(member_id),
            details=f"Deleted member record for {member_name} (ID #{member_id})",
        )

    def calculate_upcoming_milestones(
        self,
        days: int = 30,
        milestone_type: str | None = None,
    ) -> list[MilestoneItem]:
        """Calculate birthdays, wedding, baptism, and membership milestones within N days."""
        today = date.today()
        members = self.repo.get_all()
        milestones: list[MilestoneItem] = []

        def check_milestone(m: Member, dt: date | None, label: str) -> None:
            if not dt:
                return
            if milestone_type and milestone_type != label:
                return

            try:
                this_year_event = date(today.year, dt.month, dt.day)
            except ValueError:
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
                milestones.append(
                    MilestoneItem(
                        member_id=m.id,
                        member_name=f"{m.first_name} {m.last_name}",
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

    def save_standalone_avatar(self, content: bytes, original_filename: str) -> str:
        """Persist a standalone uploaded avatar file and return its public static path."""
        if len(content) > MAX_FILE_SIZE_BYTES:
            raise HTTPException(status_code=400, detail="Image size exceeds maximum limit of 5MB")

        avatars_dir = self.get_avatars_dir()
        file_ext = os.path.splitext(original_filename or "")[1].lower() or ".jpg"
        filename = f"avatar_{uuid.uuid4().hex}{file_ext}"
        dest_path = avatars_dir / filename

        with open(dest_path, "wb") as f:
            f.write(content)

        return f"/uploads/avatars/{filename}"

    def update_member_avatar(self, member_id: int, content: bytes, original_filename: str) -> MemberRead:
        """Attach a new profile photo to a member, cleaning up any former local file."""
        if len(content) > MAX_FILE_SIZE_BYTES:
            raise HTTPException(status_code=400, detail="Image size exceeds maximum limit of 5MB")

        member = self.get_member_or_404(member_id)
        avatars_dir = self.get_avatars_dir()
        file_ext = os.path.splitext(original_filename or "")[1].lower() or ".jpg"
        filename = f"member_{member.id}_{uuid.uuid4().hex[:8]}{file_ext}"
        dest_path = avatars_dir / filename

        with open(dest_path, "wb") as f:
            f.write(content)

        if member.avatar_url and member.avatar_url.startswith("/uploads/avatars/"):
            prev_filename = os.path.basename(member.avatar_url)
            prev_path = avatars_dir / prev_filename
            if prev_path.is_file():
                try:
                    prev_path.unlink()
                except Exception:
                    pass

        member.avatar_url = f"/uploads/avatars/{filename}"
        self.repo.commit()
        self.db.refresh(member)
        return self.format_member_read(member)

    def remove_member_avatar(self, member_id: int) -> MemberRead:
        """Remove member avatar image and revert to initials."""
        member = self.get_member_or_404(member_id)
        if member.avatar_url and member.avatar_url.startswith("/uploads/avatars/"):
            avatars_dir = self.get_avatars_dir()
            prev_filename = os.path.basename(member.avatar_url)
            prev_path = avatars_dir / prev_filename
            if prev_path.is_file():
                try:
                    prev_path.unlink()
                except Exception:
                    pass

        member.avatar_url = None
        self.repo.commit()
        self.db.refresh(member)
        return self.format_member_read(member)
