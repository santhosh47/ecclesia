"""Pastoral care, prayer requests, and visitor follow-up models."""

from datetime import date, datetime
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, Date, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base

if TYPE_CHECKING:
    from app.models.member import Member


class PastoralCareNote(Base):
    """Log of a pastoral interaction, visit, counseling session, or member care need."""

    __tablename__ = "pastoral_care_notes"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    member_id: Mapped[int] = mapped_column(Integer, ForeignKey("members.id", ondelete="CASCADE"), nullable=False)
    author_name: Mapped[str] = mapped_column(String(100), nullable=False)  # Pastor John, Elder Mary, etc.
    category: Mapped[str] = mapped_column(String(50), default="General Care")  # Pastoral Visit, Hospital, Counseling, Crisis, Bereavement, General Care
    content: Mapped[str] = mapped_column(Text, nullable=False)
    date: Mapped[date] = mapped_column(Date, default=date.today)
    is_confidential: Mapped[bool] = mapped_column(Boolean, default=False)
    follow_up_needed: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    # Relationships
    member: Mapped["Member"] = relationship("Member", back_populates="pastoral_notes")


class PrayerRequest(Base):
    """A member or visitor prayer request with praise report / answered status."""

    __tablename__ = "prayer_requests"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    member_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("members.id", ondelete="SET NULL"), nullable=True)
    requester_name: Mapped[str] = mapped_column(String(150), nullable=False)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    details: Mapped[str] = mapped_column(Text, nullable=False)
    category: Mapped[str] = mapped_column(String(50), default="Healing")  # Healing, Family, Guidance, Provision, Salvation, Thanksgiving
    status: Mapped[str] = mapped_column(String(30), default="Active")  # Active, Answered, Archived
    date_requested: Mapped[date] = mapped_column(Date, default=date.today)
    date_answered: Mapped[date | None] = mapped_column(Date, nullable=True)
    answer_notes: Mapped[str | None] = mapped_column(Text, nullable=True)  # Testimony / praise report
    is_confidential: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    # Relationships
    member: Mapped["Member | None"] = relationship("Member", back_populates="prayer_requests")


class VisitorFollowUp(Base):
    """Pipeline workflow for welcoming, following up, and integrating first-time guests."""

    __tablename__ = "visitor_follow_ups"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    visitor_name: Mapped[str] = mapped_column(String(150), nullable=False)
    email: Mapped[str | None] = mapped_column(String(255), nullable=True)
    phone: Mapped[str | None] = mapped_column(String(50), nullable=True)
    member_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("members.id", ondelete="SET NULL"), nullable=True)
    visit_date: Mapped[date] = mapped_column(Date, default=date.today)
    status: Mapped[str] = mapped_column(String(50), default="New Visitor")  # New Visitor, Welcome Call Made, Home/Coffee Visit, Next Steps Class, Integrated
    assigned_to: Mapped[str | None] = mapped_column(String(100), nullable=True)  # Hospitality Team, Pastor David, etc.
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
