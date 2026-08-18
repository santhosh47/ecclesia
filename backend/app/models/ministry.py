"""Ministry and small group models."""

from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base

if TYPE_CHECKING:
    from app.models.member import Member


class MemberMinistry(Base):
    """Association table linking members with ministries and their specific roles."""

    __tablename__ = "member_ministries"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    member_id: Mapped[int] = mapped_column(Integer, ForeignKey("members.id", ondelete="CASCADE"), nullable=False)
    ministry_id: Mapped[int] = mapped_column(Integer, ForeignKey("ministries.id", ondelete="CASCADE"), nullable=False)
    role: Mapped[str] = mapped_column(String(50), default="Member")  # Leader, Assistant, Volunteer, Member
    joined_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    # Relationships
    member: Mapped["Member"] = relationship("Member", back_populates="ministry_memberships")
    ministry: Mapped["Ministry"] = relationship("Ministry", back_populates="members")


class Ministry(Base):
    """A church ministry, department, or small group."""

    __tablename__ = "ministries"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(150), nullable=False, unique=True)
    category: Mapped[str] = mapped_column(String(50), default="Ministry")  # Ministry, Small Group, Department, Committee
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    meeting_time: Mapped[str | None] = mapped_column(String(100), nullable=True)  # e.g., "Wednesdays @ 7:00 PM"
    meeting_location: Mapped[str | None] = mapped_column(String(150), nullable=True)
    leader_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("members.id", ondelete="SET NULL"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    # Relationships
    members: Mapped[list["MemberMinistry"]] = relationship("MemberMinistry", back_populates="ministry", cascade="all, delete-orphan")
