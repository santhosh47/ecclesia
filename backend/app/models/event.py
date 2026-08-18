"""Church event and service persistence model."""

from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, DateTime, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base

if TYPE_CHECKING:
    from app.models.attendance import AttendanceRecord


class Event(Base):
    """A scheduled church event, service, or gathering."""

    __tablename__ = "events"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    event_type: Mapped[str] = mapped_column(String(50), default="Sunday Worship")  # Sunday Worship, Midweek Service, Youth Service, Prayer Meeting, Special Event
    starts_at: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    ends_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    location: Mapped[str | None] = mapped_column(String(255), nullable=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    
    # Headcounts for quick logging
    headcount_adults: Mapped[int] = mapped_column(Integer, default=0)
    headcount_children: Mapped[int] = mapped_column(Integer, default=0)
    headcount_online: Mapped[int] = mapped_column(Integer, default=0)
    
    is_completed: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    # Relationships
    attendance_records: Mapped[list["AttendanceRecord"]] = relationship("AttendanceRecord", back_populates="event", cascade="all, delete-orphan")
