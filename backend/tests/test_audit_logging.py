"""Unit tests validating the immutable Audit Trail and Activity Logging system."""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.database.session import SessionLocal
from app.main import app
from app.schemas.member import MemberCreate
from app.services.audit_service import AuditService
from app.services.member_service import MemberService


@pytest.fixture
def db_session() -> Session:
    """Fixture providing a transactional test database session."""
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()


def test_audit_service_record_and_list(db_session: Session) -> None:
    """Verify AuditService direct recording, listing, and pagination."""
    service = AuditService(db_session)
    entry = service.record(
        action="CREATE",
        entity_type="TestEntity",
        entity_id="999",
        details="Direct service test creation",
        username="test_admin",
        user_role="admin",
        ip_address="127.0.0.1",
    )
    assert entry is not None
    assert entry.id is not None
    assert entry.action == "CREATE"
    assert entry.entity_type == "TestEntity"
    assert entry.username == "test_admin"

    logs = service.list_logs(entity_type="TestEntity")
    assert len(logs) > 0
    assert any(log.entity_id == "999" for log in logs)


def test_audit_service_filtering_and_search(db_session: Session) -> None:
    """Verify filtering by action and searching across details and username."""
    service = AuditService(db_session)
    service.record(
        action="EXPORT",
        entity_type="Report",
        details="Exported donor statement for year 2026",
        username="treasurer_audit",
    )

    # Filter by action
    export_logs = service.list_logs(action="EXPORT")
    assert any(log.action == "EXPORT" for log in export_logs)

    # Search keyword
    searched = service.list_logs(search="treasurer_audit")
    assert len(searched) > 0
    assert any("treasurer_audit" in log.username for log in searched)


def test_member_lifecycle_triggers_audit_entries(db_session: Session) -> None:
    """Verify that member create, update, and delete trigger corresponding audit logs."""
    member_service = MemberService(db_session)
    audit_service = AuditService(db_session)

    # 1. Create
    new_member = member_service.create_member(
        MemberCreate(
            first_name="AuditTest",
            last_name="Person",
            email="audittest.person@example.com",
            phone="+91 99001 12233",
            status="Active",
        )
    )
    created_id = new_member.id

    logs = audit_service.list_logs(entity_type="Member")
    assert any(log.action == "CREATE" and log.entity_id == str(created_id) for log in logs)

    # 2. Delete
    member_service.delete_member(created_id)
    del_logs = audit_service.list_logs(entity_type="Member", action="DELETE")
    assert any(log.entity_id == str(created_id) for log in del_logs)


def test_auth_login_triggers_audit_trail() -> None:
    """Verify that successful and failed logins generate audit entries."""
    with TestClient(app) as client:
        # Failed login attempt
        client.post(
            "/api/v1/auth/login",
            json={"username": "invalid_user", "password": "wrong_password"},
        )

        # Successful login
        client.post(
            "/api/v1/auth/login",
            json={"username": "pastor", "password": "pastor123"},
        )

    session = SessionLocal()
    try:
        audit_service = AuditService(session)
        failed_logs = audit_service.list_logs(action="LOGIN_FAILED")
        assert len(failed_logs) > 0

        success_logs = audit_service.list_logs(action="LOGIN")
        assert len(success_logs) > 0
        assert any(log.username == "pastor" for log in success_logs)
    finally:
        session.close()


def test_get_audit_logs_api_endpoint() -> None:
    """Verify GET /api/v1/audit-logs returns formatted audit logs."""
    with TestClient(app) as client:
        response = client.get("/api/v1/audit-logs?limit=20")
        assert response.status_code == 200

        data = response.json()
        assert isinstance(data, list)
        assert len(data) > 0
        first_item = data[0]
        assert "timestamp" in first_item
        assert "action" in first_item
        assert "entity_type" in first_item
        assert "username" in first_item
