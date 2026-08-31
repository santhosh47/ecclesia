"""CSV Migration API Endpoints for migrating from ChurchCRM or Excel."""

import csv
import io
from datetime import date
from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.models.household import Household
from app.models.member import Member
from app.schemas.csv_migration import CsvImportResult

router = APIRouter(prefix="/members/csv", tags=["migration"])


class CsvImportPayload(BaseModel):
    csv_content: str


def _process_csv_data(decoded_text: str, db: Session) -> CsvImportResult:
    reader = csv.DictReader(io.StringIO(decoded_text))
    if not reader.fieldnames:
        raise HTTPException(status_code=400, detail="Invalid CSV format: no headers found.")

    header_map = {}
    for col in reader.fieldnames:
        clean = col.strip().lower().replace(" ", "_").replace("-", "_")
        header_map[clean] = col

    imported_members = 0
    imported_households = 0
    skipped = 0
    errors = []
    sample_records = []

    household_cache: dict[str, Household] = {}

    for row in reader:
        first_name = (
            row.get(header_map.get("first_name", ""))
            or row.get(header_map.get("firstname", ""))
            or row.get(header_map.get("given_name", ""))
            or row.get(header_map.get("name", ""))
        )
        last_name = (
            row.get(header_map.get("last_name", ""))
            or row.get(header_map.get("lastname", ""))
            or row.get(header_map.get("surname", ""))
            or "Family"
        )
        if not first_name or not first_name.strip():
            skipped += 1
            continue

        first_name = first_name.strip()
        last_name = last_name.strip() if last_name else "Family"
        email = row.get(header_map.get("email", "")) or row.get(header_map.get("email_address", ""))
        phone = row.get(header_map.get("phone", "")) or row.get(header_map.get("mobile", "")) or row.get(header_map.get("cell_phone", ""))
        address = row.get(header_map.get("address", "")) or row.get(header_map.get("street_address", ""))
        city = row.get(header_map.get("city", "")) or "Bangalore"
        state = row.get(header_map.get("state", "")) or "KA"
        gender = row.get(header_map.get("gender", "")) or "Other"
        status_val = row.get(header_map.get("status", "")) or "Active"
        role_val = row.get(header_map.get("role", "")) or row.get(header_map.get("household_role", "")) or "Head"
        pan_tax = row.get(header_map.get("pan", "")) or row.get(header_map.get("pan_number", "")) or row.get(header_map.get("tax_id", ""))
        
        household_name = (
            row.get(header_map.get("family_name", ""))
            or row.get(header_map.get("household", ""))
            or row.get(header_map.get("household_name", ""))
            or f"{last_name} Household"
        ).strip()

        hh = None
        if household_name:
            if household_name in household_cache:
                hh = household_cache[household_name]
            else:
                existing_hh = db.scalar(select(Household).where(Household.name == household_name))
                if existing_hh:
                    hh = existing_hh
                else:
                    hh = Household(name=household_name, address=address, city=city, state=state)
                    db.add(hh)
                    db.flush()
                    imported_households += 1
                household_cache[household_name] = hh

        member = Member(
            first_name=first_name,
            last_name=last_name,
            email=email.strip() if email and "@" in email else None,
            phone=phone.strip() if phone else None,
            address=address,
            city=city,
            state=state,
            gender=gender,
            status=status_val,
            household_id=hh.id if hh else None,
            household_role=role_val,
            pan_number=pan_tax.strip() if pan_tax else None,
            joined_date=date.today(),
        )
        db.add(member)
        imported_members += 1
        if len(sample_records) < 5:
            sample_records.append(f"{first_name} {last_name} ({household_name})")

    db.commit()

    return CsvImportResult(
        success=True,
        imported_members_count=imported_members,
        imported_households_count=imported_households,
        skipped_count=skipped,
        errors=errors,
        sample_records=sample_records,
    )


@router.post("/import", response_model=CsvImportResult)
async def import_members_from_csv(
    request: Request,
    db: Session = Depends(get_db),
) -> CsvImportResult:
    """Import members and households from ChurchCRM or standard CSV files with automatic column matching."""
    content_type = request.headers.get("content-type", "")

    if "application/json" in content_type:
        body = await request.json()
        csv_text = body.get("csv_content", "")
    else:
        # Raw text or form body
        raw_bytes = await request.body()
        try:
            csv_text = raw_bytes.decode("utf-8-sig")
        except UnicodeDecodeError:
            csv_text = raw_bytes.decode("latin1", errors="ignore")

    if not csv_text.strip():
        raise HTTPException(status_code=400, detail="Empty CSV data provided.")

    return _process_csv_data(csv_text, db)


@router.get("/export")
def export_members_to_csv(
    search: str | None = None,
    status: str | None = None,
    member_type: str | None = None,
    gender: str | None = None,
    marital_status: str | None = None,
    leadership_role: str | None = None,
    db: Session = Depends(get_db),
) -> Response:
    """Export church members to a downloadable CSV file with optional filtering."""
    query = select(Member).order_by(Member.last_name.asc(), Member.first_name.asc())

    if search:
        search_term = f"%{search.strip()}%"
        query = query.where(
            (Member.first_name.ilike(search_term))
            | (Member.last_name.ilike(search_term))
            | (Member.email.ilike(search_term))
            | (Member.phone.ilike(search_term))
            | (Member.city.ilike(search_term))
        )
    if status and status != "ALL":
        query = query.where(Member.status == status)
    if member_type and member_type != "ALL":
        query = query.where(Member.member_type == member_type)
    if gender and gender != "ALL":
        query = query.where(Member.gender == gender)
    if marital_status and marital_status != "ALL":
        query = query.where(Member.marital_status == marital_status)
    if leadership_role and leadership_role != "ALL":
        if leadership_role == "LEADERS_ONLY":
            query = query.where(Member.leadership_role.is_not(None), Member.leadership_role != "")
        elif leadership_role == "GENERAL_ONLY":
            query = query.where((Member.leadership_role.is_(None)) | (Member.leadership_role == ""))
        else:
            query = query.where(Member.leadership_role == leadership_role)

    members = db.scalars(query).all()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(
        [
            "First Name",
            "Last Name",
            "Title",
            "Email",
            "Phone",
            "ID",
            "Leadership Role",
            "Gender",
            "Marital Status",
            "Status",
            "Member Type",
            "Household ID",
            "Household Name",
            "Household Role",
            "PAN / Tax ID",
            "Date of Birth",
            "Baptism Date",
            "Baptism Location",
            "Joined Date",
            "Wedding Anniversary",
            "Address",
            "City",
            "State",
            "Postal Code",
            "Language Preference",
        ]
    )

    for m in members:
        hh_name = m.household.name if m.household else ""
        writer.writerow(
            [
                m.first_name,
                m.last_name,
                m.title or "",
                m.email or "",
                m.phone or "",
                m.id,
                m.leadership_role or "",
                m.gender or "",
                m.marital_status or "",
                m.status,
                m.member_type,
                m.household_id or "",
                hh_name,
                m.household_role or "",
                m.pan_number or m.tax_id or "",
                m.date_of_birth.strftime("%Y-%m-%d") if m.date_of_birth else "",
                m.baptism_date.strftime("%Y-%m-%d") if m.baptism_date else "",
                m.baptism_location or "",
                m.joined_date.strftime("%Y-%m-%d") if m.joined_date else "",
                m.wedding_anniversary.strftime("%Y-%m-%d") if m.wedding_anniversary else "",
                m.address or "",
                m.city or "",
                m.state or "",
                m.postal_code or "",
                m.language_preference or "English",
            ]
        )

    csv_data = output.getvalue().encode("utf-8-sig")
    filename = f"ecclesia_members_export_{date.today().strftime('%Y%m%d')}.csv"
    return Response(
        content=csv_data,
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
