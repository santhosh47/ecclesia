"""User management endpoints for church administrators to manage staff and leader logins."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import or_, select
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.models.user import User
from app.schemas.user import UserCreate, UserRead, UserUpdate

router = APIRouter(prefix="/users", tags=["users"])


def get_user_or_404(user_id: int, db: Session) -> User:
    user = db.get(User, user_id)
    if user is None:
        raise HTTPException(status_code=404, detail="User account not found.")
    return user


@router.get("", response_model=list[UserRead])
def list_users(db: Session = Depends(get_db)) -> list[UserRead]:
    """List all registered system users and their assigned roles."""
    users = list(db.scalars(select(User).order_by(User.id)).all())
    return [UserRead.model_validate(u) for u in users]


@router.post("", response_model=UserRead, status_code=status.HTTP_201_CREATED)
def create_user(payload: UserCreate, db: Session = Depends(get_db)) -> UserRead:
    """Create a new staff or leader user login with an assigned role."""
    existing = db.scalar(
        select(User).where(
            or_(
                User.username.ilike(payload.username.strip()),
                User.email.ilike(payload.email.strip()),
            )
        )
    )
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A user with this username or email already exists.",
        )

    user = User(
        username=payload.username.strip().lower(),
        email=payload.email.strip().lower(),
        full_name=payload.full_name.strip(),
        hashed_password=User.hash_password(payload.password),
        role=payload.role,
        is_active=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return UserRead.model_validate(user)


@router.get("/{user_id}", response_model=UserRead)
def get_user(user_id: int, db: Session = Depends(get_db)) -> UserRead:
    """Get single user account details."""
    return UserRead.model_validate(get_user_or_404(user_id, db))


@router.patch("/{user_id}", response_model=UserRead)
def update_user(user_id: int, payload: UserUpdate, db: Session = Depends(get_db)) -> UserRead:
    """Update user profile, assigned role, active status, or reset password."""
    user = get_user_or_404(user_id, db)

    if payload.email is not None:
        user.email = payload.email.strip().lower()
    if payload.full_name is not None:
        user.full_name = payload.full_name.strip()
    if payload.role is not None:
        user.role = payload.role
    if payload.is_active is not None:
        user.is_active = payload.is_active
    if payload.password is not None and len(payload.password) >= 4:
        user.hashed_password = User.hash_password(payload.password)

    db.commit()
    db.refresh(user)
    return UserRead.model_validate(user)


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(user_id: int, db: Session = Depends(get_db)) -> None:
    """Delete a user account."""
    user = get_user_or_404(user_id, db)
    # Prevent deleting the last super_admin
    if user.role == "super_admin":
        admin_count = db.scalar(select(User).where(User.role == "super_admin"))
        if not admin_count:
            raise HTTPException(status_code=400, detail="Cannot delete the sole Super Administrator account.")

    db.delete(user)
    db.commit()
