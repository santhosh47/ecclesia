"""Mass Messaging, WhatsApp & SMS Templates, and Delivery Log Models."""

from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base

if TYPE_CHECKING:
    pass


class MessageTemplate(Base):
    """Customizable SMS, Email, and WhatsApp templates with placeholders and compliance IDs."""

    __tablename__ = "message_templates"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(150), unique=True, nullable=False)  # "Sunday Service Reminder", "Birthday Blessing", "Tithes 80G Acknowledgment"
    category: Mapped[str] = mapped_column(String(50), default="General")  # General, Giving, Attendance, Events, Pastoral, Compliance
    channel: Mapped[str] = mapped_column(String(30), default="WhatsApp")  # WhatsApp, SMS, Email
    subject: Mapped[str | None] = mapped_column(String(200), nullable=True)  # Email Subject
    body_text: Mapped[str] = mapped_column(Text, nullable=False)  # "Dear {{first_name}}, greetings from Ecclesia Church!..."
    
    # India TRAI DLT Compliance
    trai_dlt_template_id: Mapped[str | None] = mapped_column(String(100), nullable=True)  # e.g., "1407161234567890123"
    trai_dlt_entity_id: Mapped[str | None] = mapped_column(String(100), nullable=True)
    trai_sender_header: Mapped[str | None] = mapped_column(String(20), nullable=True)  # e.g., "ECCLSA"
    
    # Global Compliance
    twilio_10dlc_campaign_id: Mapped[str | None] = mapped_column(String(100), nullable=True)
    is_opt_out_appended: Mapped[bool] = mapped_column(Boolean, default=True)  # "Reply STOP to unsubscribe"
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class MessageBroadcast(Base):
    """A batch mass-messaging campaign sent via WhatsApp, SMS, or Email."""

    __tablename__ = "message_broadcasts"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    title: Mapped[str] = mapped_column(String(200), nullable=False)  # "Harvest Festival Sunday Announcement"
    channel: Mapped[str] = mapped_column(String(30), default="WhatsApp")  # WhatsApp, SMS, Email
    target_group: Mapped[str] = mapped_column(String(100), default="All Active Members")  # All Active Members, Heads of Household, Youth, Choir, Donors
    template_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("message_templates.id", ondelete="SET NULL"), nullable=True)
    custom_message: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(String(30), default="Completed")  # Draft, In Progress, Completed, Failed
    total_recipients: Mapped[int] = mapped_column(Integer, default=0)
    sent_count: Mapped[int] = mapped_column(Integer, default=0)
    delivered_count: Mapped[int] = mapped_column(Integer, default=0)
    failed_count: Mapped[int] = mapped_column(Integer, default=0)
    scheduled_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    sent_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    # Relationships
    logs: Mapped[list["MessageLog"]] = relationship("MessageLog", back_populates="broadcast", cascade="all, delete-orphan")


class MessageLog(Base):
    """An individual delivery log entry for an SMS / WhatsApp / Email message."""

    __tablename__ = "message_logs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    broadcast_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("message_broadcasts.id", ondelete="CASCADE"), nullable=True)
    recipient_name: Mapped[str] = mapped_column(String(150), nullable=False)
    recipient_contact: Mapped[str] = mapped_column(String(100), nullable=False)  # Phone number or email
    channel: Mapped[str] = mapped_column(String(30), default="WhatsApp")
    rendered_message: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[str] = mapped_column(String(30), default="Delivered")  # Queued, Sent, Delivered, Failed, Opted-Out
    gateway_message_id: Mapped[str | None] = mapped_column(String(150), nullable=True)  # Provider SID / WAMID
    error_message: Mapped[str | None] = mapped_column(String(255), nullable=True)
    sent_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    # Relationships
    broadcast: Mapped["MessageBroadcast | None"] = relationship("MessageBroadcast", back_populates="logs")
