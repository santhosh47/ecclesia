"""Tax Exemption and Compliance Models (80G, FCRA, 501(c)(3), UK Gift Aid)."""

from datetime import date, datetime
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, Date, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base

if TYPE_CHECKING:
    from app.models.finance import Contribution
    from app.models.member import Member


class TaxReceipt(Base):
    """Official tax exemption certificate or contribution statement for legal reporting."""

    __tablename__ = "tax_receipts"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    receipt_number: Mapped[str] = mapped_column(String(100), unique=True, index=True, nullable=False)  # e.g., "80G-2026-00128" or "501C3-2026-0089"
    tax_regime: Mapped[str] = mapped_column(String(30), default="80G_INDIA")  # 80G_INDIA, US_501C3, UK_GIFT_AID, EU_TAX
    member_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("members.id", ondelete="SET NULL"), nullable=True)
    donor_name: Mapped[str] = mapped_column(String(150), nullable=False)
    donor_pan_or_tax_id: Mapped[str | None] = mapped_column(String(50), nullable=True)
    donor_address: Mapped[str | None] = mapped_column(Text, nullable=True)
    contribution_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("contributions.id", ondelete="SET NULL"), nullable=True)
    amount: Mapped[float] = mapped_column(Float, nullable=False)
    eligible_tax_amount: Mapped[float] = mapped_column(Float, nullable=False)  # For 80G 50% vs 100% deduction or 25% Gift Aid reclaim
    currency: Mapped[str] = mapped_column(String(10), default="INR")
    financial_year: Mapped[str] = mapped_column(String(30), nullable=False)  # e.g., "2025-2026" or "TY 2026"
    issue_date: Mapped[date] = mapped_column(Date, default=date.today)
    authorized_signatory: Mapped[str] = mapped_column(String(150), default="Pastor Mr. John Doe (Senior Pastor & Treasurer)")
    church_tax_registration_no: Mapped[str] = mapped_column(String(100), default="CIT(E)/BLR/80G/2024-25/AABTE1234F")
    pdf_download_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    # Relationships
    member: Mapped["Member | None"] = relationship("Member")
    contribution: Mapped["Contribution | None"] = relationship("Contribution")


class FCRALog(Base):
    """Tracking and compliance register for foreign remittances (FCRA - India)."""

    __tablename__ = "fcra_logs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    contribution_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("contributions.id", ondelete="SET NULL"), nullable=True)
    donor_name: Mapped[str] = mapped_column(String(150), nullable=False)
    donor_country: Mapped[str] = mapped_column(String(100), nullable=False)  # USA, UK, UAE, Singapore, Canada, etc.
    foreign_currency: Mapped[str] = mapped_column(String(10), default="USD")
    foreign_amount: Mapped[float] = mapped_column(Float, nullable=False)
    inr_realized_amount: Mapped[float] = mapped_column(Float, nullable=False)
    exchange_rate: Mapped[float] = mapped_column(Float, default=83.5)
    fcra_designated_bank: Mapped[str] = mapped_column(String(150), default="State Bank of India, New Delhi Main Branch")
    fcra_purpose_code: Mapped[str] = mapped_column(String(50), default="Religious / Social Outreach")
    remittance_date: Mapped[date] = mapped_column(Date, default=date.today)
    firc_reference: Mapped[str | None] = mapped_column(String(100), nullable=True)  # Foreign Inward Remittance Certificate #
    is_reported_in_fc4: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
