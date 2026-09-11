"""Unit tests verifying RFC 5545 iCalendar export, WebCal feeds, and Google Calendar integration."""

from datetime import datetime, timedelta
from fastapi.testclient import TestClient

from app.core.calendar_export import (
    escape_ical_text,
    format_ical_datetime,
    generate_google_calendar_subscribe_url,
    generate_google_calendar_url,
    generate_ical_feed,
)
from app.main import app
from app.models.church_activity import ChurchActivity

client = TestClient(app)


def test_escape_ical_text():
    """Verify that commas, semicolons, and newlines are properly escaped."""
    assert escape_ical_text("Hello, World; Welcome\nNext line") == "Hello\\, World\\; Welcome\\nNext line"
    assert escape_ical_text("") == ""
    assert escape_ical_text(None) == ""


def test_format_ical_datetime():
    """Verify datetime formatting in UTC Zulu representation."""
    dt = datetime(2026, 9, 11, 10, 30, 0)
    assert format_ical_datetime(dt) == "20260911T103000Z"


def test_generate_google_calendar_urls():
    """Verify 1-click Google Calendar addition and subscription link generation."""
    start = datetime(2026, 12, 25, 9, 0, 0)
    end = start + timedelta(hours=2)
    url = generate_google_calendar_url(
        title="Christmas Sunday Service",
        starts_at=start,
        ends_at=end,
        details="Celebration of the Nativity",
        location="Main Sanctuary",
    )
    assert "calendar.google.com/calendar/render" in url
    assert "action=TEMPLATE" in url
    assert "Christmas+Sunday+Service" in url or "Christmas%20Sunday%20Service" in url
    assert "20261225T090000Z" in url

    # Test Google Calendar subscription link
    feed_url = "https://ecclesia.church/api/v1/church-calendar/feed.ics"
    sub_url = generate_google_calendar_subscribe_url(feed_url)
    assert "calendar.google.com/calendar/r?cid=" in sub_url
    assert "webcal" in sub_url


def test_generate_ical_feed_structure():
    """Verify that generate_ical_feed constructs valid RFC 5545 structure."""
    act = ChurchActivity(
        id=1,
        title="Sunday Morning Worship",
        category="Worship Service",
        starts_at=datetime(2026, 10, 4, 9, 30, 0),
        ends_at=datetime(2026, 10, 4, 11, 0, 0),
        location="Sanctuary",
        description="Weekly worship with Communion",
        is_active=True,
    )
    feed = generate_ical_feed([act])
    assert "BEGIN:VCALENDAR\r\n" in feed
    assert "VERSION:2.0\r\n" in feed
    assert "PRODID:-//Ecclesia//Church Management System//EN\r\n" in feed
    assert "BEGIN:VEVENT\r\n" in feed
    assert "SUMMARY:Sunday Morning Worship\r\n" in feed
    assert "LOCATION:Sanctuary\r\n" in feed
    assert "CATEGORIES:Worship Service\r\n" in feed
    assert "END:VEVENT\r\n" in feed
    assert "END:VCALENDAR\r\n" in feed


def test_export_church_calendar_ics_endpoint():
    """Verify that GET /api/v1/church-calendar/export.ics returns 200 with text/calendar."""
    res = client.get("/api/v1/church-calendar/export.ics")
    assert res.status_code == 200
    assert "text/calendar" in res.headers.get("content-type", "")
    assert "attachment; filename=" in res.headers.get("content-disposition", "")
    assert "BEGIN:VCALENDAR" in res.text
    assert "END:VCALENDAR" in res.text


def test_church_calendar_webcal_feed_endpoint():
    """Verify that GET /api/v1/church-calendar/feed.ics returns 200 live feed."""
    res = client.get("/api/v1/church-calendar/feed.ics")
    assert res.status_code == 200
    assert "text/calendar" in res.headers.get("content-type", "")
    assert "BEGIN:VCALENDAR" in res.text


def test_calendar_subscription_links_endpoint():
    """Verify that GET /api/v1/church-calendar/subscription-links returns valid links."""
    res = client.get("/api/v1/church-calendar/subscription-links")
    assert res.status_code == 200
    data = res.json()
    assert "ics_download_url" in data
    assert "webcal_feed_url" in data
    assert "google_calendar_subscribe_url" in data
    assert data["webcal_feed_url"].startswith("webcal://")
