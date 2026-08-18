"""Executive dashboard analytics endpoint."""

from datetime import date

from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.api.v1.attendance import get_absentee_alerts
from app.api.v1.finances import get_finance_summary
from app.api.v1.members import get_upcoming_milestones
from app.api.v1.pastoral import list_prayer_requests, list_visitor_follow_ups
from app.database.session import get_db
from app.models.event import Event
from app.models.household import Household
from app.models.member import Member
from app.models.ministry import Ministry
from app.schemas.dashboard import DashboardData, DashboardKPICards

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/stats", response_model=DashboardData)
def get_dashboard_stats(db: Session = Depends(get_db)) -> DashboardData:
    today = date.today()

    # Member & Household metrics
    total_members = db.scalar(select(func.count(Member.id))) or 0
    active_members = db.scalar(select(func.count(Member.id)).where(Member.status == "Active")) or 0
    total_households = db.scalar(select(func.count(Household.id))) or 0
    total_ministries = db.scalar(select(func.count(Ministry.id))) or 0

    # Finance summary
    finance_summary = get_finance_summary(db=db)

    # Attendance average
    sunday_events = list(
        db.scalars(
            select(Event).where(Event.event_type.ilike("%Sunday%")).order_by(Event.starts_at.desc()).limit(6)
        )
    )
    avg_att = 0
    if sunday_events:
        counts = [e.headcount_adults + e.headcount_children for e in sunday_events]
        avg_att = sum(counts) // len(counts) if counts else 0

    # Upcoming milestones (next 30 days)
    milestones = get_upcoming_milestones(days=30, db=db)

    # Absentee alerts
    absentee_alerts = get_absentee_alerts(weeks_threshold=3, db=db)

    # Active prayers & pending visitors
    active_prayers = list_prayer_requests(status="Active", db=db)
    pending_visitors = list_visitor_follow_ups(status="New Visitor", db=db)

    kpi_cards = DashboardKPICards(
        total_members=int(total_members),
        active_members=int(active_members),
        total_households=int(total_households),
        total_ministries=int(total_ministries),
        ytd_contributions=finance_summary.total_income_ytd,
        ytd_expenses=finance_summary.total_expense_ytd,
        net_operating_cash=finance_summary.net_operating_balance,
        avg_sunday_attendance=avg_att,
        upcoming_milestones_count=len(milestones),
        absentee_alerts_count=len(absentee_alerts),
        active_prayer_requests_count=len(active_prayers),
        pending_visitors_count=len(pending_visitors),
    )

    return DashboardData(
        kpis=kpi_cards,
        upcoming_milestones=milestones[:8],
        absentee_alerts=absentee_alerts[:6],
        recent_contributions=finance_summary.recent_contributions,
        monthly_finance_trends=finance_summary.monthly_trends,
        active_prayer_requests=active_prayers[:5],
        pending_visitors=pending_visitors[:5],
    )
