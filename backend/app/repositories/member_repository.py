"""Member repository providing specialized database queries for Member entities."""

from datetime import date
from typing import Any
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session, joinedload

from app.models.attendance import AttendanceRecord
from app.models.finance import Contribution
from app.models.household import Household
from app.models.member import Member
from app.models.ministry import MemberMinistry
from app.models.pastoral import PastoralCareNote, PrayerRequest
from app.repositories.base import BaseRepository


class MemberRepository(BaseRepository[Member]):
    """Repository managing Member model queries, relations, filtering, and statistical aggregations."""

    def __init__(self, db: Session) -> None:
        super().__init__(Member, db)

    def get_with_relations(self, member_id: int) -> Member | None:
        """Fetch a single member with eager-loaded household and ministry memberships."""
        stmt = (
            select(Member)
            .options(
                joinedload(Member.household),
                joinedload(Member.ministry_memberships).joinedload(MemberMinistry.ministry),
            )
            .where(Member.id == member_id)
        )
        return self.db.scalar(stmt)

    def get_all_with_relations(self) -> list[Member]:
        """Fetch all members with eager-loaded relations."""
        stmt = (
            select(Member)
            .options(
                joinedload(Member.household),
                joinedload(Member.ministry_memberships).joinedload(MemberMinistry.ministry),
            )
        )
        return list(self.db.scalars(stmt).unique().all())

    def filter_and_sort(
        self,
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
        sort_order: str = "asc",
    ) -> list[Member]:
        """Filter and sort members based on multi-criteria domain queries."""
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

        # Server-side sorting
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
            query = query.order_by(Member.last_name.asc(), Member.first_name.asc())

        return list(self.db.scalars(query).unique().all())

    def get_ytd_contributions(self, member_id: int, year_start: date) -> float:
        """Calculate Year-To-Date financial giving sum for a member."""
        amount = self.db.scalar(
            select(func.coalesce(func.sum(Contribution.amount), 0.0))
            .where(Contribution.member_id == member_id, Contribution.date >= year_start)
        )
        return float(amount or 0.0)

    def get_attendance_records(self, member_id: int) -> list[AttendanceRecord]:
        """Fetch attendance history for a member in reverse chronological order."""
        stmt = (
            select(AttendanceRecord)
            .where(AttendanceRecord.member_id == member_id)
            .order_by(AttendanceRecord.check_in_time.desc())
        )
        return list(self.db.scalars(stmt).all())

    def get_pastoral_counts(self, member_id: int) -> tuple[int, int]:
        """Return total prayer requests and pastoral care notes count for a member."""
        pr_count = self.db.scalar(
            select(func.count(PrayerRequest.id)).where(PrayerRequest.member_id == member_id)
        ) or 0
        pn_count = self.db.scalar(
            select(func.count(PastoralCareNote.id)).where(PastoralCareNote.member_id == member_id)
        ) or 0
        return int(pr_count), int(pn_count)
