"""Attendance tracking model."""

from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base

if TYPE_CHECKING:
    from app.models.event import Event
    from app.models.member import Member


class AttendanceRecord(Base):
    """An individual check-in or attendance mark for a specific event."""

    __tablename__ = "attendance_records"
    __table_args__ = (UniqueConstraint("event_id", "member_id", name="uq_event_member_attendance"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    event_id: Mapped[int] = mapped_column(Integer, ForeignKey("events.id", ondelete="CASCADE"), nullable=False)
    member_id: Mapped[int] = mapped_column(Integer, ForeignKey("members.id", ondelete="CASCADE"), nullable=False)
    status: Mapped[str] = mapped_column(String(30), default="Present")  # Present, Late, Excused, Absent
    check_in_time: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Relationships
    event: Mapped["Event"] = relationship("Event", back_populates="attendance_records")
    member: Mapped["Member"] = relationship("Member", back_populates="attendance_records")
