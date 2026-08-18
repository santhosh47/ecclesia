"""Mass Messaging, WhatsApp, and TRAI DLT Compliance Schemas."""

from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field


class MessageTemplateCreate(BaseModel):
    name: str = Field(min_length=1, max_length=150)
    category: str = "General"
    channel: str = "WhatsApp"  # WhatsApp, SMS, Email
    subject: str | None = None
    body_text: str = Field(min_length=1)
    trai_dlt_template_id: str | None = None
    trai_dlt_entity_id: str | None = None
    trai_sender_header: str | None = "ECCLSA"
    twilio_10dlc_campaign_id: str | None = None
    is_opt_out_appended: bool = True


class MessageTemplateRead(MessageTemplateCreate):
    model_config = ConfigDict(from_attributes=True)

    id: int
    is_active: bool
    created_at: datetime


class SendBroadcastRequest(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    channel: str = "WhatsApp"  # WhatsApp, SMS, Email
    target_group: str = "All Active Members"  # All Active Members, Heads of Household, Youth, Choir, Donors
    template_id: int | None = None
    custom_message: str | None = None
    scheduled_at: datetime | None = None


class MessageLogRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    broadcast_id: int | None = None
    recipient_name: str
    recipient_contact: str
    channel: str
    rendered_message: str
    status: str
    gateway_message_id: str | None = None
    error_message: str | None = None
    sent_at: datetime


class MessageBroadcastRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    channel: str
    target_group: str
    template_id: int | None = None
    status: str
    total_recipients: int
    sent_count: int
    delivered_count: int
    failed_count: int
    sent_at: datetime
    created_at: datetime
    logs: list[MessageLogRead] = []
