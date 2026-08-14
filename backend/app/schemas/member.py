"""Member API schemas."""

from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class MemberBase(BaseModel):
    first_name: str = Field(min_length=1, max_length=100)
    last_name: str = Field(min_length=1, max_length=100)
    email: EmailStr | None = None
    phone: str | None = Field(default=None, max_length=50)
    address: str | None = None


class MemberCreate(MemberBase):
    pass


class MemberUpdate(MemberBase):
    first_name: str | None = Field(default=None, min_length=1, max_length=100)
    last_name: str | None = Field(default=None, min_length=1, max_length=100)


class MemberRead(MemberBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime
