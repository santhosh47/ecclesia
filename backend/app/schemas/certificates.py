"""Milestone Certificates API Schemas."""

from datetime import date, datetime
from pydantic import BaseModel, ConfigDict, Field


class CertificateTemplateRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    type: str
    title: str
    scripture_verse: str | None = None
    header_text: str | None = None
    body_template: str
    signatory_1_title: str
    signatory_2_title: str
    border_style: str


class IssueCertificateRequest(BaseModel):
    certificate_type: str  # Baptism, Wedding, Child Dedication, Confirmation, Membership
    member_id: int | None = None
    recipient_name: str = Field(min_length=1, max_length=150)
    secondary_name: str | None = None  # e.g., Spouse name, Parents
    issue_date: date = Field(default_factory=date.today)
    event_date: date = Field(default_factory=date.today)
    officiant_name: str = "Pastor Dr. Samuel Thomas"
    witness_1: str | None = None
    witness_2: str | None = None
    church_name: str = "St. Luke's Ecclesia Church"
    church_registration_no: str | None = None
    church_address: str | None = None
    notes: str | None = None


class IssuedCertificateRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    certificate_number: str
    certificate_type: str
    member_id: int | None = None
    recipient_name: str
    secondary_name: str | None = None
    issue_date: date
    event_date: date
    officiant_name: str
    witness_1: str | None = None
    witness_2: str | None = None
    church_name: str
    church_registration_no: str | None = None
    church_address: str | None = None
    verification_code: str
    notes: str | None = None
    pdf_file_url: str | None = None
    created_at: datetime


class CertificateVerificationResponse(BaseModel):
    is_valid: bool
    certificate_number: str | None = None
    recipient_name: str | None = None
    certificate_type: str | None = None
    event_date: date | None = None
    officiant_name: str | None = None
    church_name: str | None = None
    issued_at: datetime | None = None
