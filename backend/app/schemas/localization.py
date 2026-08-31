"""Schemas for localization, church branding profile, feature toggles, and RBAC roles."""

from typing import Any
from pydantic import BaseModel, Field


class ChurchProfile(BaseModel):
    name: str = "Church Of Christ"
    senior_pastor: str = "Pastor Mr. John Doe"
    denomination: str = "Ecumenical"
    motto: str | None = "Worship • Community • Discipleship"
    established_year: int | None = 1985
    address: str | None = "12 Cathedral Road, Bangalore, KA 560001"
    city: str | None = "Bangalore"
    state: str | None = "KA"
    postal_code: str | None = "560001"
    country: str | None = "India"
    email: str | None = "office@ecclesia-church.org"
    phone: str | None = "+91 80 2345 6789"
    website: str | None = "https://ecclesia-church.org"
    tax_id_in_80g: str | None = "CIT(E)/BLR/80G/2024-25/AABTE1234F"
    pan_number: str | None = "AABTE1234F"
    fcra_registration_no: str | None = "094421876"
    us_ein: str | None = "12-3456789"
    uk_charity_number: str | None = "1198765"
    currency_in: str = "INR"
    currency_symbol_in: str = "₹"
    currency_global: str = "USD"
    currency_symbol_global: str = "$"


class ChurchProfileUpdate(BaseModel):
    name: str | None = None
    senior_pastor: str | None = None
    denomination: str | None = None
    motto: str | None = None
    established_year: int | None = None
    address: str | None = None
    city: str | None = None
    state: str | None = None
    postal_code: str | None = None
    country: str | None = None
    email: str | None = None
    phone: str | None = None
    website: str | None = None
    tax_id_in_80g: str | None = None
    pan_number: str | None = None
    fcra_registration_no: str | None = None
    us_ein: str | None = None
    uk_charity_number: str | None = None
    currency_in: str | None = None
    currency_symbol_in: str | None = None
    currency_global: str | None = None
    currency_symbol_global: str | None = None


class ModuleToggleRequest(BaseModel):
    module_key: str = Field(..., description="Key of the module to toggle")
    enabled: bool = Field(..., description="Target active status")


class RoleDefinition(BaseModel):
    id: str
    name: str
    description: str
    is_system: bool = False
    permissions: list[str] = []


class RoleCreate(BaseModel):
    id: str
    name: str
    description: str
    permissions: list[str] = []


class RoleUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    permissions: list[str] | None = None


class ToggleModeRequest(BaseModel):
    mode: str = Field(..., pattern="^(IN|GLOBAL)$")


class LocalizationConfigRead(BaseModel):
    active_mode: str
    organization: ChurchProfile
    modules: dict[str, bool]
    roles: list[RoleDefinition] = []
    in_mode_settings: dict[str, Any]
    global_mode_settings: dict[str, Any]
