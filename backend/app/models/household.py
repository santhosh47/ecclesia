"""Household persistence model."""

from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base

if TYPE_CHECKING:
    from app.models.member import Member


class Household(Base):
    """A family or household unit grouping church members."""

    __tablename__ = "households"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(150), nullable=False)  # e.g., "The Johnson Family"
    address: Mapped[str | None] = mapped_column(Text, nullable=True)
    city: Mapped[str | None] = mapped_column(String(100), nullable=True)
    state: Mapped[str | None] = mapped_column(String(100), nullable=True)
    postal_code: Mapped[str | None] = mapped_column(String(20), nullable=True)
    home_phone: Mapped[str | None] = mapped_column(String(50), nullable=True)
    ward_zone: Mapped[str | None] = mapped_column(String(100), nullable=True)  # e.g., "Ward 4 - Indiranagar", "Zone B - Downtown"
    landmark: Mapped[str | None] = mapped_column(String(200), nullable=True)  # Helpful for carol teams & visitations
    latitude: Mapped[float | None] = mapped_column(Float, nullable=True)
    longitude: Mapped[float | None] = mapped_column(Float, nullable=True)
    primary_contact_id: Mapped[int | None] = mapped_column(Integer, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    # Relationships
    members: Mapped[list["Member"]] = relationship("Member", back_populates="household")
