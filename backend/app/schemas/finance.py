"""Financial schemas for Contributions, Expenses, Campaigns, and Reports."""

from datetime import date as dt_date, datetime as dt_datetime
from pydantic import BaseModel, ConfigDict, Field


# --- Contributions ---
class ContributionBase(BaseModel):
    member_id: int | None = None
    donor_name: str | None = None
    donor_pan_or_tax_id: str | None = None
    amount: float = Field(gt=0)
    currency: str = "INR"
    fund: str = "Tithe"
    payment_method: str = "Cash"
    reference_number: str | None = None
    gateway_order_id: str | None = None
    gateway_payment_id: str | None = None
    date: dt_date = Field(default_factory=dt_date.today)
    is_anonymous: bool = False
    is_fcra: bool = False
    donor_country: str = "India"
    tax_receipt_issued: bool = False
    tax_receipt_number: str | None = None
    notes: str | None = None


class ContributionCreate(ContributionBase):
    pass


class ContributionRead(ContributionBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: dt_datetime
    member_name: str | None = None


# --- Expenses ---
class ExpenseBase(BaseModel):
    category: str
    title: str = Field(min_length=1, max_length=200)
    amount: float = Field(gt=0)
    currency: str = "INR"
    payee: str = Field(min_length=1, max_length=150)
    date: dt_date = Field(default_factory=dt_date.today)
    payment_method: str = "Bank Transfer"
    approved_by: str | None = None
    receipt_reference: str | None = None
    receipt_file_url: str | None = None
    gst_amount: float = 0.0
    is_fcra_expense: bool = False
    description: str | None = None


class ExpenseCreate(ExpenseBase):
    pass


class ExpenseRead(ExpenseBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: dt_datetime


# --- Campaigns & Pledges ---
class PledgeBase(BaseModel):
    campaign_id: int
    member_id: int
    amount_pledged: float = Field(gt=0)
    amount_paid: float = 0.0
    status: str = "Active"


class PledgeCreate(PledgeBase):
    pass


class PledgeRead(PledgeBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: dt_datetime
    member_name: str | None = None


class PledgeCampaignBase(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    target_amount: float = Field(gt=0)
    start_date: dt_date
    end_date: dt_date | None = None
    description: str | None = None
    is_active: bool = True


class PledgeCampaignCreate(PledgeCampaignBase):
    pass


class PledgeCampaignRead(PledgeCampaignBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: dt_datetime
    total_pledged: float = 0.0
    total_received: float = 0.0
    pledge_count: int = 0
    percent_completed: float = 0.0


# --- Financial Summaries & Reports ---
class FundSummary(BaseModel):
    fund_name: str
    total_amount: float
    percentage: float


class MonthlyFinanceData(BaseModel):
    month: str  # e.g., "Jan 2026"
    income: float
    expense: float
    net: float


class FinanceSummary(BaseModel):
    total_income_ytd: float
    total_expense_ytd: float
    net_operating_balance: float
    total_pledges_active: float
    recent_contributions: list[ContributionRead] = []
    fund_breakdown: list[FundSummary] = []
    monthly_trends: list[MonthlyFinanceData] = []


class DonorStatement(BaseModel):
    member_id: int | None = None
    donor_name: str
    address: str | None = None
    email: str | None = None
    phone: str | None = None
    start_date: dt_date
    end_date: dt_date
    total_amount: float
    contributions: list[ContributionRead]
    generated_at: dt_datetime
