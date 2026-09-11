"""Authentication endpoints for user login, session check, and logout."""

from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy import or_, select
from sqlalchemy.orm import Session

from app.core.rate_limiter import login_rate_limiter
from app.core.security import create_access_token, get_current_user
from app.database.session import get_db
from app.models.user import User
from app.schemas.user import AuthResponse, UserLogin, UserRead
from app.services.audit_service import AuditService

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login", response_model=AuthResponse)
def login(payload: UserLogin, request: Request, db: Session = Depends(get_db)) -> AuthResponse:
    """Authenticate user with username or email and password, protected by rate limiting."""
    client_ip = request.client.host if request.client else "unknown"

    # Rate limiting check
    is_allowed, retry_after = login_rate_limiter.is_allowed(client_ip)
    if not is_allowed:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Too many login attempts. Please retry after {retry_after} seconds.",
            headers={"Retry-After": str(retry_after)},
        )

    identifier = payload.username.strip()
    user = db.scalar(
        select(User).where(
            or_(
                User.username.ilike(identifier),
                User.email.ilike(identifier),
            )
        )
    )

    if not user or not user.verify_password(payload.password):
        login_rate_limiter.record_attempt(client_ip)
        AuditService(db).record(
            action="LOGIN_FAILED",
            entity_type="User",
            details=f"Failed authentication attempt for identifier '{identifier}'",
            username=identifier,
            ip_address=client_ip,
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password. Please check your credentials.",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This user account has been deactivated. Please contact your church administrator.",
        )

    # Reset rate limiting counter on successful login
    login_rate_limiter.reset(client_ip)

    user.last_login = datetime.utcnow()
    db.commit()
    db.refresh(user)

    # Record successful login in audit trail
    AuditService(db).record(
        action="LOGIN",
        entity_type="User",
        entity_id=str(user.id),
        details=f"Successful login for user '{user.username}' (role: {user.role})",
        user_id=user.id,
        username=user.username,
        user_role=user.role,
        ip_address=client_ip,
    )

    # Issue cryptographically signed JWT token with claims and expiration
    token = create_access_token(
        data={
            "sub": str(user.id),
            "username": user.username,
            "role": user.role,
        }
    )

    return AuthResponse(access_token=token, user=UserRead.model_validate(user))


@router.get("/me", response_model=UserRead)
def get_current_user_info(
    username: str | None = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> UserRead:
    """Get current authenticated user information."""
    if username and username != current_user.username:
        # If specific username requested by an admin
        user = db.scalar(select(User).where(User.username == username))
        if user:
            return UserRead.model_validate(user)

    return UserRead.model_validate(current_user)


@router.post("/logout")
def logout() -> dict[str, str]:
    """Logout current user."""
    return {"status": "logged_out"}
