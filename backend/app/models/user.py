"""User model for multi-user role-based authentication and access control."""

from datetime import datetime
import hashlib
import secrets

from sqlalchemy import Boolean, DateTime, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.database.base import Base


class User(Base):
    """A user account with authentication credentials and an assigned RBAC role."""

    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    username: Mapped[str] = mapped_column(String(50), unique=True, nullable=False, index=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    full_name: Mapped[str] = mapped_column(String(100), nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[str] = mapped_column(String(50), nullable=False, default="sub_admin")
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    last_login: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    @classmethod
    def hash_password(cls, password: str) -> str:
        """Hash a plaintext password with a unique salt using PBKDF2."""
        salt = secrets.token_hex(16)
        key = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt.encode("utf-8"), 100000)
        return f"{salt}${key.hex()}"

    def verify_password(self, password: str) -> bool:
        """Verify password against stored salt and PBKDF2 hash."""
        try:
            salt, key_hex = self.hashed_password.split("$", 1)
            key = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt.encode("utf-8"), 100000)
            return secrets.compare_digest(key.hex(), key_hex)
        except Exception:
            return False
