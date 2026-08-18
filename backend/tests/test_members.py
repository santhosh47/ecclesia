"""Comprehensive test suite for Ecclesia Church CRM backend."""

from fastapi.testclient import TestClient
from app.main import app


def test_health_check() -> None:
    with TestClient(app) as client:
        response = client.get("/api/v1/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_church_seed_and_dashboard() -> None:
    with TestClient(app) as client:
        # 1. Seed database
        seed_resp = client.post("/api/v1/seed")
        assert seed_resp.status_code == 200
        assert seed_resp.json()["status"] == "success"

        # 2. Check Dashboard Stats
        dash_resp = client.get("/api/v1/dashboard/stats")
        assert dash_resp.status_code == 200
        dash_data = dash_resp.json()
        assert dash_data["kpis"]["total_members"] >= 10
        assert dash_data["kpis"]["total_households"] >= 3
        assert dash_data["kpis"]["ytd_contributions"] > 0
        assert len(dash_data["upcoming_milestones"]) > 0
        assert len(dash_data["absentee_alerts"]) > 0


def test_members_and_milestones() -> None:
    with TestClient(app) as client:
        client.post("/api/v1/seed")

        # List members
        members_resp = client.get("/api/v1/members")
        assert members_resp.status_code == 200
        members = members_resp.json()
        assert len(members) >= 10

        # Search member
        search_resp = client.get("/api/v1/members?search=David")
        assert search_resp.status_code == 200
        assert any(m["first_name"] == "David" for m in search_resp.json())

        # Upcoming milestones
        milestone_resp = client.get("/api/v1/members/milestones/upcoming?days=60")
        assert milestone_resp.status_code == 200
        milestones = milestone_resp.json()
        assert len(milestones) > 0
        types = {m["milestone_type"] for m in milestones}
        assert "Birthday" in types or "Wedding Anniversary" in types


def test_finances_and_donor_statement() -> None:
    with TestClient(app) as client:
        client.post("/api/v1/seed")

        # Summary
        summary_resp = client.get("/api/v1/finances/summary")
        assert summary_resp.status_code == 200
        summary = summary_resp.json()
        assert summary["total_income_ytd"] > 0
        assert len(summary["fund_breakdown"]) > 0
        assert len(summary["monthly_trends"]) > 0

        # Create Contribution
        contrib_payload = {
            "amount": 500.0,
            "fund": "Tithe",
            "payment_method": "Online",
            "date": "2026-08-15",
            "notes": "Test offering",
        }
        create_resp = client.post("/api/v1/finances/contributions", json=contrib_payload)
        assert create_resp.status_code == 201

        # Donor Statement
        members = client.get("/api/v1/members").json()
        member_id = members[0]["id"]
        statement_resp = client.get(f"/api/v1/finances/statements/{member_id}")
        assert statement_resp.status_code == 200
        assert "donor_name" in statement_resp.json()


def test_attendance_and_absentee_detection() -> None:
    with TestClient(app) as client:
        client.post("/api/v1/seed")

        # Absentee alerts (should find Anthony Vargas)
        absentee_resp = client.get("/api/v1/attendance/absentee-alerts?weeks_threshold=3")
        assert absentee_resp.status_code == 200
        absentees = absentee_resp.json()
        assert len(absentees) >= 1
        assert any("Anthony" in a["member_name"] for a in absentees)

        # Check-in
        events = client.get("/api/v1/events").json()
        assert len(events) > 0
        members = client.get("/api/v1/members").json()

        checkin_resp = client.post(
            "/api/v1/attendance/check-in",
            json={
                "event_id": events[0]["id"],
                "member_id": members[0]["id"],
                "status": "Present",
            },
        )
        assert checkin_resp.status_code == 201


def test_pastoral_and_prayer_requests() -> None:
    with TestClient(app) as client:
        client.post("/api/v1/seed")

        # List active prayers
        prayers_resp = client.get("/api/v1/pastoral/prayers?status=Active")
        assert prayers_resp.status_code == 200
        prayers = prayers_resp.json()
        assert len(prayers) > 0

        # Mark prayer as answered
        prayer_id = prayers[0]["id"]
        update_resp = client.patch(
            f"/api/v1/pastoral/prayers/{prayer_id}",
            json={"status": "Answered", "answer_notes": "God answered our prayer wonderfully!"},
        )
        assert update_resp.status_code == 200
        assert update_resp.json()["status"] == "Answered"
