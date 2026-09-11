"""Notification rules and in-app alert models for pastors and administrators."""

from datetime import datetime
from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.database.base import Base


class NotificationRule(Base):
    """Customizable automated alert rules for member absence, pastoral needs, and critical events."""

    __tablename__ = "notification_rules"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(150), unique=True, nullable=False)
    event_type: Mapped[str] = mapped_column(String(50), nullable=False)  # "member_absence", "urgent_pastoral_need", "new_visitor"
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    threshold_value: Mapped[int] = mapped_column(Integer, default=2)  # e.g., 2 consecutive missed weeks
    channels: Mapped[str] = mapped_column(String(100), default="in_app,email,whatsapp")  # comma-separated
    target_roles: Mapped[str] = mapped_column(String(100), default="pastor,admin,super_admin")  # comma-separated
    message_template: Mapped[str] = mapped_column(
        Text,
        default="Pastoral Alert: {{member_name}} has missed {{threshold_value}} consecutive services. Please reach out.",
    )
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class InAppNotification(Base):
    """Role-specific in-app notifications visible in the web app and mobile client."""

    __tablename__ = "in_app_notifications"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=True)
    target_role: Mapped[str] = mapped_column(String(50), default="pastor")  # "pastor", "admin", "super_admin"
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    notification_type: Mapped[str] = mapped_column(String(50), default="absence_alert")  # "absence_alert", "pastoral_alert", "prayer_alert"
    channels_dispatched: Mapped[str] = mapped_column(String(100), default="in_app")  # e.g. "in_app,email,whatsapp"
    is_read: Mapped[bool] = mapped_column(Boolean, default=False)
    action_url: Mapped[str | None] = mapped_column(String(255), nullable=True)  # "/members?search=Hopper"
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class DevicePushSubscription(Base):
    """Browser Web Push / PWA and mobile device push subscriptions for pastors and admins."""

    __tablename__ = "device_push_subscriptions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=True)
    target_role: Mapped[str] = mapped_column(String(50), default="pastor")  # "pastor", "admin", "super_admin"
    endpoint: Mapped[str] = mapped_column(Text, nullable=False)
    p256dh: Mapped[str | None] = mapped_column(String(255), nullable=True)
    auth: Mapped[str | None] = mapped_column(String(255), nullable=True)
    device_type: Mapped[str] = mapped_column(String(50), default="web")  # "web", "android", "ios"
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

