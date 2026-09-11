"""Security, JWT authentication, and RBAC authorization helpers."""

from collections.abc import Callable
from datetime import datetime, timedelta
from typing import Any

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.logging import get_logger
from app.database.session import get_db
from app.models.user import User

logger = get_logger("security")
settings = get_settings()

ALGORITHM = "HS256"
security_scheme = HTTPBearer(auto_error=False)


def get_jwt_secret() -> str:
    """Return active secret key for JWT signatures."""
    return settings.jwt_secret_key or settings.secret_key


def create_access_token(data: dict[str, Any], expires_delta: timedelta | None = None) -> str:
    """Create a signed JWT access token with claims and expiration."""
    to_encode = data.copy()
    now = datetime.utcnow()
    expire = now + (expires_delta or timedelta(minutes=settings.access_token_expire_minutes))
    to_encode.update({"iat": now, "exp": expire})
    return jwt.encode(to_encode, get_jwt_secret(), algorithm=ALGORITHM)


def decode_access_token(token: str) -> dict[str, Any] | None:
    """Decode and cryptographically verify a JWT access token."""
    try:
        payload = jwt.decode(token, get_jwt_secret(), algorithms=[ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        logger.warn("Token expired")
        return None
    except jwt.PyJWTError as exc:
        logger.warn(f"Invalid JWT token: {exc}")
        return None


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(security_scheme),
    db: Session = Depends(get_db),
) -> User:
    """Dependency retrieving the authenticated user from the Bearer token.

    In development mode or when testing without headers, gracefully falls back to the primary
    administrative user so existing tests and local scripts remain unbroken.
    """
    if credentials and credentials.credentials:
        token = credentials.credentials
        payload = decode_access_token(token)
        if not payload:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired authentication token.",
                headers={"WWW-Authenticate": "Bearer"},
            )

        username = payload.get("username")
        user_id = payload.get("sub")

        user: User | None = None
        if user_id:
            try:
                user = db.get(User, int(user_id))
            except (ValueError, TypeError):
                pass

        if not user and username:
            user = db.scalar(select(User).where(User.username == username))

        if not user and user_id and isinstance(user_id, str):
            user = db.scalar(select(User).where(User.username == user_id))

        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User account associated with token was not found.",
                headers={"WWW-Authenticate": "Bearer"},
            )

        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="User account is deactivated. Please contact church administration.",
            )

        return user

    # Development / Testing Fallback
    if settings.debug or settings.environment == "development":
        fallback_user = db.scalar(select(User).where(User.is_active.is_(True)).order_by(User.id))
        if fallback_user:
            return fallback_user

    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Authentication credentials were not provided.",
        headers={"WWW-Authenticate": "Bearer"},
    )


def require_role(*allowed_roles: str) -> Callable:
    """Return a dependency requiring the authenticated user to hold one of the specified roles."""

    def role_dependency(current_user: User = Depends(get_current_user)) -> User:
        # Super admin and Admin roles always bypass role restrictions
        normalized_role = (current_user.role or "").lower()
        allowed = {r.lower() for r in allowed_roles}
        if normalized_role in {"super_admin", "admin"} or normalized_role in allowed:
            return current_user

        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Operation requires one of the following roles: {', '.join(allowed_roles)}.",
        )

    return role_dependency
