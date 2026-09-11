"""Audit logs API endpoints for administrative activity review and statutory inspection."""

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.security import get_current_user, require_role
from app.database.session import get_db
from app.models.user import User
from app.schemas.audit_log import AuditLogRead
from app.services.audit_service import AuditService, get_audit_service

router = APIRouter(prefix="/audit-logs", tags=["audit-logs"])


@router.get("", response_model=list[AuditLogRead])
def get_audit_logs(
    limit: int = Query(default=50, ge=1, le=500),
    offset: int = Query(default=0, ge=0),
    action: str | None = Query(default=None, description="Filter by action (e.g. CREATE, UPDATE, DELETE, LOGIN)"),
    entity_type: str | None = Query(default=None, description="Filter by entity (e.g. Member, Contribution, User)"),
    search: str | None = Query(default=None, description="Search across actor username, details, or entity ID"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    _: None = Depends(require_role("super_admin", "admin", "pastor", "treasurer")),
) -> list[AuditLogRead]:
    """Retrieve immutable audit trail entries with role-based access control and filtering."""
    service = get_audit_service(db)
    logs = service.list_logs(
        limit=limit,
        offset=offset,
        action=action,
        entity_type=entity_type,
        search=search,
    )
    return [AuditLogRead.model_validate(log) for log in logs]
