"""Church financial models: Contributions, Expenses, and Pledge Campaigns."""

from datetime import date, datetime
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, Date, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base

if TYPE_CHECKING:
    from app.models.member import Member


class Contribution(Base):
    """An incoming financial gift, tithe, or donation."""

    __tablename__ = "contributions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    member_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("members.id", ondelete="SET NULL"), nullable=True)
    donor_name: Mapped[str | None] = mapped_column(String(150), nullable=True)  # Populated for non-members or cash givers
    donor_pan_or_tax_id: Mapped[str | None] = mapped_column(String(50), nullable=True)  # For 80G / 501(c)(3) receipts
    amount: Mapped[float] = mapped_column(Float, nullable=False)
    currency: Mapped[str] = mapped_column(String(10), default="INR")  # INR, USD, EUR, GBP
    fund: Mapped[str] = mapped_column(String(50), default="Tithe")  # Tithe, General Offering, Building Fund, Missions, Benevolence, Special
    payment_method: Mapped[str] = mapped_column(String(50), default="Cash")  # Cash, Check, UPI, Razorpay, Stripe, PayPal, Bank Transfer
    reference_number: Mapped[str | None] = mapped_column(String(100), nullable=True)  # Check # or transaction ID
    gateway_order_id: Mapped[str | None] = mapped_column(String(100), nullable=True)
    gateway_payment_id: Mapped[str | None] = mapped_column(String(100), nullable=True)
    date: Mapped[date] = mapped_column(Date, default=date.today)
    is_anonymous: Mapped[bool] = mapped_column(Boolean, default=False)
    is_fcra: Mapped[bool] = mapped_column(Boolean, default=False)  # Indian Foreign Contribution Regulation Act tracking
    donor_country: Mapped[str] = mapped_column(String(50), default="India")
    tax_receipt_issued: Mapped[bool] = mapped_column(Boolean, default=False)
    tax_receipt_number: Mapped[str | None] = mapped_column(String(100), nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    # Relationships
    member: Mapped["Member | None"] = relationship("Member", back_populates="contributions")


class Expense(Base):
    """An outgoing operational church expense or benevolence payout."""

    __tablename__ = "expenses"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    category: Mapped[str] = mapped_column(String(50), nullable=False)  # Facilities & Utilities, Staff & Honorarium, Worship & Tech, Missions & Outreach, Hospitality & Fellowship, Admin & Office, Charity
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    amount: Mapped[float] = mapped_column(Float, nullable=False)
    currency: Mapped[str] = mapped_column(String(10), default="INR")
    payee: Mapped[str] = mapped_column(String(150), nullable=False)  # Vendor, utility company, speaker, contractor
    date: Mapped[date] = mapped_column(Date, default=date.today)
    payment_method: Mapped[str] = mapped_column(String(50), default="Bank Transfer")  # Check, Credit Card, Bank Transfer, Petty Cash, UPI
    approved_by: Mapped[str | None] = mapped_column(String(100), nullable=True)  # Pastor, Treasurer, Board
    receipt_reference: Mapped[str | None] = mapped_column(String(100), nullable=True)
    receipt_file_url: Mapped[str | None] = mapped_column(String(500), nullable=True)  # Path/URL to uploaded invoice or receipt voucher
    gst_amount: Mapped[float] = mapped_column(Float, default=0.0)  # GST breakdown for Indian compliance
    is_fcra_expense: Mapped[bool] = mapped_column(Boolean, default=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class PledgeCampaign(Base):
    """A targeted fundraising campaign (e.g. New Sanctuary, Missionary Drive)."""

    __tablename__ = "pledge_campaigns"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    target_amount: Mapped[float] = mapped_column(Float, nullable=False)
    start_date: Mapped[date] = mapped_column(Date, nullable=False)
    end_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    # Relationships
    pledges: Mapped[list["Pledge"]] = relationship("Pledge", back_populates="campaign", cascade="all, delete-orphan")


class Pledge(Base):
    """An individual member's commitment towards a specific pledge campaign."""

    __tablename__ = "pledges"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    campaign_id: Mapped[int] = mapped_column(Integer, ForeignKey("pledge_campaigns.id", ondelete="CASCADE"), nullable=False)
    member_id: Mapped[int] = mapped_column(Integer, ForeignKey("members.id", ondelete="CASCADE"), nullable=False)
    amount_pledged: Mapped[float] = mapped_column(Float, nullable=False)
    amount_paid: Mapped[float] = mapped_column(Float, default=0.0)
    status: Mapped[str] = mapped_column(String(30), default="Active")  # Active, Fulfilled, Cancelled
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    # Relationships
    campaign: Mapped["PledgeCampaign"] = relationship("PledgeCampaign", back_populates="pledges")
    member: Mapped["Member"] = relationship("Member", back_populates="pledges")
