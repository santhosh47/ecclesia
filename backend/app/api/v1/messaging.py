"""Mass Messaging, WhatsApp, and TRAI DLT Compliance API Endpoints."""

from fastapi import APIRouter, BackgroundTasks, Depends, status
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.models.messaging import MessageTemplate
from app.schemas.messaging import (
    MessageBroadcastRead,
    MessageTemplateCreate,
    MessageTemplateRead,
    SendBroadcastRequest,
)
from app.services.messaging_service import MessagingService

router = APIRouter(prefix="/messaging", tags=["messaging"])


def get_messaging_service(db: Session = Depends(get_db)) -> MessagingService:
    """Dependency provider for MessagingService."""
    return MessagingService(db)


@router.get("/templates", response_model=list[MessageTemplateRead])
def list_templates(
    channel: str | None = None,
    service: MessagingService = Depends(get_messaging_service),
) -> list[MessageTemplate]:
    """List message templates for WhatsApp, SMS, and Email."""
    return service.list_templates(channel=channel)


@router.post("/templates", response_model=MessageTemplateRead, status_code=status.HTTP_201_CREATED)
def create_template(
    payload: MessageTemplateCreate,
    service: MessagingService = Depends(get_messaging_service),
) -> MessageTemplate:
    """Create a new message template with TRAI DLT / Twilio parameters."""
    return service.create_template(payload)


@router.get("/broadcasts", response_model=list[MessageBroadcastRead])
def list_broadcasts(
    service: MessagingService = Depends(get_messaging_service),
) -> list[MessageBroadcastRead]:
    """List all mass messaging broadcast campaigns."""
    return service.list_broadcasts()


@router.post("/broadcasts", response_model=MessageBroadcastRead, status_code=status.HTTP_201_CREATED)
def send_broadcast(
    payload: SendBroadcastRequest,
    background_tasks: BackgroundTasks,
    service: MessagingService = Depends(get_messaging_service),
) -> MessageBroadcastRead:
    """Execute or simulate a batch mass broadcast via WhatsApp / SMS with background processing."""
    return service.dispatch_broadcast(payload, background_tasks=background_tasks)
