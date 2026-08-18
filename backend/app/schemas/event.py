"""Event and Service schemas."""

from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field


class EventBase(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    event_type: str = "Sunday Worship"
    starts_at: datetime
    ends_at: datetime | None = None
    location: str | None = None
    description: str | None = None
    headcount_adults: int = 0
    headcount_children: int = 0
    headcount_online: int = 0
    is_completed: bool = False


class EventCreate(EventBase):
    pass


class EventUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=200)
    event_type: str | None = None
    starts_at: datetime | None = None
    ends_at: datetime | None = None
    location: str | None = None
    description: str | None = None
    headcount_adults: int | None = None
    headcount_children: int | None = None
    headcount_online: int | None = None
    is_completed: bool | None = None


class EventRead(EventBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime
    total_headcount: int = 0
    roster_checked_in_count: int = 0
