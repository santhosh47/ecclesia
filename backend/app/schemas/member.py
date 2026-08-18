"""Member API schemas with milestone tracking and complete profiles."""

from datetime import date, datetime
from pydantic import BaseModel, ConfigDict, EmailStr, Field


class MemberBase(BaseModel):
    first_name: str = Field(min_length=1, max_length=100)
    middle_name: str | None = None
    last_name: str = Field(min_length=1, max_length=100)
    title: str | None = None
    email: EmailStr | None = None
    phone: str | None = Field(default=None, max_length=50)
    alternate_phone: str | None = Field(default=None, max_length=50)
    address: str | None = None
    city: str | None = None
    state: str | None = None
    postal_code: str | None = None
    gender: str | None = None
    marital_status: str | None = None
    occupation: str | None = None
    avatar_url: str | None = None
    status: str = "Active"
    member_type: str = "Adult"
    
    # Tax & Compliance
    pan_number: str | None = None
    tax_id: str | None = None
    gift_aid_eligible: bool = False
    
    # Preferences & Messaging
    language_preference: str = "English"
    gdpr_opt_out: bool = False
    whatsapp_opt_in: bool = True
    
    # Emergency Contact
    emergency_contact_name: str | None = None
    emergency_contact_phone: str | None = None
    
    date_of_birth: date | None = None
    wedding_anniversary: date | None = None
    baptism_date: date | None = None
    baptism_location: str | None = None
    confirmation_date: date | None = None
    joined_date: date | None = None
    first_visit_date: date | None = None
    household_id: int | None = None
    household_role: str | None = None
    notes: str | None = None


class MemberCreate(MemberBase):
    pass


class MemberUpdate(BaseModel):
    first_name: str | None = Field(default=None, min_length=1, max_length=100)
    middle_name: str | None = None
    last_name: str | None = Field(default=None, min_length=1, max_length=100)
    title: str | None = None
    email: EmailStr | None = None
    phone: str | None = None
    alternate_phone: str | None = None
    address: str | None = None
    city: str | None = None
    state: str | None = None
    postal_code: str | None = None
    gender: str | None = None
    marital_status: str | None = None
    occupation: str | None = None
    avatar_url: str | None = None
    status: str | None = None
    member_type: str | None = None
    
    pan_number: str | None = None
    tax_id: str | None = None
    gift_aid_eligible: bool | None = None
    language_preference: str | None = None
    gdpr_opt_out: bool | None = None
    whatsapp_opt_in: bool | None = None
    emergency_contact_name: str | None = None
    emergency_contact_phone: str | None = None
    
    date_of_birth: date | None = None
    wedding_anniversary: date | None = None
    baptism_date: date | None = None
    baptism_location: str | None = None
    confirmation_date: date | None = None
    joined_date: date | None = None
    first_visit_date: date | None = None
    household_id: int | None = None
    household_role: str | None = None
    notes: str | None = None


class MemberRead(MemberBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime
    updated_at: datetime | None = None
    household_name: str | None = None
    ministries: list[str] = []


class MilestoneItem(BaseModel):
    member_id: int
    member_name: str
    member_avatar: str | None = None
    milestone_type: str  # "Birthday", "Wedding Anniversary", "Baptism Anniversary", "Membership Anniversary"
    event_date: date
    days_until: int
    years: int | None = None  # e.g., 40th birthday or 15th wedding anniversary
    phone: str | None = None
    email: str | None = None


class MemberDetail(MemberRead):
    total_contributions_ytd: float = 0.0
    attendance_rate_percent: float = 0.0
    last_attended_date: date | None = None
    prayer_requests_count: int = 0
    pastoral_notes_count: int = 0
