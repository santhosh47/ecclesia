"""Church configuration and localization settings persistence model."""

from datetime import datetime
from typing import Any

from sqlalchemy import DateTime, Integer, JSON, String
from sqlalchemy.orm import Mapped, mapped_column

from app.database.base import Base


class ChurchSetting(Base):
    """Authoritative persistent church profile, branding, feature toggles, and RBAC roles configuration."""

    __tablename__ = "church_settings"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, default=1)
    active_mode: Mapped[str] = mapped_column(String(20), default="IN")  # "IN" or "GLOBAL"
    organization_data: Mapped[dict[str, Any]] = mapped_column(JSON, default=dict)
    modules_data: Mapped[dict[str, bool]] = mapped_column(JSON, default=dict)
    roles_data: Mapped[list[dict[str, Any]]] = mapped_column(JSON, default=list)
    in_mode_settings: Mapped[dict[str, Any]] = mapped_column(JSON, default=dict)
    global_mode_settings: Mapped[dict[str, Any]] = mapped_column(JSON, default=dict)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
