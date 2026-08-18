"""Tax Compliance (80G, FCRA, 501(c)(3), UK Gift Aid) API Schemas."""

from datetime import date, datetime
from pydantic import BaseModel, ConfigDict, Field


class IssueTaxReceiptRequest(BaseModel):
    contribution_id: int
    tax_regime: str = "80G_INDIA"  # 80G_INDIA, US_501C3, UK_GIFT_AID, EU_TAX
    donor_pan_or_tax_id: str | None = None
    financial_year: str = "2025-2026"
    notes: str | None = None


class TaxReceiptRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    receipt_number: str
    tax_regime: str
    member_id: int | None = None
    donor_name: str
    donor_pan_or_tax_id: str | None = None
    donor_address: str | None = None
    contribution_id: int | None = None
    amount: float
    eligible_tax_amount: float
    currency: str
    financial_year: str
    issue_date: date
    authorized_signatory: str
    church_tax_registration_no: str
    pdf_download_url: str | None = None
    notes: str | None = None
    created_at: datetime


class Form10BDEntry(BaseModel):
    sl_no: int
    pre_acknowledgment_number: str
    unique_donor_id_type: str  # PAN, Aadhaar, Passport
    unique_donor_id_number: str
    donor_name: str
    donor_address: str | None = None
    donation_type: str  # Corpus, Specific Grant, Others / General
    mode_of_receipt: str  # Electronic, Cheque, Cash
    amount_inr: float


class Form10BDExportReport(BaseModel):
    church_pan: str
    form_type: str = "FORM 10BD"
    financial_year: str
    total_donations_count: int
    total_aggregate_amount: float
    records: list[Form10BDEntry]


class FCRALogCreate(BaseModel):
    donor_name: str
    donor_country: str
    foreign_currency: str = "USD"
    foreign_amount: float = Field(gt=0)
    inr_realized_amount: float = Field(gt=0)
    exchange_rate: float
    fcra_purpose_code: str = "Religious / Social Outreach"
    remittance_date: date = Field(default_factory=date.today)
    firc_reference: str | None = None


class FCRALogRead(FCRALogCreate):
    model_config = ConfigDict(from_attributes=True)

    id: int
    contribution_id: int | None = None
    fcra_designated_bank: str
    is_reported_in_fc4: bool
    created_at: datetime


class UKGiftAidClaimReport(BaseModel):
    tax_year: str
    total_gift_aid_donations: float
    reclaim_rate_percent: float = 25.0
    total_tax_reclaim_amount: float
    eligible_donors_count: int
    donors: list[dict] = []
