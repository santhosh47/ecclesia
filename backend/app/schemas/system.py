"""Pydantic schemas for system administration, health, and database backups."""

from pydantic import BaseModel


class BackupMetadata(BaseModel):
    """Metadata representing a compressed database backup snapshot."""

    filename: str
    size_bytes: int
    created_at: str
    path: str | None = None


class BackupListResponse(BaseModel):
    """Response containing a list of available database snapshots and total count."""

    items: list[BackupMetadata]
    total: int


class BackupCreateResponse(BaseModel):
    """Response returned upon successful creation of a database backup."""

    message: str
    backup: BackupMetadata
