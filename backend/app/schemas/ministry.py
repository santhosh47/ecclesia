"""Ministry and small group schemas."""

from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field


class MemberMinistryLink(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    member_id: int
    role: str = "Member"
    first_name: str | None = None
    last_name: str | None = None
    avatar_url: str | None = None


class MinistryBase(BaseModel):
    name: str = Field(min_length=1, max_length=150)
    category: str = "Ministry"
    description: str | None = None
    meeting_time: str | None = None
    meeting_location: str | None = None
    leader_id: int | None = None


class MinistryCreate(MinistryBase):
    pass


class MinistryUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=150)
    category: str | None = None
    description: str | None = None
    meeting_time: str | None = None
    meeting_location: str | None = None
    leader_id: int | None = None


class MinistryRead(MinistryBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime
    member_count: int = 0
    leader_name: str | None = None


class MinistryDetail(MinistryRead):
    members: list[MemberMinistryLink] = []
