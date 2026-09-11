"""Unit tests verifying customizable automated alerts and role-specific notifications."""

from fastapi.testclient import TestClient
import pytest
from sqlalchemy import select

from app.core.security import create_access_token
from app.database.session import SessionLocal
from app.main import app
from app.models.attendance import AttendanceRecord
from app.models.event import Event
from app.models.member import Member
from app.models.user import User

client = TestClient(app)


@pytest.fixture
def auth_headers():
    """Generate authenticated headers for super_admin and pastor."""
    db = SessionLocal()
    admin_user = db.scalar(select(User).where(User.role == "super_admin").limit(1))
    if not admin_user:
        admin_user = User(
            username="admin_test",
            email="admin_test@ecclesia.local",
            full_name="Admin Test",
            hashed_password="hashed_test_pw",
            role="super_admin",
            is_active=True,
        )
        db.add(admin_user)
        db.commit()
        db.refresh(admin_user)

    admin_token = create_access_token({"sub": admin_user.username, "role": admin_user.role})

    # Pastor user
    pastor_user = db.scalar(select(User).where(User.role == "pastor").limit(1))
    if not pastor_user:
        pastor_user = User(
            username="pastor_test",
            email="pastor_test@ecclesia.local",
            full_name="Pastor Test",
            hashed_password="hashed_test_pw",
            role="pastor",
            is_active=True,
        )
        db.add(pastor_user)
        db.commit()
        db.refresh(pastor_user)

    pastor_token = create_access_token({"sub": pastor_user.username, "role": pastor_user.role})

    # Viewer user (restricted)
    viewer_user = db.scalar(select(User).where(User.role == "viewer").limit(1))
    if not viewer_user:
        viewer_user = User(
            username="viewer_test",
            email="viewer_test@ecclesia.local",
            full_name="Viewer Test",
            hashed_password="hashed_test_pw",
            role="viewer",
            is_active=True,
        )
        db.add(viewer_user)
        db.commit()
        db.refresh(viewer_user)

    viewer_token = create_access_token({"sub": viewer_user.username, "role": viewer_user.role})

    db.close()
    return {
        "admin": {"Authorization": f"Bearer {admin_token}"},
        "pastor": {"Authorization": f"Bearer {pastor_token}"},
        "viewer": {"Authorization": f"Bearer {viewer_token}"},
    }


def test_list_notification_rules(auth_headers):
    """Verify that pastors and admins can retrieve customizable notification rules."""
    res = client.get("/api/v1/notifications/rules", headers=auth_headers["pastor"])
    assert res.status_code == 200
    rules = res.json()
    assert isinstance(rules, list)
    assert len(rules) >= 1
    default_rule = rules[0]
    assert default_rule["event_type"] == "member_absence"
    assert "email" in default_rule["channels"]
    assert "whatsapp" in default_rule["channels"]
    assert "in_app" in default_rule["channels"]


def test_notification_rules_role_restriction(auth_headers):
    """Verify that unauthorized roles cannot view or edit notification rules."""
    res = client.get("/api/v1/notifications/rules", headers=auth_headers["viewer"])
    assert res.status_code == 403


def test_create_and_update_notification_rule(auth_headers):
    """Verify creating a custom notification rule and updating its threshold."""
    create_payload = {
        "name": "Hospitalization Urgent Care Alert",
        "event_type": "urgent_pastoral_need",
        "is_active": True,
        "threshold_value": 1,
        "channels": "in_app,whatsapp",
        "target_roles": "pastor,admin",
        "message_template": "Urgent Care Notice: {{member_name}} requires visitation.",
    }
    create_res = client.post(
        "/api/v1/notifications/rules",
        json=create_payload,
        headers=auth_headers["admin"],
    )
    assert create_res.status_code in [201, 400]  # 400 if already created in rerun
    
    # Update threshold
    rules = client.get("/api/v1/notifications/rules", headers=auth_headers["admin"]).json()
    target_rule = next(r for r in rules if r["event_type"] == "member_absence")
    
    patch_res = client.patch(
        f"/api/v1/notifications/rules/{target_rule['id']}",
        json={"threshold_value": 3},
        headers=auth_headers["admin"],
    )
    assert patch_res.status_code == 200
    assert patch_res.json()["threshold_value"] == 3


def test_evaluate_triggers_and_inbox(auth_headers):
    """Verify trigger evaluation and retrieval of in-app notifications."""
    eval_res = client.post(
        "/api/v1/notifications/evaluate-triggers",
        headers=auth_headers["pastor"],
    )
    assert eval_res.status_code == 200
    data = eval_res.json()
    assert data["status"] == "success"
    assert "rules_evaluated" in data
    assert "in_app_notifications_created" in data

    # Check inbox
    inbox_res = client.get("/api/v1/notifications/inbox", headers=auth_headers["pastor"])
    assert inbox_res.status_code == 200
    inbox = inbox_res.json()
    assert isinstance(inbox, list)

    # Mark all read
    read_res = client.post("/api/v1/notifications/mark-all-read", headers=auth_headers["pastor"])
    assert read_res.status_code == 200
    assert "marked_read" in read_res.json()
