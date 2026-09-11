"""Role-specific automated alerts and notification configuration API endpoints."""

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.security import get_current_user, require_role
from app.database.session import get_db
from app.models.user import User
from app.schemas.notifications import (
    EvaluateTriggersResult,
    InAppNotificationRead,
    NotificationRuleCreate,
    NotificationRuleRead,
    NotificationRuleUpdate,
)
from app.services.alert_service import AlertNotificationService

router = APIRouter(prefix="/notifications", tags=["notifications"])

# Restrict notifications to pastors, admins, and super_admins
PASTORAL_ROLES = ["super_admin", "admin", "pastor"]


def get_alert_service(db: Session = Depends(get_db)) -> AlertNotificationService:
    """Dependency provider for AlertNotificationService."""
    return AlertNotificationService(db)


@router.get(
    "/rules",
    response_model=list[NotificationRuleRead],
    summary="List Alert Notification Rules",
)
def list_notification_rules(
    current_user: User = Depends(require_role(*PASTORAL_ROLES)),
    service: AlertNotificationService = Depends(get_alert_service),
) -> list[NotificationRuleRead]:
    """Retrieve all configurable notification rules for absences and pastoral alerts."""
    return service.list_rules()


@router.post(
    "/rules",
    response_model=NotificationRuleRead,
    status_code=status.HTTP_201_CREATED,
    summary="Create Custom Alert Rule",
)
def create_notification_rule(
    payload: NotificationRuleCreate,
    current_user: User = Depends(require_role("super_admin", "admin")),
    service: AlertNotificationService = Depends(get_alert_service),
) -> NotificationRuleRead:
    """Create a new automated alert rule with customizable threshold and channels."""
    return service.create_rule(payload)


@router.patch(
    "/rules/{rule_id}",
    response_model=NotificationRuleRead,
    summary="Update Alert Rule",
)
def update_notification_rule(
    rule_id: int,
    payload: NotificationRuleUpdate,
    current_user: User = Depends(require_role("super_admin", "admin")),
    service: AlertNotificationService = Depends(get_alert_service),
) -> NotificationRuleRead:
    """Modify threshold, channel preferences, or active status of an alert rule."""
    return service.update_rule(rule_id, payload)


@router.post(
    "/evaluate-triggers",
    response_model=EvaluateTriggersResult,
    summary="Trigger Automated Alert Evaluation",
)
def evaluate_notification_triggers(
    current_user: User = Depends(require_role(*PASTORAL_ROLES)),
    service: AlertNotificationService = Depends(get_alert_service),
) -> EvaluateTriggersResult:
    """Evaluate consecutive attendance absences and dispatch multi-channel alerts (Email, WhatsApp, In-App)."""
    return service.evaluate_triggers()


@router.get(
    "/inbox",
    response_model=list[InAppNotificationRead],
    summary="Get Pastoral & Admin In-App Notifications",
)
def get_inbox_notifications(
    limit: int = Query(default=50, ge=1, le=200),
    current_user: User = Depends(require_role(*PASTORAL_ROLES)),
    service: AlertNotificationService = Depends(get_alert_service),
) -> list[InAppNotificationRead]:
    """Fetch notifications targeted specifically to the current user's pastoral/admin role."""
    return service.get_inbox_notifications(user_role=current_user.role, user_id=current_user.id, limit=limit)


@router.post(
    "/{notification_id}/read",
    response_model=InAppNotificationRead,
    summary="Mark Notification as Read",
)
def mark_notification_read(
    notification_id: int,
    current_user: User = Depends(require_role(*PASTORAL_ROLES)),
    service: AlertNotificationService = Depends(get_alert_service),
) -> InAppNotificationRead:
    """Mark an in-app notification as read."""
    return service.mark_as_read(notification_id)


@router.post(
    "/mark-all-read",
    summary="Mark All Notifications as Read",
)
def mark_all_notifications_read(
    current_user: User = Depends(require_role(*PASTORAL_ROLES)),
    service: AlertNotificationService = Depends(get_alert_service),
) -> dict[str, int]:
    """Mark all active notifications for this role as read."""
    count = service.mark_all_read(user_role=current_user.role, user_id=current_user.id)
    return {"marked_read": count}
