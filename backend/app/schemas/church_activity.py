"""Schemas for church activities, services, and gatherings calendar."""

from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field


class ChurchActivityBase(BaseModel):
    title: str = Field(..., max_length=200)
    category: str = Field(default="Worship Service", max_length=50)
    activity_type: str = Field(default="Regular Weekly", max_length=50)
    starts_at: datetime
    ends_at: datetime | None = None
    location: str | None = Field(default="Main Sanctuary", max_length=200)
    organizer_name: str | None = Field(default=None, max_length=150)
    target_group: str = Field(default="All Congregation", max_length=100)
    description: str | None = None
    is_recurring: bool = False
    recurrence_pattern: str | None = Field(default=None, max_length=150)
    contact_phone: str | None = Field(default=None, max_length=50)
    is_active: bool = True


class ChurchActivityCreate(ChurchActivityBase):
    pass


class ChurchActivityUpdate(BaseModel):
    title: str | None = None
    category: str | None = None
    activity_type: str | None = None
    starts_at: datetime | None = None
    ends_at: datetime | None = None
    location: str | None = None
    organizer_name: str | None = None
    target_group: str | None = None
    description: str | None = None
    is_recurring: bool | None = None
    recurrence_pattern: str | None = None
    contact_phone: str | None = None
    is_active: bool | None = None


class ChurchActivityRead(ChurchActivityBase):
    id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
