"""Mass Messaging, WhatsApp, and TRAI DLT Compliance API Endpoints."""

import uuid
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import desc, func, select
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.models.member import Member
from app.models.messaging import MessageBroadcast, MessageLog, MessageTemplate
from app.schemas.messaging import (
    MessageBroadcastRead,
    MessageLogRead,
    MessageTemplateCreate,
    MessageTemplateRead,
    SendBroadcastRequest,
)

router = APIRouter(prefix="/messaging", tags=["messaging"])


@router.get("/templates", response_model=list[MessageTemplateRead])
def list_templates(channel: str | None = None, db: Session = Depends(get_db)) -> list[MessageTemplate]:
    """List message templates for WhatsApp, SMS, and Email."""
    query = select(MessageTemplate).where(MessageTemplate.is_active.is_(True))
    if channel:
        query = query.where(MessageTemplate.channel == channel)
    return list(db.scalars(query.order_by(MessageTemplate.category.asc(), MessageTemplate.name.asc())).all())


@router.post("/templates", response_model=MessageTemplateRead, status_code=status.HTTP_201_CREATED)
def create_template(payload: MessageTemplateCreate, db: Session = Depends(get_db)) -> MessageTemplate:
    """Create a new message template with TRAI DLT / Twilio parameters."""
    existing = db.scalar(select(MessageTemplate).where(MessageTemplate.name == payload.name))
    if existing:
        raise HTTPException(status_code=400, detail="Template with this name already exists.")
    tmpl = MessageTemplate(**payload.model_dump())
    db.add(tmpl)
    db.commit()
    db.refresh(tmpl)
    return tmpl


@router.get("/broadcasts", response_model=list[MessageBroadcastRead])
def list_broadcasts(db: Session = Depends(get_db)) -> list[MessageBroadcastRead]:
    """List all mass messaging broadcast campaigns."""
    broadcasts = db.scalars(select(MessageBroadcast).order_by(MessageBroadcast.sent_at.desc())).all()
    results = []
    for b in broadcasts:
        logs_read = [
            MessageLogRead(
                id=l.id,
                broadcast_id=l.broadcast_id,
                recipient_name=l.recipient_name,
                recipient_contact=l.recipient_contact,
                channel=l.channel,
                rendered_message=l.rendered_message,
                status=l.status,
                gateway_message_id=l.gateway_message_id,
                error_message=l.error_message,
                sent_at=l.sent_at,
            )
            for l in b.logs
        ]
        results.append(
            MessageBroadcastRead(
                id=b.id,
                title=b.title,
                channel=b.channel,
                target_group=b.target_group,
                template_id=b.template_id,
                status=b.status,
                total_recipients=b.total_recipients,
                sent_count=b.sent_count,
                delivered_count=b.delivered_count,
                failed_count=b.failed_count,
                sent_at=b.sent_at,
                created_at=b.created_at,
                logs=logs_read,
            )
        )
    return results


@router.post("/broadcasts", response_model=MessageBroadcastRead, status_code=status.HTTP_201_CREATED)
def send_broadcast(payload: SendBroadcastRequest, db: Session = Depends(get_db)) -> MessageBroadcastRead:
    """Execute or simulate a batch mass broadcast via WhatsApp / SMS."""
    # Find matching members based on target group
    query = select(Member).where(Member.status == "Active")
    if payload.channel in {"WhatsApp", "SMS"}:
        query = query.where(Member.phone.is_not(None))
    if payload.target_group == "Heads of Household":
        query = query.where(Member.household_role == "Head")
    elif payload.target_group == "Youth":
        query = query.where(Member.member_type == "Youth")

    members = db.scalars(query).all()
    if not members:
        # Fallback to all active members
        members = db.scalars(select(Member).where(Member.status == "Active")).all()

    # Template resolution
    body_text = payload.custom_message or "Greetings from Ecclesia Church!"
    if payload.template_id:
        tmpl = db.get(MessageTemplate, payload.template_id)
        if tmpl:
            body_text = tmpl.body_text

    broadcast = MessageBroadcast(
        title=payload.title,
        channel=payload.channel,
        target_group=payload.target_group,
        template_id=payload.template_id,
        custom_message=payload.custom_message,
        status="Completed",
        total_recipients=len(members),
        sent_count=len(members),
        delivered_count=len(members),
        failed_count=0,
        sent_at=datetime.utcnow(),
    )
    db.add(broadcast)
    db.flush()

    logs_read = []
    for m in members:
        # Render template tags
        rendered = body_text.replace("{{first_name}}", m.first_name).replace("{{last_name}}", m.last_name)
        contact = m.phone if payload.channel in {"WhatsApp", "SMS"} and m.phone else (m.email or "No Contact")
        
        # Check GDPR opt out
        status_val = "Opted-Out" if m.gdpr_opt_out else "Delivered"
        gw_id = f"wamid.{uuid.uuid4().hex[:16]}" if payload.channel == "WhatsApp" else f"SM{uuid.uuid4().hex[:14]}"

        log = MessageLog(
            broadcast_id=broadcast.id,
            recipient_name=f"{m.first_name} {m.last_name}",
            recipient_contact=contact,
            channel=payload.channel,
            rendered_message=rendered,
            status=status_val,
            gateway_message_id=gw_id,
            sent_at=datetime.utcnow(),
        )
        db.add(log)
        logs_read.append(
            MessageLogRead(
                id=0,
                broadcast_id=broadcast.id,
                recipient_name=f"{m.first_name} {m.last_name}",
                recipient_contact=contact,
                channel=payload.channel,
                rendered_message=rendered,
                status=status_val,
                gateway_message_id=gw_id,
                error_message=None,
                sent_at=datetime.utcnow(),
            )
        )

    db.commit()
    db.refresh(broadcast)

    return MessageBroadcastRead(
        id=broadcast.id,
        title=broadcast.title,
        channel=broadcast.channel,
        target_group=broadcast.target_group,
        template_id=broadcast.template_id,
        status=broadcast.status,
        total_recipients=broadcast.total_recipients,
        sent_count=broadcast.sent_count,
        delivered_count=broadcast.delivered_count,
        failed_count=broadcast.failed_count,
        sent_at=broadcast.sent_at,
        created_at=broadcast.created_at,
        logs=logs_read,
    )
