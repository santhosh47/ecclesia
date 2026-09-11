"""Pydantic schemas for customizable notification rules and in-app alerts."""

from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field


class NotificationRuleBase(BaseModel):
    name: str = Field(..., max_length=150)
    event_type: str = Field(default="member_absence", max_length=50)
    is_active: bool = True
    threshold_value: int = Field(default=2, ge=1, le=52)
    channels: str = Field(default="in_app,email,whatsapp", max_length=100)
    target_roles: str = Field(default="pastor,admin,super_admin", max_length=100)
    message_template: str = Field(
        default="Pastoral Alert: {{member_name}} has missed {{threshold_value}} consecutive services. Contact: {{phone}}.",
    )


class NotificationRuleCreate(NotificationRuleBase):
    pass


class NotificationRuleUpdate(BaseModel):
    name: str | None = None
    is_active: bool | None = None
    threshold_value: int | None = Field(default=None, ge=1, le=52)
    channels: str | None = None
    target_roles: str | None = None
    message_template: str | None = None


class NotificationRuleRead(NotificationRuleBase):
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class InAppNotificationRead(BaseModel):
    id: int
    user_id: int | None
    target_role: str
    title: str
    message: str
    notification_type: str
    channels_dispatched: str
    is_read: bool
    action_url: str | None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class EvaluateTriggersResult(BaseModel):
    status: str = "success"
    rules_evaluated: int
    absence_alerts_triggered: int
    in_app_notifications_created: int
    email_dispatched_count: int
    whatsapp_dispatched_count: int
    recipients_summary: list[str]
