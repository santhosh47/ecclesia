"""Pydantic schemas for authentication and user management."""

from datetime import datetime
from pydantic import BaseModel, ConfigDict, EmailStr, Field


class UserLogin(BaseModel):
    """Schema for user login credentials."""

    username: str = Field(..., description="Username or email address")
    password: str = Field(..., min_length=1, description="Account password")


class UserCreate(BaseModel):
    """Schema for creating a new user account."""

    username: str = Field(..., min_length=3, max_length=50)
    email: EmailStr
    full_name: str = Field(..., min_length=2, max_length=100)
    password: str = Field(..., min_length=4)
    role: str = Field(default="sub_admin")


class UserUpdate(BaseModel):
    """Schema for updating an existing user."""

    email: EmailStr | None = None
    full_name: str | None = None
    role: str | None = None
    is_active: bool | None = None
    password: str | None = None


class UserRead(BaseModel):
    """Public user schema returned by the API."""

    id: int
    username: str
    email: str
    full_name: str
    role: str
    is_active: bool
    created_at: datetime
    last_login: datetime | None = None

    model_config = ConfigDict(from_attributes=True)


class AuthResponse(BaseModel):
    """Response returned upon successful authentication."""

    access_token: str
    token_type: str = "bearer"
    user: UserRead
