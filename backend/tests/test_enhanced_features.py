"""Comprehensive test suite for Ecclesia integrated feature enhancements.

Covers:
- Church Activity <-> Attendance Event integration & synchronization
- Attendance calculation consistency (headcount + roster check-in)
- Member profile avatar upload, update, deletion & validation
- Member server-side sorting and multi-field filtering
- CSV data exports (Members, Attendance, Activities, Contributions, Expenses)
- Church profile and settings persistence in database
"""

import io
from fastapi.testclient import TestClient
from app.main import app


def test_church_activity_attendance_integration() -> None:
    """Test creating an activity with track_attendance=True creates a linked Event,

    and editing/deleting syncs with the Event.
    """
    with TestClient(app) as client:
        # Seed DB first to have valid state
        client.post("/api/v1/seed")

        # 1. Create activity with track_attendance = True
        act_payload = {
            "title": "Youth Revival Fellowship Night",
            "activity_type": "Fellowship",
            "starts_at": "2026-09-15T18:00:00Z",
            "ends_at": "2026-09-15T20:30:00Z",
            "location": "Youth Fellowship Hall",
            "organizer": "Youth Ministry",
            "description": "Praise, testimony sharing, and youth revival.",
            "track_attendance": True,
        }
        res = client.post("/api/v1/church-calendar/activities", json=act_payload)
        assert res.status_code in (200, 201), res.text
        act_data = res.json()
        assert act_data["track_attendance"] is True
        assert act_data["event_id"] is not None
        event_id = act_data["event_id"]
        activity_id = act_data["id"]

        # Verify linked Event exists in events API
        evt_res = client.get(f"/api/v1/events/{event_id}")
        assert evt_res.status_code == 200
        evt_data = evt_res.json()
        assert evt_data["title"] == "Youth Revival Fellowship Night"
        assert evt_data["location"] == "Youth Fellowship Hall"
        assert evt_data["event_type"] in ["Worship Service", "Fellowship", "Activity Check-in"]

        # 2. Check in a member to this linked event
        members_res = client.get("/api/v1/members")
        members = members_res.json()
        assert len(members) > 0
        member_id = members[0]["id"]

        checkin_res = client.post(
            "/api/v1/attendance/check-in",
            json={"event_id": event_id, "member_id": member_id, "status": "Present"},
        )
        assert checkin_res.status_code in (200, 201)
        assert checkin_res.json()["status"] == "Present"

        # 3. Update Activity title & time -> verify linked Event updates
        patch_res = client.patch(
            f"/api/v1/church-calendar/activities/{activity_id}",
            json={
                "title": "Youth Revival Fellowship & Worship",
                "location": "Main Auditorium",
            },
        )
        assert patch_res.status_code == 200
        assert patch_res.json()["title"] == "Youth Revival Fellowship & Worship"

        evt_after_patch = client.get(f"/api/v1/events/{event_id}").json()
        assert evt_after_patch["title"] == "Youth Revival Fellowship & Worship"
        assert evt_after_patch["location"] == "Main Auditorium"

        # 4. Delete Activity -> cleans up
        del_res = client.delete(f"/api/v1/church-calendar/activities/{activity_id}")
        assert del_res.status_code in (200, 204)


def test_attendance_consistency_and_headcount_formula() -> None:
    """Test that event total attendance calculation standardizes:

    max(adults + children, roster_present) + online.
    """
    with TestClient(app) as client:
        client.post("/api/v1/seed")

        # 1. Create a service with headcounts: Adults=30, Children=10, Online=8
        evt_res = client.post(
            "/api/v1/events",
            json={
                "title": "Midweek Bible Study",
                "event_type": "Bible Study",
                "starts_at": "2026-09-17T19:00:00Z",
                "ends_at": "2026-09-17T20:30:00Z",
                "location": "Chapel",
                "headcount_adults": 30,
                "headcount_children": 10,
                "headcount_online": 8,
            },
        )
        assert evt_res.status_code in (200, 201)
        evt = evt_res.json()
        event_id = evt["id"]

        # Initial total_headcount should be max(40, 0) + 8 = 48
        assert evt["total_headcount"] == 48

        # 2. Check in 2 members
        members = client.get("/api/v1/members").json()
        client.post("/api/v1/attendance/check-in", json={"event_id": event_id, "member_id": members[0]["id"], "status": "Present"})
        client.post("/api/v1/attendance/check-in", json={"event_id": event_id, "member_id": members[1]["id"], "status": "Present"})

        # Re-fetch event
        evt_updated = client.get(f"/api/v1/events/{event_id}").json()
        # Physical headcount (40) > roster count (2), total should remain 48
        assert evt_updated["total_headcount"] == 48

        # Check summary calculation on dashboard
        dash = client.get("/api/v1/dashboard/stats").json()
        assert "avg_sunday_attendance" in dash["kpis"]
        assert isinstance(dash["kpis"]["avg_sunday_attendance"], (int, float))


def test_member_avatar_upload_and_delete() -> None:
    """Test avatar photo upload, replacement, deletion, and invalid file validation."""
    with TestClient(app) as client:
        client.post("/api/v1/seed")
        members = client.get("/api/v1/members").json()
        member_id = members[0]["id"]

        # 1. Standalone upload
        fake_png_data = b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15c4"
        upload_resp = client.post(
            "/api/v1/members/upload-avatar",
            files={"file": ("test_avatar.png", io.BytesIO(fake_png_data), "image/png")},
        )
        assert upload_resp.status_code == 200
        avatar_url = upload_resp.json()["avatar_url"]
        assert avatar_url.startswith("/uploads/avatars/")

        # 2. Member avatar upload
        mem_upload = client.post(
            f"/api/v1/members/{member_id}/avatar",
            files={"file": ("member_photo.png", io.BytesIO(fake_png_data), "image/png")},
        )
        assert mem_upload.status_code == 200
        assert mem_upload.json()["avatar_url"].startswith("/uploads/avatars/")

        # Verify member detail has the new avatar_url
        mem_detail = client.get(f"/api/v1/members/{member_id}").json()
        assert mem_detail["avatar_url"] == mem_upload.json()["avatar_url"]

        # 3. Delete avatar
        del_resp = client.delete(f"/api/v1/members/{member_id}/avatar")
        assert del_resp.status_code == 200
        assert del_resp.json()["avatar_url"] is None

        mem_detail_after_del = client.get(f"/api/v1/members/{member_id}").json()
        assert mem_detail_after_del["avatar_url"] is None

        # 4. Reject invalid file type
        bad_file_resp = client.post(
            "/api/v1/members/upload-avatar",
            files={"file": ("malicious.exe", io.BytesIO(b"binary"), "application/x-msdownload")},
        )
        assert bad_file_resp.status_code == 400


def test_member_sorting_and_filtering() -> None:
    """Test server-side sorting and multi-field filtering on GET /members."""
    with TestClient(app) as client:
        client.post("/api/v1/seed")

        # 1. Sort by name asc & desc
        res_asc = client.get("/api/v1/members?sort_by=name&sort_order=asc")
        assert res_asc.status_code == 200
        members_asc = res_asc.json()
        assert len(members_asc) > 0

        res_desc = client.get("/api/v1/members?sort_by=name&sort_order=desc")
        assert res_desc.status_code == 200
        members_desc = res_desc.json()
        assert members_asc[0]["last_name"] != members_desc[0]["last_name"] or len(members_asc) == 1

        # 2. Sort by baptism_date
        res_bap = client.get("/api/v1/members?sort_by=baptism_date&sort_order=desc")
        assert res_bap.status_code == 200

        # 3. Filter by gender & marital status
        res_filter = client.get("/api/v1/members?gender=Male&marital_status=Single")
        assert res_filter.status_code == 200
        filtered = res_filter.json()
        for m in filtered:
            assert m["gender"] == "Male"
            assert m["marital_status"] == "Single"

        # 4. Filter by leadership role
        res_leaders = client.get("/api/v1/members?leadership_role=Pastor")
        assert res_leaders.status_code == 200
        for m in res_leaders.json():
            assert m["leadership_role"] == "Pastor"


def test_csv_exports_all_endpoints() -> None:
    """Test CSV export endpoints for Members, Attendance, Activities, Contributions, and Expenses."""
    with TestClient(app) as client:
        client.post("/api/v1/seed")

        # 1. Members CSV
        m_csv = client.get("/api/v1/members/csv/export")
        assert m_csv.status_code == 200
        assert "text/csv" in m_csv.headers["content-type"]
        assert "First Name,Last Name,Title,Email" in m_csv.text

        # 2. Attendance CSV
        att_csv = client.get("/api/v1/attendance/csv/export")
        assert att_csv.status_code == 200
        assert "text/csv" in att_csv.headers["content-type"]
        assert "Record ID,Event ID,Event Title" in att_csv.text

        # 3. Church Calendar Activities CSV
        cal_csv = client.get("/api/v1/church-calendar/csv/export")
        assert cal_csv.status_code == 200
        assert "text/csv" in cal_csv.headers["content-type"]
        assert "ID,Title,Category" in cal_csv.text

        # 4. Contributions CSV
        cont_csv = client.get("/api/v1/finances/contributions/csv/export")
        assert cont_csv.status_code == 200
        assert "text/csv" in cont_csv.headers["content-type"]
        assert "ID,Date,Member / Donor Name" in cont_csv.text

        # 5. Expenses CSV
        exp_csv = client.get("/api/v1/finances/expenses/csv/export")
        assert exp_csv.status_code == 200
        assert "text/csv" in exp_csv.headers["content-type"]
        assert "ID,Date,Title" in exp_csv.text


def test_church_profile_persistence_in_database() -> None:
    """Test that ChurchSetting model persists church configuration across requests and sessions."""
    with TestClient(app) as client:
        # Seed DB
        client.post("/api/v1/seed")

        # Update profile
        update_data = {
            "name": "Grace Tabernacle International",
            "senior_pastor": "Pastor Samuel Vance",
            "denomination": "Reformed Evangelical",
            "motto": "Faith, Hope, Love in Christ",
            "website": "https://gracetabernacle.org",
            "phone": "+1 (555) 987-6543",
        }
        put_res = client.put("/api/v1/localization/church-profile", json=update_data)
        assert put_res.status_code == 200
        updated_org = put_res.json()["organization"]
        assert updated_org["name"] == "Grace Tabernacle International"
        assert updated_org["senior_pastor"] == "Pastor Samuel Vance"
        assert updated_org["website"] == "https://gracetabernacle.org"

        # Verify GET /localization/config fetches persisted record from ChurchSetting table
        get_res = client.get("/api/v1/localization/config")
        assert get_res.status_code == 200
        config_org = get_res.json()["organization"]
        assert config_org["name"] == "Grace Tabernacle International"
        assert config_org["senior_pastor"] == "Pastor Samuel Vance"
        assert config_org["motto"] == "Faith, Hope, Love in Christ"

        # Toggle mode
        toggle_res = client.post("/api/v1/localization/toggle-mode", json={"mode": "GLOBAL"})
        assert toggle_res.status_code == 200
        assert toggle_res.json()["active_mode"] == "GLOBAL"

        # Verify config returns GLOBAL mode
        check_mode = client.get("/api/v1/localization/config").json()
        assert check_mode["active_mode"] == "GLOBAL"
