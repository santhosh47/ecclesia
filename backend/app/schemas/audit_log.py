"""Pydantic schemas for immutable audit trail entries."""

from datetime import datetime

from pydantic import BaseModel, ConfigDict


class AuditLogRead(BaseModel):
    """Schema for serializing audit log records."""

    id: int
    timestamp: datetime
    user_id: int | None = None
    username: str
    user_role: str | None = None
    action: str
    entity_type: str
    entity_id: str | None = None
    details: str | None = None
    ip_address: str | None = None

    model_config = ConfigDict(from_attributes=True)


class AuditLogListResponse(BaseModel):
    """Schema for paginated audit log responses with total count."""

    items: list[AuditLogRead]
    total: int
