"""Event API schemas."""

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class EventBase(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    starts_at: datetime
    location: str | None = Field(default=None, max_length=255)
    description: str | None = None


class EventCreate(EventBase):
    pass


class EventUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=200)
    starts_at: datetime | None = None
    location: str | None = Field(default=None, max_length=255)
    description: str | None = None


class EventRead(EventBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime
