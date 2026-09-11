"""Unit tests verifying answered prayer tracking, testimony praise reports, and statistics."""

from datetime import date
from fastapi.testclient import TestClient
import pytest
from sqlalchemy import select

from app.database.session import SessionLocal
from app.main import app
from app.models.notifications import InAppNotification
from app.models.pastoral import PrayerRequest

client = TestClient(app)


def test_answered_prayer_flow_and_testimony():
    """Verify creating a prayer request, recording the answer with testimony notes, and listing."""
    # 1. Create prayer request
    payload = {
        "requester_name": "Hannah Samuel",
        "title": "Healing for Brother David's surgery",
        "details": "Undergoing cardiac bypass surgery this Friday morning.",
        "category": "Healing",
        "is_confidential": False,
    }
    create_res = client.post("/api/v1/pastoral/prayers", json=payload)
    assert create_res.status_code == 201
    prayer_data = create_res.json()
    prayer_id = prayer_data["id"]
    assert prayer_data["status"] == "Active"
    assert prayer_data["date_answered"] is None

    # 2. Record prayer answered with testimony
    answer_payload = {
        "answer_notes": "Surgery was a complete success! Doctors were amazed at how rapidly he regained strength. Praise the Lord!",
        "is_confidential": False,
    }
    answer_res = client.post(f"/api/v1/pastoral/prayers/{prayer_id}/answer", json=answer_payload)
    assert answer_res.status_code == 200
    answered_data = answer_res.json()
    assert answered_data["status"] == "Answered"
    assert answered_data["date_answered"] == date.today().isoformat()
    assert "complete success" in answered_data["answer_notes"]

    # 3. Verify in-app celebration notification created
    db = SessionLocal()
    notice = db.scalar(
        select(InAppNotification).where(
            InAppNotification.notification_type == "answered_prayer",
            InAppNotification.action_url == "/pastoral?tab=answered",
        ).order_by(InAppNotification.id.desc()).limit(1)
    )
    assert notice is not None
    assert "Hannah Samuel" in notice.title
    db.close()

    # 4. Verify GET /pastoral/prayers/answered
    list_res = client.get("/api/v1/pastoral/prayers/answered?category=Healing")
    assert list_res.status_code == 200
    answered_list = list_res.json()
    assert any(p["id"] == prayer_id for p in answered_list)

    # 5. Verify search functionality on answered prayers
    search_res = client.get("/api/v1/pastoral/prayers/answered?search=cardiac")
    assert search_res.status_code == 200
    assert len(search_res.json()) >= 1


def test_prayer_statistics_endpoint():
    """Verify prayer aggregate calculations, answer rate, and category breakdowns."""
    stats_res = client.get("/api/v1/pastoral/prayers/stats")
    assert stats_res.status_code == 200
    stats = stats_res.json()
    assert "total_prayers" in stats
    assert "answered_count" in stats
    assert "active_count" in stats
    assert "answer_rate_percent" in stats
    assert "by_category" in stats
    assert isinstance(stats["recent_testimonies"], list)
    assert stats["total_prayers"] >= stats["answered_count"]
