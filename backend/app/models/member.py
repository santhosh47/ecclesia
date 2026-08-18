"""Member persistence model with comprehensive demographics and milestone dates."""

from datetime import date, datetime
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, Date, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base

if TYPE_CHECKING:
    from app.models.attendance import AttendanceRecord
    from app.models.finance import Contribution, Pledge
    from app.models.household import Household
    from app.models.ministry import MemberMinistry
    from app.models.pastoral import PastoralCareNote, PrayerRequest


class Member(Base):
    """A person recorded in the church directory with full demographic and spiritual journey info."""

    __tablename__ = "members"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    first_name: Mapped[str] = mapped_column(String(100), nullable=False)
    middle_name: Mapped[str | None] = mapped_column(String(100), nullable=True)
    last_name: Mapped[str] = mapped_column(String(100), nullable=False)
    title: Mapped[str | None] = mapped_column(String(20), nullable=True)  # Mr, Mrs, Pastor, Elder, Deacon, Dr, Rev
    
    # Contact Info
    email: Mapped[str | None] = mapped_column(String(255), unique=True, nullable=True, index=True)
    phone: Mapped[str | None] = mapped_column(String(50), nullable=True)
    alternate_phone: Mapped[str | None] = mapped_column(String(50), nullable=True)
    address: Mapped[str | None] = mapped_column(Text, nullable=True)
    city: Mapped[str | None] = mapped_column(String(100), nullable=True)
    state: Mapped[str | None] = mapped_column(String(100), nullable=True)
    postal_code: Mapped[str | None] = mapped_column(String(20), nullable=True)
    
    # Demographics & Compliance
    gender: Mapped[str | None] = mapped_column(String(20), nullable=True)  # Male, Female, Other
    marital_status: Mapped[str | None] = mapped_column(String(30), nullable=True)  # Single, Married, Widowed, Divorced
    occupation: Mapped[str | None] = mapped_column(String(150), nullable=True)
    avatar_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    
    # Tax / Donor Compliance (80G / 501c3 / Gift Aid)
    pan_number: Mapped[str | None] = mapped_column(String(30), nullable=True, index=True)  # Indian PAN for 80G receipts
    tax_id: Mapped[str | None] = mapped_column(String(50), nullable=True)  # SSN/Tax ID for US/Global 501(c)(3) or UK Gift Aid
    gift_aid_eligible: Mapped[bool] = mapped_column(Boolean, default=False)
    
    # Messaging & Preferences
    language_preference: Mapped[str] = mapped_column(String(50), default="English")  # English, Tamil, Malayalam, Telugu, Hindi, Spanish, etc.
    gdpr_opt_out: Mapped[bool] = mapped_column(Boolean, default=False)  # GDPR opt-out flag for mass messaging
    whatsapp_opt_in: Mapped[bool] = mapped_column(Boolean, default=True)
    
    # Emergency Contact
    emergency_contact_name: Mapped[str | None] = mapped_column(String(150), nullable=True)
    emergency_contact_phone: Mapped[str | None] = mapped_column(String(50), nullable=True)
    
    # Membership Status
    status: Mapped[str] = mapped_column(String(50), default="Active")  # Active, Visitor, Regular Attendee, Inactive, Transferred, Clergy
    member_type: Mapped[str] = mapped_column(String(50), default="Adult")  # Adult, Youth, Child, Senior
    
    # Important Dates & Milestones
    date_of_birth: Mapped[date | None] = mapped_column(Date, nullable=True)
    wedding_anniversary: Mapped[date | None] = mapped_column(Date, nullable=True)
    baptism_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    baptism_location: Mapped[str | None] = mapped_column(String(200), nullable=True)
    confirmation_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    joined_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    first_visit_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    
    # Family / Household Link
    household_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("households.id", ondelete="SET NULL"), nullable=True)
    household_role: Mapped[str | None] = mapped_column(String(50), nullable=True)  # Head, Spouse, Child, Dependent, Other
    
    # Pastoral / Administrative Notes
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    household: Mapped["Household | None"] = relationship("Household", back_populates="members")
    ministry_memberships: Mapped[list["MemberMinistry"]] = relationship("MemberMinistry", back_populates="member", cascade="all, delete-orphan")
    contributions: Mapped[list["Contribution"]] = relationship("Contribution", back_populates="member")
    pledges: Mapped[list["Pledge"]] = relationship("Pledge", back_populates="member")
    attendance_records: Mapped[list["AttendanceRecord"]] = relationship("AttendanceRecord", back_populates="member")
    pastoral_notes: Mapped[list["PastoralCareNote"]] = relationship("PastoralCareNote", back_populates="member")
    prayer_requests: Mapped[list["PrayerRequest"]] = relationship("PrayerRequest", back_populates="member")
