"""Double-entry Bookkeeping and Staff Payroll Models."""

from datetime import date, datetime
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, Date, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base

if TYPE_CHECKING:
    pass


class Account(Base):
    """Chart of Accounts for double-entry church bookkeeping."""

    __tablename__ = "accounts"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    code: Mapped[str] = mapped_column(String(20), unique=True, index=True, nullable=False)  # e.g., 1010, 1020, 2010, 4010, 5010
    name: Mapped[str] = mapped_column(String(150), nullable=False)  # General Operating Fund, Building Asset, Staff Salaries, Tithes
    account_type: Mapped[str] = mapped_column(String(30), nullable=False)  # Asset, Liability, Equity, Revenue, Expense
    sub_category: Mapped[str | None] = mapped_column(String(100), nullable=True)  # Current Assets, Fixed Assets, Designated Funds, Operating Expenses
    currency: Mapped[str] = mapped_column(String(10), default="INR")
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    is_fcra: Mapped[bool] = mapped_column(Boolean, default=False)  # FCRA designated account for foreign funds
    balance: Mapped[float] = mapped_column(Float, default=0.0)  # Running net balance
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    # Relationships
    journal_lines: Mapped[list["JournalLine"]] = relationship("JournalLine", back_populates="account")


class JournalEntry(Base):
    """A balanced double-entry accounting transaction."""

    __tablename__ = "journal_entries"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    entry_number: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)  # e.g., JE-2026-001
    entry_date: Mapped[date] = mapped_column(Date, default=date.today)
    description: Mapped[str] = mapped_column(String(255), nullable=False)
    reference: Mapped[str | None] = mapped_column(String(100), nullable=True)  # Voucher #, Bank Ref
    status: Mapped[str] = mapped_column(String(30), default="Posted")  # Draft, Posted, Voided
    is_fcra: Mapped[bool] = mapped_column(Boolean, default=False)
    posted_by: Mapped[str | None] = mapped_column(String(100), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    # Relationships
    lines: Mapped[list["JournalLine"]] = relationship("JournalLine", back_populates="journal_entry", cascade="all, delete-orphan")


class JournalLine(Base):
    """An individual debit or credit leg of a journal entry."""

    __tablename__ = "journal_lines"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    journal_entry_id: Mapped[int] = mapped_column(Integer, ForeignKey("journal_entries.id", ondelete="CASCADE"), nullable=False)
    account_id: Mapped[int] = mapped_column(Integer, ForeignKey("accounts.id", ondelete="RESTRICT"), nullable=False)
    debit: Mapped[float] = mapped_column(Float, default=0.0)
    credit: Mapped[float] = mapped_column(Float, default=0.0)
    memo: Mapped[str | None] = mapped_column(String(255), nullable=True)

    # Relationships
    journal_entry: Mapped["JournalEntry"] = relationship("JournalEntry", back_populates="lines")
    account: Mapped["Account"] = relationship("Account", back_populates="journal_lines")


class Staff(Base):
    """Church employee, clergy, or staff member for staff ledger & payroll."""

    __tablename__ = "staff"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    first_name: Mapped[str] = mapped_column(String(100), nullable=False)
    last_name: Mapped[str] = mapped_column(String(100), nullable=False)
    role_title: Mapped[str] = mapped_column(String(150), nullable=False)  # Senior Pastor, Music Director, Youth Pastor, Custodian, Administrator
    email: Mapped[str | None] = mapped_column(String(255), nullable=True)
    phone: Mapped[str | None] = mapped_column(String(50), nullable=True)
    pan_or_tax_id: Mapped[str | None] = mapped_column(String(50), nullable=True)
    bank_account_number: Mapped[str | None] = mapped_column(String(50), nullable=True)
    bank_ifsc_or_routing: Mapped[str | None] = mapped_column(String(50), nullable=True)
    base_salary_monthly: Mapped[float] = mapped_column(Float, default=0.0)
    housing_allowance: Mapped[float] = mapped_column(Float, default=0.0)
    travel_allowance: Mapped[float] = mapped_column(Float, default=0.0)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    joined_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    expense_account_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("accounts.id", ondelete="SET NULL"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    # Relationships
    payroll_records: Mapped[list["PayrollRecord"]] = relationship("PayrollRecord", back_populates="staff", cascade="all, delete-orphan")


class PayrollRecord(Base):
    """A monthly or periodic payroll disbursement for church staff."""

    __tablename__ = "payroll_records"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    staff_id: Mapped[int] = mapped_column(Integer, ForeignKey("staff.id", ondelete="CASCADE"), nullable=False)
    pay_period: Mapped[str] = mapped_column(String(50), nullable=False)  # e.g., "August 2026", "2026-08"
    payment_date: Mapped[date] = mapped_column(Date, default=date.today)
    basic_salary: Mapped[float] = mapped_column(Float, nullable=False)
    allowances: Mapped[float] = mapped_column(Float, default=0.0)
    deductions: Mapped[float] = mapped_column(Float, default=0.0)  # TDS (Tax), Provident Fund, Advance
    net_pay: Mapped[float] = mapped_column(Float, nullable=False)
    payment_method: Mapped[str] = mapped_column(String(50), default="Direct Bank Transfer")  # Direct Bank Transfer, Check, UPI
    status: Mapped[str] = mapped_column(String(30), default="Disbursed")  # Pending, Disbursed
    payslip_reference: Mapped[str | None] = mapped_column(String(100), nullable=True)
    journal_entry_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("journal_entries.id", ondelete="SET NULL"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    # Relationships
    staff: Mapped["Staff"] = relationship("Staff", back_populates="payroll_records")
