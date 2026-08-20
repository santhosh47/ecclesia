"""Life Milestone Certificate Models (Baptism, Wedding, Dedication, Confirmation)."""

import uuid
from datetime import date, datetime
from typing import TYPE_CHECKING

from sqlalchemy import Date, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base

if TYPE_CHECKING:
    from app.models.member import Member


class CertificateTemplate(Base):
    """Configurable template for church certificates."""

    __tablename__ = "certificate_templates"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    type: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)  # Baptism, Wedding, Child Dedication, Confirmation, Membership
    title: Mapped[str] = mapped_column(String(200), nullable=False)  # "Certificate of Holy Baptism"
    scripture_verse: Mapped[str | None] = mapped_column(String(255), nullable=True)  # "Matthew 28:19 - Go therefore and make disciples..."
    header_text: Mapped[str | None] = mapped_column(Text, nullable=True)
    body_template: Mapped[str] = mapped_column(Text, nullable=False)  # "This certifies that {{recipient_name}} was baptized in the name of the Father..."
    signatory_1_title: Mapped[str] = mapped_column(String(100), default="Senior Pastor")
    signatory_2_title: Mapped[str] = mapped_column(String(100), default="Church Secretary / Elder")
    border_style: Mapped[str] = mapped_column(String(50), default="Classic Gold")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class IssuedCertificate(Base):
    """An issued milestone certificate with persistent verification code."""

    __tablename__ = "issued_certificates"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    certificate_number: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)  # e.g., "CERT-BAP-2026-0042"
    certificate_type: Mapped[str] = mapped_column(String(50), nullable=False)  # Baptism, Wedding, Child Dedication, Confirmation, Membership
    member_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("members.id", ondelete="SET NULL"), nullable=True)
    recipient_name: Mapped[str] = mapped_column(String(150), nullable=False)
    secondary_name: Mapped[str | None] = mapped_column(String(150), nullable=True)  # Spouse name (for wedding), Parents (for dedication)
    issue_date: Mapped[date] = mapped_column(Date, default=date.today)
    event_date: Mapped[date] = mapped_column(Date, default=date.today)
    officiant_name: Mapped[str] = mapped_column(String(150), nullable=False)  # e.g. "Pastor Dr. Samuel Thomas"
    witness_1: Mapped[str | None] = mapped_column(String(150), nullable=True)
    witness_2: Mapped[str | None] = mapped_column(String(150), nullable=True)
    church_name: Mapped[str] = mapped_column(String(200), default="St. Luke's Ecclesia Church")
    church_registration_no: Mapped[str | None] = mapped_column(String(100), nullable=True)
    church_address: Mapped[str | None] = mapped_column(String(255), nullable=True)
    verification_code: Mapped[str] = mapped_column(String(64), default=lambda: uuid.uuid4().hex[:12].upper(), unique=True, index=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    pdf_file_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    # Relationships
    member: Mapped["Member | None"] = relationship("Member")
