"""Church activity, service, and event schedule model."""

from datetime import datetime

from sqlalchemy import Boolean, DateTime, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.database.base import Base


class ChurchActivity(Base):
    """A scheduled regular or special church activity, service, meeting, or gathering."""

    __tablename__ = "church_activities"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    category: Mapped[str] = mapped_column(String(50), default="Worship Service")  # Worship Service, Prayer Meeting, Bible Study, Choir Practice, Committee Meeting, Youth Fellowship, Community Outreach, Special Conference, Fellowship Gathering
    activity_type: Mapped[str] = mapped_column(String(50), default="Regular Weekly")  # Regular Weekly, Monthly, Special Event, Annual
    starts_at: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    ends_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    location: Mapped[str | None] = mapped_column(String(200), default="Main Sanctuary")
    organizer_name: Mapped[str | None] = mapped_column(String(150), nullable=True)
    target_group: Mapped[str] = mapped_column(String(100), default="All Congregation")
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_recurring: Mapped[bool] = mapped_column(Boolean, default=False)
    recurrence_pattern: Mapped[str | None] = mapped_column(String(150), nullable=True)
    contact_phone: Mapped[str | None] = mapped_column(String(50), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
