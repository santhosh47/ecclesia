"""RFC 5545 iCalendar (.ics) generation and Google Calendar integration utilities."""

from datetime import datetime, timedelta
import urllib.parse
from typing import Sequence

from app.models.church_activity import ChurchActivity


def escape_ical_text(text: str | None) -> str:
    """Escape special characters per RFC 5545 specification."""
    if not text:
        return ""
    # Backslashes, semicolons, commas, and newlines must be escaped
    escaped = text.replace("\\", "\\\\").replace(";", "\\;").replace(",", "\\,")
    return escaped.replace("\r\n", "\\n").replace("\n", "\\n").replace("\r", "\\n")


def format_ical_datetime(dt: datetime | None) -> str:
    """Format datetime in UTC Zulu format for iCalendar (e.g. 20260911T120000Z)."""
    if not dt:
        dt = datetime.utcnow()
    # Assume UTC representation for standard cross-client calendar feeds
    return dt.strftime("%Y%m%dT%H%M%SZ")


def generate_ical_feed(
    activities: Sequence[ChurchActivity],
    calendar_name: str = "Ecclesia Church Calendar",
    description: str = "Official calendar of worship services, prayer meetings, and church gatherings.",
) -> str:
    """Generate RFC 5545 compliant iCalendar (.ics) string with CRLF line endings."""
    lines = [
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        "PRODID:-//Ecclesia//Church Management System//EN",
        "CALSCALE:GREGORIAN",
        "METHOD:PUBLISH",
        f"X-WR-CALNAME:{escape_ical_text(calendar_name)}",
        f"X-WR-CALDESC:{escape_ical_text(description)}",
        "X-WR-TIMEZONE:UTC",
    ]

    now_str = format_ical_datetime(datetime.utcnow())

    for act in activities:
        if not act.is_active:
            continue

        start_dt = act.starts_at or datetime.utcnow()
        end_dt = act.ends_at or (start_dt + timedelta(hours=1, minutes=30))

        uid = f"activity-{act.id}-{format_ical_datetime(start_dt)}@ecclesia.church"
        summary = escape_ical_text(act.title)
        location = escape_ical_text(act.location or "Church Campus")
        
        desc_parts = []
        if act.description:
            desc_parts.append(act.description)
        if act.category:
            desc_parts.append(f"Category: {act.category}")
        if act.organizer_name:
            desc_parts.append(f"Leader: {act.organizer_name}")
        if act.target_group:
            desc_parts.append(f"Group: {act.target_group}")
        if act.contact_phone:
            desc_parts.append(f"Contact: {act.contact_phone}")
        
        full_desc = escape_ical_text("\n".join(desc_parts))

        lines.extend([
            "BEGIN:VEVENT",
            f"UID:{uid}",
            f"DTSTAMP:{now_str}",
            f"DTSTART:{format_ical_datetime(start_dt)}",
            f"DTEND:{format_ical_datetime(end_dt)}",
            f"SUMMARY:{summary}",
            f"DESCRIPTION:{full_desc}",
            f"LOCATION:{location}",
            f"CATEGORIES:{escape_ical_text(act.category or 'General')}",
            "STATUS:CONFIRMED",
            "TRANSP:OPAQUE",
            "END:VEVENT",
        ])

    lines.append("END:VCALENDAR")
    # RFC 5545 requires CRLF line endings
    return "\r\n".join(lines) + "\r\n"


def generate_google_calendar_url(
    title: str,
    starts_at: datetime,
    ends_at: datetime | None = None,
    details: str | None = None,
    location: str | None = None,
) -> str:
    """Build direct 1-click Google Calendar addition URL."""
    if not ends_at:
        ends_at = starts_at + timedelta(hours=1, minutes=30)

    start_str = format_ical_datetime(starts_at)
    end_str = format_ical_datetime(ends_at)

    params = {
        "action": "TEMPLATE",
        "text": title,
        "dates": f"{start_str}/{end_str}",
        "details": details or "Ecclesia Church Activity",
        "location": location or "Church Campus",
    }
    return f"https://calendar.google.com/calendar/render?{urllib.parse.urlencode(params)}"


def generate_google_calendar_subscribe_url(feed_url: str) -> str:
    """Build 1-click Google Calendar feed subscription URL using webcal protocol."""
    clean_url = feed_url.replace("https://", "").replace("http://", "")
    webcal_url = f"webcal://{clean_url}"
    encoded = urllib.parse.quote(webcal_url, safe="")
    return f"https://calendar.google.com/calendar/r?cid={encoded}"
