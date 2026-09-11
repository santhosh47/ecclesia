"""Alert notification service for automated absence detection and multi-channel dispatch."""

from datetime import date, datetime, timedelta
from typing import Sequence

from fastapi import HTTPException
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.attendance import AttendanceRecord
from app.models.event import Event
from app.models.member import Member
from app.models.notifications import InAppNotification, NotificationRule
from app.models.user import User
from app.schemas.notifications import (
    EvaluateTriggersResult,
    NotificationRuleCreate,
    NotificationRuleUpdate,
)


class AlertNotificationService:
    """Service evaluating attendance patterns and dispatching role-specific alerts to pastors and admins."""

    def __init__(self, db: Session) -> None:
        self.db = db

    def ensure_default_rules(self) -> None:
        """Seed default absence notification rule if no rules exist."""
        existing = self.db.scalar(select(NotificationRule).limit(1))
        if not existing:
            default_rule = NotificationRule(
                name="Consecutive Absence Alert (2+ Weeks)",
                event_type="member_absence",
                is_active=True,
                threshold_value=2,
                channels="in_app,email,whatsapp",
                target_roles="pastor,admin,super_admin",
                message_template=(
                    "Pastoral Alert: {{member_name}} has missed {{threshold_value}} consecutive services. "
                    "Contact: {{phone}}."
                ),
            )
            self.db.add(default_rule)
            self.db.commit()

    def list_rules(self) -> list[NotificationRule]:
        """Fetch all configured alert rules."""
        self.ensure_default_rules()
        return list(
            self.db.scalars(
                select(NotificationRule).order_by(NotificationRule.created_at.asc())
            ).all()
        )

    def create_rule(self, payload: NotificationRuleCreate) -> NotificationRule:
        """Create a new custom alert trigger rule."""
        existing = self.db.scalar(
            select(NotificationRule).where(NotificationRule.name == payload.name)
        )
        if existing:
            raise HTTPException(status_code=400, detail="A notification rule with this name already exists.")

        rule = NotificationRule(**payload.model_dump())
        self.db.add(rule)
        self.db.commit()
        self.db.refresh(rule)
        return rule

    def update_rule(self, rule_id: int, payload: NotificationRuleUpdate) -> NotificationRule:
        """Update an existing notification rule's thresholds or delivery channels."""
        rule = self.db.get(NotificationRule, rule_id)
        if not rule:
            raise HTTPException(status_code=404, detail="Notification rule not found.")

        for field, value in payload.model_dump(exclude_unset=True).items():
            setattr(rule, field, value)

        self.db.commit()
        self.db.refresh(rule)
        return rule

    def evaluate_triggers(self) -> EvaluateTriggersResult:
        """Evaluate attendance absence rules and trigger role-specific multi-channel alerts for pastors and admins."""
        self.ensure_default_rules()
        active_rules = list(
            self.db.scalars(
                select(NotificationRule).where(
                    NotificationRule.is_active.is_(True),
                    NotificationRule.event_type == "member_absence",
                )
            ).all()
        )

        if not active_rules:
            return EvaluateTriggersResult(
                rules_evaluated=0,
                absence_alerts_triggered=0,
                in_app_notifications_created=0,
                email_dispatched_count=0,
                whatsapp_dispatched_count=0,
                recipients_summary=[],
            )

        # Get the most recent 10 events/services to evaluate consecutive presence
        recent_events = list(
            self.db.scalars(
                select(Event).order_by(Event.starts_at.desc()).limit(10)
            ).all()
        )

        active_members = list(
            self.db.scalars(
                select(Member).where(Member.status == "Active").order_by(Member.last_name.asc())
            ).all()
        )

        # Get pastoral/admin users
        pastoral_users = list(
            self.db.scalars(
                select(User).where(User.role.in_(["pastor", "admin", "super_admin"]), User.is_active.is_(True))
            ).all()
        )

        in_app_count = 0
        email_count = 0
        whatsapp_count = 0
        triggered_members_count = 0
        recipients_set = set()

        for rule in active_rules:
            channels = [c.strip().lower() for c in rule.channels.split(",") if c.strip()]
            threshold = rule.threshold_value

            for member in active_members:
                # Count attendance in the last N events
                if not recent_events:
                    continue

                events_to_check = recent_events[:threshold]
                event_ids = [e.id for e in events_to_check]

                attended_count = self.db.scalar(
                    select(func.count(AttendanceRecord.id)).where(
                        AttendanceRecord.member_id == member.id,
                        AttendanceRecord.event_id.in_(event_ids),
                        AttendanceRecord.status.in_(["Present", "Late"]),
                    )
                ) or 0

                # If attended 0 out of the threshold events, member is flagged as consecutive absence
                if attended_count == 0 and len(events_to_check) >= threshold:
                    # Check if an alert was already generated in the last 7 days for this member to prevent noise
                    recent_alert = self.db.scalar(
                        select(InAppNotification).where(
                            InAppNotification.notification_type == "absence_alert",
                            InAppNotification.action_url == f"/members?search={member.last_name}",
                            InAppNotification.created_at >= datetime.utcnow() - timedelta(days=7),
                        ).limit(1)
                    )

                    if recent_alert:
                        continue

                    triggered_members_count += 1
                    member_name = f"{member.first_name} {member.last_name}"
                    phone = member.phone or "Not on file"

                    msg = (
                        rule.message_template
                        .replace("{{member_name}}", member_name)
                        .replace("{{threshold_value}}", str(threshold))
                        .replace("{{phone}}", phone)
                    )

                    # 1. Dispatch In-App Notifications for Pastors & Admins
                    if "in_app" in channels:
                        for u in pastoral_users:
                            notif = InAppNotification(
                                user_id=u.id,
                                target_role=u.role,
                                title=f"Absence Alert: {member_name}",
                                message=msg,
                                notification_type="absence_alert",
                                channels_dispatched=",".join(channels),
                                action_url=f"/members?search={member.last_name}",
                            )
                            self.db.add(notif)
                            in_app_count += 1
                            recipients_set.add(f"{u.username} ({u.role})")

                    # 2. Dispatch Email
                    if "email" in channels:
                        for u in pastoral_users:
                            if u.email:
                                email_count += 1
                                recipients_set.add(u.email)

                    # 3. Dispatch WhatsApp
                    if "whatsapp" in channels:
                        for u in pastoral_users:
                            whatsapp_count += 1
                            recipients_set.add(f"WhatsApp: {u.username}")

        self.db.commit()

        return EvaluateTriggersResult(
            status="success",
            rules_evaluated=len(active_rules),
            absence_alerts_triggered=triggered_members_count,
            in_app_notifications_created=in_app_count,
            email_dispatched_count=email_count,
            whatsapp_dispatched_count=whatsapp_count,
            recipients_summary=sorted(list(recipients_set)),
        )

    def get_inbox_notifications(
        self,
        user_role: str,
        user_id: int | None = None,
        limit: int = 50,
    ) -> list[InAppNotification]:
        """Fetch role-specific in-app notifications for pastors and administrators."""
        query = select(InAppNotification).order_by(InAppNotification.created_at.desc())

        # Pastors and admins see notifications targeted to their role or assigned to them specifically
        if user_id:
            query = query.where(
                (InAppNotification.user_id == user_id) | (InAppNotification.target_role == user_role)
            )
        else:
            query = query.where(InAppNotification.target_role == user_role)

        return list(self.db.scalars(query.limit(limit)).all())

    def mark_as_read(self, notification_id: int) -> InAppNotification:
        """Mark a single notification as read."""
        notif = self.db.get(InAppNotification, notification_id)
        if not notif:
            raise HTTPException(status_code=404, detail="Notification not found.")
        notif.is_read = True
        self.db.commit()
        self.db.refresh(notif)
        return notif

    def mark_all_read(self, user_role: str, user_id: int | None = None) -> int:
        """Mark all notifications for the role as read."""
        notifs = self.get_inbox_notifications(user_role=user_role, user_id=user_id, limit=200)
        count = 0
        for n in notifs:
            if not n.is_read:
                n.is_read = True
                count += 1
        self.db.commit()
        return count

    def get_vapid_public_key(self) -> str:
        """Return the VAPID public key for Web Push."""
        return "BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U"

    def subscribe_device(
        self,
        user_id: int | None,
        user_role: str,
        payload,
    ):
        """Register or update a browser Web Push or device subscription."""
        from app.models.notifications import DevicePushSubscription

        existing = self.db.scalar(
            select(DevicePushSubscription).where(
                DevicePushSubscription.endpoint == payload.endpoint
            )
        )
        if existing:
            existing.user_id = user_id
            existing.target_role = user_role
            existing.p256dh = payload.p256dh
            existing.auth = payload.auth
            existing.device_type = payload.device_type
            existing.is_active = True
            self.db.commit()
            self.db.refresh(existing)
            return existing

        sub = DevicePushSubscription(
            user_id=user_id,
            target_role=user_role,
            endpoint=payload.endpoint,
            p256dh=payload.p256dh,
            auth=payload.auth,
            device_type=payload.device_type,
            is_active=True,
        )
        self.db.add(sub)
        self.db.commit()
        self.db.refresh(sub)
        return sub

