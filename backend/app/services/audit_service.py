"""Audit logging service encapsulating query and recording logic for data mutations."""

from sqlalchemy import desc, func, or_, select
from sqlalchemy.orm import Session

from app.core.logging import get_logger
from app.models.audit_log import AuditLog

logger = get_logger("audit_service")


class AuditService:
    """Service providing query and recording capabilities for immutable audit records."""

    def __init__(self, db: Session) -> None:
        self.db = db

    def record(
        self,
        action: str,
        entity_type: str,
        entity_id: str | None = None,
        details: str | None = None,
        user_id: int | None = None,
        username: str | None = None,
        user_role: str | None = None,
        ip_address: str | None = None,
    ) -> AuditLog | None:
        """Create and persist an immutable audit trail entry."""
        try:
            audit_entry = AuditLog(
                action=action.upper(),
                entity_type=entity_type,
                entity_id=str(entity_id) if entity_id is not None else None,
                details=details,
                user_id=user_id,
                username=username or "system",
                user_role=user_role,
                ip_address=ip_address,
            )
            self.db.add(audit_entry)
            self.db.commit()
            self.db.refresh(audit_entry)
            logger.info(
                f"[Audit] {action.upper()} {entity_type} {entity_id or ''} by '{username or 'system'}'"
            )
            return audit_entry
        except Exception as exc:
            logger.warning(f"Failed to record audit log: {exc}")
            self.db.rollback()
            return None

    def list_logs(
        self,
        limit: int = 50,
        offset: int = 0,
        action: str | None = None,
        entity_type: str | None = None,
        search: str | None = None,
    ) -> list[AuditLog]:
        """Retrieve paginated audit logs ordered by newest first with multi-criteria filtering."""
        query = select(AuditLog)

        if action:
            query = query.where(AuditLog.action == action.upper())

        if entity_type:
            query = query.where(AuditLog.entity_type.ilike(f"%{entity_type}%"))

        if search:
            pattern = f"%{search.strip()}%"
            query = query.where(
                or_(
                    AuditLog.username.ilike(pattern),
                    AuditLog.details.ilike(pattern),
                    AuditLog.entity_id.ilike(pattern),
                    AuditLog.entity_type.ilike(pattern),
                )
            )

        query = query.order_by(desc(AuditLog.timestamp)).offset(offset).limit(limit)
        return list(self.db.scalars(query).all())

    def count_logs(
        self,
        action: str | None = None,
        entity_type: str | None = None,
        search: str | None = None,
    ) -> int:
        """Calculate total number of audit logs matching criteria."""
        query = select(func.count(AuditLog.id))

        if action:
            query = query.where(AuditLog.action == action.upper())

        if entity_type:
            query = query.where(AuditLog.entity_type.ilike(f"%{entity_type}%"))

        if search:
            pattern = f"%{search.strip()}%"
            query = query.where(
                or_(
                    AuditLog.username.ilike(pattern),
                    AuditLog.details.ilike(pattern),
                    AuditLog.entity_id.ilike(pattern),
                    AuditLog.entity_type.ilike(pattern),
                )
            )

        return self.db.scalar(query) or 0


def get_audit_service(db: Session) -> AuditService:
    """Dependency helper providing an AuditService instance for a request."""
    return AuditService(db)
