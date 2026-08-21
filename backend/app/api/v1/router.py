"""Master API v1 router mounting all church management modules."""

from fastapi import APIRouter

from app.api.v1.attendance import router as attendance_router
from app.api.v1.auth import router as auth_router
from app.api.v1.certificates import router as certificates_router
from app.api.v1.church_calendar import router as church_calendar_router
from app.api.v1.compliance import router as compliance_router
from app.api.v1.csv_migration import router as csv_migration_router
from app.api.v1.dashboard import router as dashboard_router
from app.api.v1.events import router as events_router
from app.api.v1.finances import router as finances_router
from app.api.v1.health import router as health_router
from app.api.v1.households import router as households_router
from app.api.v1.ledger import router as ledger_router
from app.api.v1.localization import router as localization_router
from app.api.v1.members import router as members_router
from app.api.v1.messaging import router as messaging_router
from app.api.v1.ministries import router as ministries_router
from app.api.v1.pastoral import router as pastoral_router
from app.api.v1.seed import router as seed_router
from app.api.v1.users import router as users_router

api_router = APIRouter()

# System, Auth & Health
api_router.include_router(health_router)
api_router.include_router(auth_router)
api_router.include_router(users_router)
api_router.include_router(seed_router)
api_router.include_router(localization_router)

# Core & Congregation
api_router.include_router(dashboard_router)
api_router.include_router(members_router)
api_router.include_router(households_router)
api_router.include_router(ministries_router)
api_router.include_router(csv_migration_router)

# Finance, Ledger & Compliance
api_router.include_router(finances_router)
api_router.include_router(ledger_router)
api_router.include_router(compliance_router)

# Pastoral, Life Milestones & Messaging
api_router.include_router(pastoral_router)
api_router.include_router(certificates_router)
api_router.include_router(messaging_router)

# Church Activities Calendar & Attendance
api_router.include_router(church_calendar_router)
api_router.include_router(events_router)
api_router.include_router(attendance_router)

router = api_router
