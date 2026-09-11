"""Unit tests validating the decoupled Repository and Service layers."""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.database.session import SessionLocal
from app.main import app
from app.models.member import Member
from app.repositories.base import BaseRepository
from app.repositories.member_repository import MemberRepository
from app.schemas.member import MemberCreate
from app.schemas.messaging import SendBroadcastRequest
from app.services.member_service import MemberService
from app.services.messaging_service import MessagingService


@pytest.fixture
def db_session() -> Session:
    with TestClient(app) as client:
        client.post("/api/v1/seed")
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()


def test_base_repository_crud(db_session: Session) -> None:
    """Verify BaseRepository generic CRUD operations."""
    repo = BaseRepository(Member, db_session)

    # Read all
    members = repo.get_all(limit=10)
    assert len(members) > 0

    first_member = members[0]
    fetched = repo.get(first_member.id)
    assert fetched is not None
    assert fetched.first_name == first_member.first_name


def test_member_repository_filtering(db_session: Session) -> None:
    """Verify MemberRepository specialized domain query filtering."""
    repo = MemberRepository(db_session)

    # Filter by status
    active_members = repo.filter_and_sort(status="Active")
    assert all(m.status == "Active" for m in active_members)

    # Filter with search term
    searched = repo.filter_and_sort(search="David")
    assert len(searched) > 0

    # Sort by first name descending
    sorted_members = repo.filter_and_sort(sort_by="first_name", sort_order="desc")
    assert len(sorted_members) > 1
    assert sorted_members[0].first_name >= sorted_members[1].first_name


def test_member_service_workflows(db_session: Session) -> None:
    """Verify MemberService business logic operations."""
    service = MemberService(db_session)

    # 1. List members
    members = service.list_members()
    assert len(members) > 0
    assert hasattr(members[0], "household_name")
    assert hasattr(members[0], "ministries")

    # 2. Get member detail with calculated metrics
    target_id = members[0].id
    detail = service.get_member_detail(target_id)
    assert detail.id == target_id
    assert hasattr(detail, "total_contributions_ytd")
    assert hasattr(detail, "attendance_rate_percent")

    # 3. Calculate upcoming milestones
    milestones = service.calculate_upcoming_milestones(days=365)
    assert isinstance(milestones, list)
    if milestones:
        assert milestones[0].days_until <= milestones[-1].days_until

    # 4. Create member via service
    new_member_payload = MemberCreate(
        first_name="ServiceTest",
        last_name="Member",
        email="servicetest.member@example.com",
        phone="+91 99887 76655",
        status="Active",
    )
    created = service.create_member(new_member_payload)
    assert created.id is not None
    assert created.email == "servicetest.member@example.com"


def test_messaging_service_dispatch(db_session: Session) -> None:
    """Verify MessagingService template retrieval and broadcast dispatch."""
    service = MessagingService(db_session)

    # List templates
    templates = service.list_templates()
    assert len(templates) > 0

    # Dispatch broadcast
    broadcast_request = SendBroadcastRequest(
        title="Unit Test Broadcast",
        channel="WhatsApp",
        target_group="All Active Members",
        custom_message="Hello {{first_name}}, service test alert!",
    )
    result = service.dispatch_broadcast(broadcast_request)
    assert result.id is not None
    assert result.status == "Completed"
    assert result.total_recipients >= 1
    assert len(result.logs) == result.total_recipients
