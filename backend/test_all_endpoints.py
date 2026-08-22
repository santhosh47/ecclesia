import urllib.request
import json

BASE = "http://localhost:8000/api/v1"

def test_endpoint(name, path, method="GET", body=None):
    url = f"{BASE}{path}"
    try:
        req = urllib.request.Request(url, method=method)
        if body:
            req.add_header('Content-Type', 'application/json')
            data = json.dumps(body).encode('utf-8')
            response = urllib.request.urlopen(req, data=data, timeout=5)
        else:
            response = urllib.request.urlopen(req, timeout=5)
        code = response.getcode()
        content = response.read().decode('utf-8')
        try:
            parsed = json.loads(content)
            count = len(parsed) if isinstance(parsed, (list, dict)) else 'ok'
            print(f"[PASS] {name} ({code}) -> {count} items")
        except Exception:
            print(f"[PASS] {name} ({code})")
        return True
    except urllib.error.HTTPError as e:
        err = e.read().decode('utf-8')
        print(f"[FAIL] {name} ({path}) HTTP {e.code}: {err}")
        return False
    except Exception as e:
        print(f"[ERROR] {name} ({path}): {e}")
        return False

endpoints = [
    ("Health Check", "/health"),
    ("Localization Config", "/localization/config"),
    ("Dashboard Stats", "/dashboard/stats"),
    ("Members List", "/members"),
    ("Households List", "/households"),
    ("Upcoming Milestones", "/members/milestones/upcoming"),
    ("Ledger Accounts", "/ledger/accounts"),
    ("Journal Entries", "/ledger/journal-entries"),
    ("Trial Balance", "/ledger/trial-balance"),
    ("Staff List", "/ledger/staff"),
    ("Payroll Records", "/ledger/payroll"),
    ("Church Activities", "/church-calendar/activities"),
    ("Certificates Templates", "/certificates/templates"),
    ("Issued Certificates", "/certificates/issued"),
    ("Messaging Templates", "/messaging/templates"),
    ("Messaging Broadcasts", "/messaging/broadcasts"),
    ("Tax Receipts", "/compliance/receipts"),
    ("Form 10BD Report", "/compliance/form-10bd"),
    ("FCRA Logs", "/compliance/fcra-logs"),
    ("UK Gift Aid", "/compliance/uk-gift-aid"),
    ("Finance Summary", "/finances/summary"),
    ("Contributions", "/finances/contributions"),
    ("Expenses", "/finances/expenses"),
    ("Campaigns", "/finances/campaigns"),
    ("Events", "/events"),
    ("Attendance Records", "/attendance"),
    ("Attendance Summary", "/attendance/summary"),
    ("Absentee Alerts", "/attendance/absentee-alerts"),
    ("Ministries", "/ministries"),
    ("Pastoral Notes", "/pastoral/notes"),
    ("Prayer Requests", "/pastoral/prayers"),
    ("Visitor Follow-ups", "/pastoral/visitors"),
    ("User Management", "/users"),
]

print("=== AUDITING ALL ECCLESIA API CLIENT ENDPOINTS ===")
passed = 0
failed = 0
for name, path in endpoints:
    if test_endpoint(name, path):
        passed += 1
    else:
        failed += 1

print(f"\nAudit complete: {passed}/{len(endpoints)} passed, {failed} failed")
