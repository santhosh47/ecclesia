"""Authentication endpoints for user login, session check, and logout."""

from datetime import datetime
import secrets

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import or_, select
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.models.user import User
from app.schemas.user import AuthResponse, UserLogin, UserRead

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login", response_model=AuthResponse)
def login(payload: UserLogin, db: Session = Depends(get_db)) -> AuthResponse:
    """Authenticate user with username or email and password."""
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
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password. Please check your credentials.",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This user account has been deactivated. Please contact your church administrator.",
        )

    user.last_login = datetime.utcnow()
    db.commit()
    db.refresh(user)

    token = secrets.token_urlsafe(32)
    return AuthResponse(access_token=token, user=UserRead.model_validate(user))


@router.get("/me", response_model=UserRead)
def get_current_user_info(username: str | None = None, db: Session = Depends(get_db)) -> UserRead:
    """Get current user information by username parameter or fallback to first admin."""
    if username:
        user = db.scalar(select(User).where(User.username == username))
        if user:
            return UserRead.model_validate(user)

    user = db.scalar(select(User).order_by(User.id))
    if not user:
        raise HTTPException(status_code=404, detail="No users found in database.")
    return UserRead.model_validate(user)


@router.post("/logout")
def logout() -> dict[str, str]:
    """Logout current user."""
    return {"status": "logged_out"}
