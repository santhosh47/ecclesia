"""Double-entry Ledger and Payroll API Schemas."""

from datetime import date, datetime
from pydantic import BaseModel, ConfigDict, Field, model_validator


class AccountBase(BaseModel):
    code: str = Field(min_length=1, max_length=20)
    name: str = Field(min_length=1, max_length=150)
    account_type: str  # Asset, Liability, Equity, Revenue, Expense
    sub_category: str | None = None
    currency: str = "INR"
    is_active: bool = True
    is_fcra: bool = False
    description: str | None = None


class AccountCreate(AccountBase):
    initial_balance: float = 0.0


class AccountRead(AccountBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    balance: float
    created_at: datetime


class JournalLineInput(BaseModel):
    account_id: int
    debit: float = 0.0
    credit: float = 0.0
    memo: str | None = None


class JournalLineRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    account_id: int
    account_code: str | None = None
    account_name: str | None = None
    debit: float
    credit: float
    memo: str | None = None


class JournalEntryCreate(BaseModel):
    entry_number: str | None = None  # Auto-generated if omitted
    entry_date: date = Field(default_factory=date.today)
    description: str = Field(min_length=1, max_length=255)
    reference: str | None = None
    is_fcra: bool = False
    posted_by: str | None = "Admin"
    lines: list[JournalLineInput]

    @model_validator(mode="after")
    def check_balanced_debits_and_credits(self) -> "JournalEntryCreate":
        total_debit = sum(round(line.debit, 2) for line in self.lines)
        total_credit = sum(round(line.credit, 2) for line in self.lines)
        if len(self.lines) < 2:
            raise ValueError("A journal entry must contain at least 2 lines (debit and credit legs).")
        if abs(total_debit - total_credit) > 0.01:
            raise ValueError(
                f"Double-entry out of balance! Total Debits ({total_debit}) must equal Total Credits ({total_credit})."
            )
        return self


class JournalEntryRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    entry_number: str
    entry_date: date
    description: str
    reference: str | None = None
    status: str
    is_fcra: bool
    posted_by: str | None = None
    total_debit: float = 0.0
    total_credit: float = 0.0
    lines: list[JournalLineRead] = []
    created_at: datetime


class TrialBalanceItem(BaseModel):
    account_id: int
    code: str
    name: str
    account_type: str
    debit: float
    credit: float


class TrialBalanceReport(BaseModel):
    as_of_date: date
    currency: str
    items: list[TrialBalanceItem]
    total_debits: float
    total_credits: float
    is_balanced: bool


class StaffBase(BaseModel):
    first_name: str
    last_name: str
    role_title: str
    email: str | None = None
    phone: str | None = None
    pan_or_tax_id: str | None = None
    bank_account_number: str | None = None
    bank_ifsc_or_routing: str | None = None
    base_salary_monthly: float = 0.0
    housing_allowance: float = 0.0
    travel_allowance: float = 0.0
    is_active: bool = True
    joined_date: date | None = None
    expense_account_id: int | None = None


class StaffCreate(StaffBase):
    pass


class StaffRead(StaffBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    full_name: str | None = None
    created_at: datetime


class PayrollRecordCreate(BaseModel):
    staff_id: int
    pay_period: str  # e.g., "August 2026"
    payment_date: date = Field(default_factory=date.today)
    basic_salary: float
    allowances: float = 0.0
    deductions: float = 0.0
    payment_method: str = "Direct Bank Transfer"


class PayrollRecordRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    staff_id: int
    staff_name: str | None = None
    staff_role: str | None = None
    pay_period: str
    payment_date: date
    basic_salary: float
    allowances: float
    deductions: float
    net_pay: float
    payment_method: str
    status: str
    payslip_reference: str | None = None
    created_at: datetime
