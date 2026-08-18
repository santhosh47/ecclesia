"""Attendance API schemas."""

from datetime import date, datetime
from pydantic import BaseModel, ConfigDict


class AttendanceRecordBase(BaseModel):
    event_id: int
    member_id: int
    status: str = "Present"  # Present, Late, Excused, Absent
    notes: str | None = None


class AttendanceRecordCreate(AttendanceRecordBase):
    pass


class AttendanceRecordRead(AttendanceRecordBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    check_in_time: datetime
    member_name: str | None = None
    event_title: str | None = None


class BulkAttendanceCheckIn(BaseModel):
    event_id: int
    member_ids: list[int]
    status: str = "Present"
    notes: str | None = None


class AbsenteeAlertItem(BaseModel):
    member_id: int
    member_name: str
    phone: str | None = None
    email: str | None = None
    avatar_url: str | None = None
    household_name: str | None = None
    status: str  # e.g., "Active"
    last_attended_date: date | None = None
    weeks_absent: int
    notes: str | None = None


class AttendanceSummary(BaseModel):
    average_sunday_attendance: int
    highest_attendance_event: str | None = None
    total_checkins_this_month: int
    absentee_alerts_count: int
    recent_records: list[AttendanceRecordRead] = []
    absentee_list: list[AbsenteeAlertItem] = []
