"""Household schemas."""

from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field


class HouseholdBase(BaseModel):
    name: str = Field(min_length=1, max_length=150)
    address: str | None = None
    city: str | None = None
    state: str | None = None
    postal_code: str | None = None
    home_phone: str | None = None
    ward_zone: str | None = None
    landmark: str | None = None
    latitude: float | None = None
    longitude: float | None = None
    primary_contact_id: int | None = None


class HouseholdCreate(HouseholdBase):
    pass


class HouseholdUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=150)
    address: str | None = None
    city: str | None = None
    state: str | None = None
    postal_code: str | None = None
    home_phone: str | None = None
    ward_zone: str | None = None
    landmark: str | None = None
    latitude: float | None = None
    longitude: float | None = None
    primary_contact_id: int | None = None


class HouseholdMemberSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    first_name: str
    last_name: str
    household_role: str | None = None
    phone: str | None = None
    email: str | None = None
    avatar_url: str | None = None


class HouseholdRead(HouseholdBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime
    members: list[HouseholdMemberSummary] = []
