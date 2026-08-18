"""Test suite for Ecclesia ChMS enterprise features, church activities calendar, customization and RBAC."""

from fastapi.testclient import TestClient
from app.main import app


def test_seed_and_localization_toggle() -> None:
    with TestClient(app) as client:
        # Seed database
        seed_resp = client.post("/api/v1/seed")
        assert seed_resp.status_code == 200
        assert seed_resp.json()["status"] == "success"

        # Check localization config
        loc_resp = client.get("/api/v1/localization/config")
        assert loc_resp.status_code == 200
        config = loc_resp.json()
        assert config["active_mode"] in ["IN", "GLOBAL"]
        assert "organization" in config
        assert "modules" in config
        assert "roles" in config

        # Toggle to GLOBAL
        toggle_resp = client.post("/api/v1/localization/toggle-mode", json={"mode": "GLOBAL"})
        assert toggle_resp.status_code == 200
        assert toggle_resp.json()["active_mode"] == "GLOBAL"

        # Toggle back to IN
        toggle_in = client.post("/api/v1/localization/toggle-mode", json={"mode": "IN"})
        assert toggle_in.status_code == 200
        assert toggle_in.json()["active_mode"] == "IN"


def test_church_profile_and_feature_toggles() -> None:
    with TestClient(app) as client:
        # 1. Update Church Profile (Name, Senior Pastor, Contact)
        profile_update = {
            "name": "St. Luke's Cathedral & Parish",
            "senior_pastor": "Rev. Dr. Samuel Thomas, DD",
            "denomination": "Anglican Communion",
            "phone": "+91 80 9999 8888",
        }
        update_resp = client.put("/api/v1/localization/church-profile", json=profile_update)
        assert update_resp.status_code == 200
        data = update_resp.json()
        assert data["organization"]["name"] == "St. Luke's Cathedral & Parish"
        assert data["organization"]["senior_pastor"] == "Rev. Dr. Samuel Thomas, DD"

        # 2. Toggle fine-grained module (e.g. disable pdf_certificates then re-enable)
        toggle_resp = client.post(
            "/api/v1/localization/toggle-module",
            json={"module_key": "pdf_certificates", "enabled": False},
        )
        assert toggle_resp.status_code == 200
        assert toggle_resp.json()["modules"]["pdf_certificates"] is False

        # Re-enable
        toggle_back = client.post(
            "/api/v1/localization/toggle-module",
            json={"module_key": "pdf_certificates", "enabled": True},
        )
        assert toggle_back.status_code == 200
        assert toggle_back.json()["modules"]["pdf_certificates"] is True


def test_rbac_role_management() -> None:
    with TestClient(app) as client:
        # 1. List roles
        config = client.get("/api/v1/localization/config").json()
        roles = config["roles"]
        assert len(roles) >= 4
        role_ids = {r["id"] for r in roles}
        assert "super_admin" in role_ids
        assert "treasurer" in role_ids
        assert "elder" in role_ids

        # 2. Create / Update Custom Role
        new_role = {
            "id": "audit_committee",
            "name": "Audit & Finance Committee",
            "description": "Internal audit review for double-entry ledger and bank records",
            "permissions": ["view_ledger", "view_finances", "tax_compliance"],
        }
        put_resp = client.put("/api/v1/localization/roles", json=new_role)
        assert put_resp.status_code == 200
        updated_roles = put_resp.json()["roles"]
        audit_role = next((r for r in updated_roles if r["id"] == "audit_committee"), None)
        assert audit_role is not None
        assert "view_ledger" in audit_role["permissions"]


def test_church_calendar_activities() -> None:
    with TestClient(app) as client:
        client.post("/api/v1/seed")

        # 1. List church activities
        activities_resp = client.get("/api/v1/church-calendar/activities")
        assert activities_resp.status_code == 200
        activities = activities_resp.json()
        assert len(activities) >= 4

        # 2. Create a new church activity
        new_act = {
            "title": "Youth Friday Night Praise & Worship",
            "category": "Youth Fellowship",
            "activity_type": "Regular Weekly",
            "starts_at": "2026-08-28T18:00:00",
            "ends_at": "2026-08-28T20:00:00",
            "location": "Youth Hall",
            "organizer_name": "Pastor Reuben Mathew",
            "target_group": "Youth & Young Adults",
            "description": "Contemporary worship and fellowship.",
            "is_recurring": True,
            "recurrence_pattern": "Weekly on Fridays at 6:00 PM",
        }
        create_resp = client.post("/api/v1/church-calendar/activities", json=new_act)
        assert create_resp.status_code == 201
        created_id = create_resp.json()["id"]

        # 3. Update activity
        patch_resp = client.patch(
            f"/api/v1/church-calendar/activities/{created_id}",
            json={"location": "Main Sanctuary (Air-Conditioned)"},
        )
        assert patch_resp.status_code == 200
        assert patch_resp.json()["location"] == "Main Sanctuary (Air-Conditioned)"


def test_double_entry_ledger_and_trial_balance() -> None:
    with TestClient(app) as client:
        client.post("/api/v1/seed")

        # List accounts
        accounts_resp = client.get("/api/v1/ledger/accounts")
        assert accounts_resp.status_code == 200
        accounts = accounts_resp.json()
        assert len(accounts) >= 10
        bank_acc = next(a for a in accounts if a["code"] == "1010")
        tithe_acc = next(a for a in accounts if a["code"] == "4010")

        # Post balanced Journal Entry
        je_payload = {
            "description": "Midweek Offering Bank Deposit",
            "reference": "DEP-TEST-001",
            "lines": [
                {"account_id": bank_acc["id"], "debit": 12000.0, "credit": 0.0, "memo": "Cash deposited"},
                {"account_id": tithe_acc["id"], "debit": 0.0, "credit": 12000.0, "memo": "Credit Tithes"},
            ],
        }
        je_resp = client.post("/api/v1/ledger/journal-entries", json=je_payload)
        assert je_resp.status_code == 201
        assert je_resp.json()["total_debit"] == 12000.0
        assert je_resp.json()["total_credit"] == 12000.0

        # Trial Balance
        tb_resp = client.get("/api/v1/ledger/trial-balance")
        assert tb_resp.status_code == 200
        tb = tb_resp.json()
        assert tb["is_balanced"] is True
        assert tb["total_debits"] == tb["total_credits"]

        # Staff Payroll
        staff_resp = client.get("/api/v1/ledger/staff")
        assert staff_resp.status_code == 200
        staff = staff_resp.json()
        assert len(staff) >= 2


def test_certificates_and_pdf_generation() -> None:
    with TestClient(app) as client:
        client.post("/api/v1/seed")

        # Templates
        templates_resp = client.get("/api/v1/certificates/templates")
        assert templates_resp.status_code == 200
        assert len(templates_resp.json()) >= 4

        # Issue Certificate
        issue_payload = {
            "certificate_type": "Baptism",
            "recipient_name": "Jonathan Sterling",
            "officiant_name": "Rev. Dr. Samuel Thomas",
            "witness_1": "David Sterling",
            "witness_2": "Grace Sterling",
            "event_date": "2026-08-15",
        }
        issue_resp = client.post("/api/v1/certificates/issue", json=issue_payload)
        assert issue_resp.status_code == 201
        cert_data = issue_resp.json()
        cert_id = cert_data["id"]
        vcode = cert_data["verification_code"]

        # PDF Download Stream
        pdf_resp = client.get(f"/api/v1/certificates/{cert_id}/pdf")
        assert pdf_resp.status_code == 200
        assert pdf_resp.headers["content-type"] == "application/pdf"
        assert len(pdf_resp.content) > 100

        # Verify Code Lookup
        verify_resp = client.get(f"/api/v1/certificates/verify/{vcode}")
        assert verify_resp.status_code == 200
        assert verify_resp.json()["is_valid"] is True


def test_compliance_80g_and_form10bd() -> None:
    with TestClient(app) as client:
        client.post("/api/v1/seed")

        # Generate 80G Receipt
        contribs = client.get("/api/v1/finances/contributions").json()
        first_contrib = contribs[0]

        receipt_payload = {
            "contribution_id": first_contrib["id"],
            "tax_regime": "80G_INDIA",
            "donor_pan_or_tax_id": "AAAPS1234E",
            "financial_year": "2025-2026",
        }
        rcpt_resp = client.post("/api/v1/compliance/receipts/generate", json=receipt_payload)
        assert rcpt_resp.status_code == 201
        rcpt_data = rcpt_resp.json()
        rcpt_id = rcpt_data["id"]

        # PDF Receipt
        pdf_resp = client.get(f"/api/v1/compliance/receipts/{rcpt_id}/pdf")
        assert pdf_resp.status_code == 200
        assert pdf_resp.headers["content-type"] == "application/pdf"

        # Form 10BD statement
        form_resp = client.get("/api/v1/compliance/form-10bd?financial_year=2025-2026")
        assert form_resp.status_code == 200
        form_data = form_resp.json()
        assert form_data["total_donations_count"] >= 1


def test_messaging_and_whatsapp_broadcast() -> None:
    with TestClient(app) as client:
        client.post("/api/v1/seed")

        # Templates
        templates_resp = client.get("/api/v1/messaging/templates")
        assert templates_resp.status_code == 200
        templates = templates_resp.json()
        assert len(templates) > 0

        # Dispatch Broadcast
        bc_payload = {
            "title": "Special Prayer Gathering Reminder",
            "channel": "WhatsApp",
            "target_group": "All Active Members",
            "custom_message": "Dear {{first_name}}, join us tonight at 7:00 PM for special intercessory prayer!",
        }
        bc_resp = client.post("/api/v1/messaging/broadcasts", json=bc_payload)
        assert bc_resp.status_code == 201
        assert bc_resp.json()["total_recipients"] >= 5


def test_csv_export_and_import() -> None:
    with TestClient(app) as client:
        client.post("/api/v1/seed")

        # Export CSV
        export_resp = client.get("/api/v1/members/csv/export")
        assert export_resp.status_code == 200
        assert "First Name,Last Name,Title,Email" in export_resp.text

        # Import CSV
        csv_data = """first_name,last_name,email,phone,gender,household_name,pan_number
Elijah,Vance,elijah.vance@example.com,+91 98450 99001,Male,The Vance Household,EVAPM8899E
Ruth,Vance,ruth.vance@example.com,+91 98450 99002,Female,The Vance Household,EVAPM8899F"""

        import_resp = client.post("/api/v1/members/csv/import", json={"csv_content": csv_data})
        assert import_resp.status_code == 200
        result = import_resp.json()
        assert result["imported_members_count"] == 2
        assert result["imported_households_count"] == 1
