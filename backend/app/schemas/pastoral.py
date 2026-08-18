"""Pastoral Care, Prayer Request, and Visitor schemas."""

from datetime import date as dt_date, datetime as dt_datetime
from pydantic import BaseModel, ConfigDict, Field


# --- Pastoral Care Notes ---
class PastoralCareNoteBase(BaseModel):
    member_id: int
    author_name: str = Field(min_length=1, max_length=100)
    category: str = "General Care"
    content: str = Field(min_length=1)
    date: dt_date = Field(default_factory=dt_date.today)
    is_confidential: bool = False
    follow_up_needed: bool = False


class PastoralCareNoteCreate(PastoralCareNoteBase):
    pass


class PastoralCareNoteRead(PastoralCareNoteBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: dt_datetime
    member_name: str | None = None


# --- Prayer Requests ---
class PrayerRequestBase(BaseModel):
    member_id: int | None = None
    requester_name: str = Field(min_length=1, max_length=150)
    title: str = Field(min_length=1, max_length=200)
    details: str = Field(min_length=1)
    category: str = "Healing"
    status: str = "Active"
    date_requested: dt_date = Field(default_factory=dt_date.today)
    date_answered: dt_date | None = None
    answer_notes: str | None = None
    is_confidential: bool = False


class PrayerRequestCreate(PrayerRequestBase):
    pass


class PrayerRequestUpdate(BaseModel):
    title: str | None = None
    details: str | None = None
    category: str | None = None
    status: str | None = None
    date_answered: dt_date | None = None
    answer_notes: str | None = None
    is_confidential: bool | None = None


class PrayerRequestRead(PrayerRequestBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: dt_datetime


# --- Visitor Follow-Ups ---
class VisitorFollowUpBase(BaseModel):
    visitor_name: str = Field(min_length=1, max_length=150)
    email: str | None = None
    phone: str | None = None
    member_id: int | None = None
    visit_date: dt_date = Field(default_factory=dt_date.today)
    status: str = "New Visitor"
    assigned_to: str | None = None
    notes: str | None = None


class VisitorFollowUpCreate(VisitorFollowUpBase):
    pass


class VisitorFollowUpUpdate(BaseModel):
    visitor_name: str | None = None
    email: str | None = None
    phone: str | None = None
    status: str | None = None
    assigned_to: str | None = None
    notes: str | None = None


class VisitorFollowUpRead(VisitorFollowUpBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: dt_datetime
