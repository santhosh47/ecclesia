"""Tax Exemption and Compliance API Endpoints (80G, FCRA, 501(c)(3), UK Gift Aid)."""

from datetime import date
from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.config import load_localization_config
from app.core.pdf_generator import generate_tax_receipt_pdf
from app.database.session import get_db
from app.models.compliance import FCRALog, TaxReceipt
from app.models.finance import Contribution
from app.models.member import Member
from app.schemas.compliance import (
    FCRALogCreate,
    FCRALogRead,
    Form10BDEntry,
    Form10BDExportReport,
    IssueTaxReceiptRequest,
    TaxReceiptRead,
    UKGiftAidClaimReport,
)

router = APIRouter(prefix="/compliance", tags=["compliance"])


@router.get("/receipts", response_model=list[TaxReceiptRead])
def list_tax_receipts(
    tax_regime: str | None = None,
    financial_year: str | None = None,
    db: Session = Depends(get_db),
) -> list[TaxReceipt]:
    """List issued 80G, 501(c)(3), or Gift Aid tax exemption certificates."""
    query = select(TaxReceipt)
    if tax_regime:
        query = query.where(TaxReceipt.tax_regime == tax_regime)
    if financial_year:
        query = query.where(TaxReceipt.financial_year == financial_year)
    return list(db.scalars(query.order_by(TaxReceipt.issue_date.desc())).all())


@router.post("/receipts/generate", response_model=TaxReceiptRead, status_code=status.HTTP_201_CREATED)
def generate_tax_receipt(payload: IssueTaxReceiptRequest, db: Session = Depends(get_db)) -> TaxReceipt:
    """Generate an official 80G / 501(c)(3) tax exemption receipt for a contribution."""
    contrib = db.get(Contribution, payload.contribution_id)
    if not contrib:
        raise HTTPException(status_code=404, detail="Contribution not found.")

    cfg = load_localization_config()
    org = cfg.get("organization", {})
    church_name = org.get("name", "St. Luke's Ecclesia Church")
    tax_id = org.get("tax_id_in_80g", "CIT(E)/BLR/80G/2024-25/AABTE1234F")

    # Generate sequential receipt number
    prefix = "80G" if "80G" in payload.tax_regime else "501C3"
    count = db.scalar(select(func.count(TaxReceipt.id))) or 0
    receipt_num = f"{prefix}-{date.today().year}-{count + 1:05d}"

    donor_name = contrib.donor_name
    donor_pan = payload.donor_pan_or_tax_id or contrib.donor_pan_or_tax_id
    donor_addr = None

    if contrib.member_id:
        member = db.get(Member, contrib.member_id)
        if member:
            donor_name = donor_name or f"{member.first_name} {member.last_name}"
            donor_pan = donor_pan or member.pan_number or member.tax_id
            donor_addr = member.address

    receipt = TaxReceipt(
        receipt_number=receipt_num,
        tax_regime=payload.tax_regime,
        member_id=contrib.member_id,
        donor_name=donor_name or "Generous Donor",
        donor_pan_or_tax_id=donor_pan,
        donor_address=donor_addr,
        contribution_id=contrib.id,
        amount=contrib.amount,
        eligible_tax_amount=contrib.amount,
        currency=contrib.currency or "INR",
        financial_year=payload.financial_year,
        issue_date=date.today(),
        authorized_signatory="Rev. Dr. Samuel Thomas (Senior Pastor & Treasurer)",
        church_tax_registration_no=tax_id,
        pdf_download_url=f"/api/v1/compliance/receipts/{receipt_num}/pdf",
        notes=payload.notes,
    )
    db.add(receipt)

    contrib.tax_receipt_issued = True
    contrib.tax_receipt_number = receipt_num

    db.commit()
    db.refresh(receipt)
    return receipt


@router.get("/receipts/{receipt_id}/pdf")
def download_tax_receipt_pdf(receipt_id: int, db: Session = Depends(get_db)) -> Response:
    """Download the official formatted PDF for an 80G or 501(c)(3) receipt."""
    receipt = db.get(TaxReceipt, receipt_id)
    if not receipt:
        raise HTTPException(status_code=404, detail="Tax receipt not found.")

    cfg = load_localization_config()
    org = cfg.get("organization", {})
    church_name = org.get("name", "St. Luke's Ecclesia Church")

    pdf_bytes = generate_tax_receipt_pdf(
        receipt_number=receipt.receipt_number,
        donor_name=receipt.donor_name,
        donor_pan_or_tax_id=receipt.donor_pan_or_tax_id,
        amount=receipt.amount,
        currency=receipt.currency,
        financial_year=receipt.financial_year,
        issue_date=receipt.issue_date,
        tax_regime=receipt.tax_regime,
        church_name=church_name,
        church_tax_id=receipt.church_tax_registration_no,
        signatory=receipt.authorized_signatory,
    )

    filename = f"tax_receipt_{receipt.receipt_number}.pdf"
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'inline; filename="{filename}"'},
    )


# --- Form 10BD Export (India Tax Compliance) ---
@router.get("/form-10bd", response_model=Form10BDExportReport)
def export_form_10bd(
    financial_year: str = "2025-2026",
    db: Session = Depends(get_db),
) -> Form10BDExportReport:
    """Generate Indian Form 10BD annual statement for all 80G donations."""
    receipts = db.scalars(
        select(TaxReceipt).where(
            TaxReceipt.tax_regime == "80G_INDIA",
            TaxReceipt.financial_year == financial_year,
        )
    ).all()

    cfg = load_localization_config()
    org = cfg.get("organization", {})
    church_pan = org.get("pan_number", "AABTE1234F")

    entries = []
    tot_amt = 0.0
    for idx, r in enumerate(receipts, start=1):
        tot_amt += r.amount
        entries.append(
            Form10BDEntry(
                sl_no=idx,
                pre_acknowledgment_number=r.receipt_number,
                unique_donor_id_type="PAN" if r.donor_pan_or_tax_id else "Other",
                unique_donor_id_number=r.donor_pan_or_tax_id or "NOT_PROVIDED",
                donor_name=r.donor_name,
                donor_address=r.donor_address,
                donation_type="Others / General Giving",
                mode_of_receipt="Electronic",
                amount_inr=r.amount,
            )
        )

    return Form10BDExportReport(
        church_pan=church_pan,
        form_type="FORM 10BD (Statement of Donations)",
        financial_year=financial_year,
        total_donations_count=len(entries),
        total_aggregate_amount=round(tot_amt, 2),
        records=entries,
    )


# --- FCRA Foreign Remittances Register ---
@router.get("/fcra", response_model=list[FCRALogRead])
def list_fcra_logs(db: Session = Depends(get_db)) -> list[FCRALog]:
    """List FCRA foreign donation logs for Ministry of Home Affairs compliance."""
    return list(db.scalars(select(FCRALog).order_by(FCRALog.remittance_date.desc())).all())


@router.post("/fcra", response_model=FCRALogRead, status_code=status.HTTP_201_CREATED)
def log_fcra_remittance(payload: FCRALogCreate, db: Session = Depends(get_db)) -> FCRALog:
    """Record an incoming FCRA foreign contribution."""
    log = FCRALog(
        donor_name=payload.donor_name,
        donor_country=payload.donor_country,
        foreign_currency=payload.foreign_currency,
        foreign_amount=payload.foreign_amount,
        inr_realized_amount=payload.inr_realized_amount,
        exchange_rate=payload.exchange_rate,
        fcra_purpose_code=payload.fcra_purpose_code,
        remittance_date=payload.remittance_date,
        firc_reference=payload.firc_reference,
    )
    db.add(log)
    db.commit()
    db.refresh(log)
    return log


# --- UK Gift Aid Claims Report ---
@router.get("/gift-aid-claims", response_model=UKGiftAidClaimReport)
def get_gift_aid_claims(
    tax_year: str = "2025-2026",
    db: Session = Depends(get_db),
) -> UKGiftAidClaimReport:
    """Calculate and export UK Gift Aid 25% tax claims for eligible donors."""
    # Find contributions from members with gift_aid_eligible = True
    eligible_members = db.scalars(select(Member).where(Member.gift_aid_eligible.is_(True))).all()
    member_ids = [m.id for m in eligible_members]

    contributions = db.scalars(
        select(Contribution).where(Contribution.member_id.in_(member_ids))
    ).all() if member_ids else []

    tot_donations = sum(c.amount for c in contributions)
    reclaim = round(tot_donations * 0.25, 2)

    donors_summary = []
    for m in eligible_members:
        m_donations = sum(c.amount for c in contributions if c.member_id == m.id)
        if m_donations > 0:
            donors_summary.append(
                {
                    "member_id": m.id,
                    "donor_name": f"{m.first_name} {m.last_name}",
                    "tax_id": m.tax_id,
                    "donation_total": m_donations,
                    "gift_aid_reclaim_amount": round(m_donations * 0.25, 2),
                }
            )

    return UKGiftAidClaimReport(
        tax_year=tax_year,
        total_gift_aid_donations=round(tot_donations, 2),
        reclaim_rate_percent=25.0,
        total_tax_reclaim_amount=reclaim,
        eligible_donors_count=len(donors_summary),
        donors=donors_summary,
    )
