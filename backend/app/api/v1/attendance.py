import csv
import io
from datetime import date, datetime, timedelta
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session, joinedload

from app.database.session import get_db
from app.models.attendance import AttendanceRecord
from app.models.event import Event
from app.models.member import Member
from app.schemas.attendance import (
    AbsenteeAlertItem,
    AttendanceRecordCreate,
    AttendanceRecordRead,
    AttendanceSummary,
    BulkAttendanceCheckIn,
)

router = APIRouter(prefix="/attendance", tags=["attendance"])


def _calculate_event_total_attendance(e: Event) -> int:
    """Standardized event attendance calculation avoiding double counting."""
    roster_present = len([r for r in e.attendance_records if r.status in ("Present", "Late")])
    physical_headcount = (e.headcount_adults or 0) + (e.headcount_children or 0)
    physical_total = max(physical_headcount, roster_present)
    return physical_total + (e.headcount_online or 0)


def _format_record(r: AttendanceRecord) -> AttendanceRecordRead:
    member_name = f"{r.member.first_name} {r.member.last_name}" if r.member else None
    event_title = r.event.title if r.event else None
    return AttendanceRecordRead(
        id=r.id,
        event_id=r.event_id,
        member_id=r.member_id,
        status=r.status,
        notes=r.notes,
        check_in_time=r.check_in_time,
        member_name=member_name,
        event_title=event_title,
    )


@router.get("", response_model=list[AttendanceRecordRead])
def list_attendance_records(
    event_id: int | None = None,
    member_id: int | None = None,
    status: str | None = None,
    limit: int = Query(default=100, ge=1, le=500),
    db: Session = Depends(get_db),
) -> list[AttendanceRecordRead]:
    query = (
        select(AttendanceRecord)
        .options(joinedload(AttendanceRecord.member), joinedload(AttendanceRecord.event))
        .order_by(AttendanceRecord.check_in_time.desc())
    )

    if event_id is not None:
        query = query.where(AttendanceRecord.event_id == event_id)
    if member_id is not None:
        query = query.where(AttendanceRecord.member_id == member_id)
    if status:
        query = query.where(AttendanceRecord.status == status)

    records = list(db.scalars(query.limit(limit)).unique())
    return [_format_record(r) for r in records]


@router.get("/csv/export")
def export_attendance_records_to_csv(
    event_id: int | None = None,
    member_id: int | None = None,
    status: str | None = None,
    db: Session = Depends(get_db),
) -> Response:
    """Export attendance records to CSV."""
    query = (
        select(AttendanceRecord)
        .options(joinedload(AttendanceRecord.member), joinedload(AttendanceRecord.event))
        .order_by(AttendanceRecord.check_in_time.desc())
    )

    if event_id is not None:
        query = query.where(AttendanceRecord.event_id == event_id)
    if member_id is not None:
        query = query.where(AttendanceRecord.member_id == member_id)
    if status:
        query = query.where(AttendanceRecord.status == status)

    records = list(db.scalars(query).unique())
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "Record ID",
        "Event ID",
        "Event Title",
        "Check-In Date",
        "Check-In Time",
        "Member ID",
        "Member Name",
        "Status",
        "Notes",
    ])

    for r in records:
        writer.writerow([
            r.id,
            r.event_id,
            r.event.title if r.event else "",
            r.check_in_time.strftime("%Y-%m-%d") if r.check_in_time else "",
            r.check_in_time.strftime("%H:%M:%S") if r.check_in_time else "",
            r.member_id,
            f"{r.member.first_name} {r.member.last_name}" if r.member else "",
            r.status,
            r.notes or "",
        ])

    csv_data = output.getvalue().encode("utf-8-sig")
    filename = f"attendance_records_export_{date.today().strftime('%Y%m%d')}.csv"
    return Response(
        content=csv_data,
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.post("/check-in", response_model=AttendanceRecordRead, status_code=status.HTTP_201_CREATED)
def check_in_member(payload: AttendanceRecordCreate, db: Session = Depends(get_db)) -> AttendanceRecordRead:
    event = db.get(Event, payload.event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    member = db.get(Member, payload.member_id)
    if not member:
        raise HTTPException(status_code=404, detail="Member not found")

    existing = db.scalar(
        select(AttendanceRecord).where(
            AttendanceRecord.event_id == payload.event_id,
            AttendanceRecord.member_id == payload.member_id,
        )
    )
    if existing:
        existing.status = payload.status
        existing.notes = payload.notes
        existing.check_in_time = datetime.utcnow()
        db.commit()
        db.refresh(existing)
        reloaded = db.scalar(
            select(AttendanceRecord)
            .options(joinedload(AttendanceRecord.member), joinedload(AttendanceRecord.event))
            .where(AttendanceRecord.id == existing.id)
        )
        return _format_record(reloaded or existing)

    record = AttendanceRecord(**payload.model_dump())
    db.add(record)
    db.commit()
    db.refresh(record)

    reloaded = db.scalar(
        select(AttendanceRecord)
        .options(joinedload(AttendanceRecord.member), joinedload(AttendanceRecord.event))
        .where(AttendanceRecord.id == record.id)
    )
    return _format_record(reloaded or record)


@router.post("/bulk-check-in", status_code=status.HTTP_200_OK)
def bulk_check_in(payload: BulkAttendanceCheckIn, db: Session = Depends(get_db)) -> dict[str, Any]:
    event = db.get(Event, payload.event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    checked_in_count = 0
    for mid in payload.member_ids:
        existing = db.scalar(
            select(AttendanceRecord).where(
                AttendanceRecord.event_id == payload.event_id,
                AttendanceRecord.member_id == mid,
            )
        )
        if existing:
            existing.status = payload.status
            existing.notes = payload.notes
        else:
            db.add(
                AttendanceRecord(
                    event_id=payload.event_id,
                    member_id=mid,
                    status=payload.status,
                    notes=payload.notes,
                )
            )
        checked_in_count += 1

    db.commit()
    return {"message": f"Successfully checked in {checked_in_count} members", "count": checked_in_count}


@router.delete("/{record_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_attendance_record(record_id: int, db: Session = Depends(get_db)) -> None:
    record = db.get(AttendanceRecord, record_id)
    if not record:
        raise HTTPException(status_code=404, detail="Attendance record not found")
    db.delete(record)
    db.commit()


@router.get("/absentee-alerts", response_model=list[AbsenteeAlertItem])
def get_absentee_alerts(
    weeks_threshold: int = Query(default=3, ge=1, le=52),
    db: Session = Depends(get_db),
) -> list[AbsenteeAlertItem]:
    """Flag active members who have not attended any church event in >= weeks_threshold (default: 3 weeks)."""
    today = date.today()
    threshold_date = today - timedelta(weeks=weeks_threshold)

    members = list(
        db.scalars(
            select(Member)
            .options(joinedload(Member.household))
            .where(Member.status.in_(["Active", "Regular Attendee"]))
        ).unique()
    )

    alerts: list[AbsenteeAlertItem] = []

    for member in members:
        latest_record = db.scalar(
            select(AttendanceRecord)
            .where(
                AttendanceRecord.member_id == member.id,
                AttendanceRecord.status.in_(["Present", "Late"]),
            )
            .order_by(AttendanceRecord.check_in_time.desc())
            .limit(1)
        )

        last_date = latest_record.check_in_time.date() if latest_record else None
        
        if last_date is None:
            member_joined = member.joined_date or member.created_at.date()
            if member_joined <= threshold_date:
                weeks_absent = max(weeks_threshold, (today - member_joined).days // 7)
                alerts.append(
                    AbsenteeAlertItem(
                        member_id=member.id,
                        member_name=f"{member.first_name} {member.last_name}",
                        phone=member.phone,
                        email=member.email,
                        avatar_url=member.avatar_url,
                        household_name=member.household.name if member.household else None,
                        status=member.status,
                        last_attended_date=None,
                        weeks_absent=weeks_absent,
                        notes="No recorded attendance on file",
                    )
                )
        elif last_date < threshold_date:
            weeks_absent = (today - last_date).days // 7
            alerts.append(
                AbsenteeAlertItem(
                    member_id=member.id,
                    member_name=f"{member.first_name} {member.last_name}",
                    phone=member.phone,
                    email=member.email,
                    avatar_url=member.avatar_url,
                    household_name=member.household.name if member.household else None,
                    status=member.status,
                    last_attended_date=last_date,
                    weeks_absent=weeks_absent,
                    notes=f"Absent for {weeks_absent} weeks since {last_date.strftime('%b %d, %Y')}",
                )
            )

    alerts.sort(key=lambda a: a.weeks_absent, reverse=True)
    return alerts


@router.get("/summary", response_model=AttendanceSummary)
def get_attendance_summary(db: Session = Depends(get_db)) -> AttendanceSummary:
    today = date.today()
    month_start = date(today.year, today.month, 1)

    # Average Sunday Attendance (last 8 Sunday services)
    sunday_events = list(
        db.scalars(
            select(Event)
            .options(joinedload(Event.attendance_records))
            .where(
                (Event.event_type.ilike("%Sunday%")) |
                (Event.event_type.ilike("%Worship%")) |
                (Event.title.ilike("%Sunday%"))
            )
            .order_by(Event.starts_at.desc())
            .limit(8)
        ).unique()
    )

    avg_att = 0
    if sunday_events:
        total_counts = [_calculate_event_total_attendance(e) for e in sunday_events]
        avg_att = sum(total_counts) // len(total_counts) if total_counts else 0

    month_checkins = db.scalar(
        select(func.count(AttendanceRecord.id)).where(AttendanceRecord.check_in_time >= month_start)
    ) or 0

    absentee_list = get_absentee_alerts(weeks_threshold=3, db=db)

    recent_records = list(
        db.scalars(
            select(AttendanceRecord)
            .options(joinedload(AttendanceRecord.member), joinedload(AttendanceRecord.event))
            .order_by(AttendanceRecord.check_in_time.desc())
            .limit(5)
        ).unique()
    )

    return AttendanceSummary(
        average_sunday_attendance=avg_att,
        highest_attendance_event=sunday_events[0].title if sunday_events else None,
        total_checkins_this_month=int(month_checkins),
        absentee_alerts_count=len(absentee_list),
        recent_records=[_format_record(r) for r in recent_records],
        absentee_list=absentee_list[:10],
    )
