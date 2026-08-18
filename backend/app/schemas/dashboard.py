"""Executive dashboard aggregated schemas."""

from pydantic import BaseModel

from app.schemas.attendance import AbsenteeAlertItem, AttendanceRecordRead
from app.schemas.finance import ContributionRead, MonthlyFinanceData
from app.schemas.member import MilestoneItem
from app.schemas.pastoral import PrayerRequestRead, VisitorFollowUpRead


class DashboardKPICards(BaseModel):
    total_members: int
    active_members: int
    total_households: int
    total_ministries: int
    ytd_contributions: float
    ytd_expenses: float
    net_operating_cash: float
    avg_sunday_attendance: int
    upcoming_milestones_count: int
    absentee_alerts_count: int
    active_prayer_requests_count: int
    pending_visitors_count: int


class DashboardData(BaseModel):
    kpis: DashboardKPICards
    upcoming_milestones: list[MilestoneItem] = []
    absentee_alerts: list[AbsenteeAlertItem] = []
    recent_contributions: list[ContributionRead] = []
    monthly_finance_trends: list[MonthlyFinanceData] = []
    active_prayer_requests: list[PrayerRequestRead] = []
    pending_visitors: list[VisitorFollowUpRead] = []
