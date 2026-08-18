"""CSV Migration Schemas for ChurchCRM / Excel import and export."""

from pydantic import BaseModel


class CsvImportResult(BaseModel):
    success: bool
    imported_members_count: int
    imported_households_count: int
    skipped_count: int
    errors: list[str] = []
    sample_records: list[str] = []
