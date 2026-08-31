"""Milestone Certificates and Dynamic PDF Generation API Endpoints."""

import uuid
from datetime import date
from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.config import load_localization_config
from app.core.pdf_generator import generate_certificate_pdf
from app.database.session import get_db
from app.models.certificates import CertificateTemplate, IssuedCertificate
from app.schemas.certificates import (
    CertificateTemplateRead,
    CertificateVerificationResponse,
    IssueCertificateRequest,
    IssuedCertificateRead,
)

router = APIRouter(prefix="/certificates", tags=["certificates"])


@router.get("/templates", response_model=list[CertificateTemplateRead])
def list_certificate_templates(db: Session = Depends(get_db)) -> list[CertificateTemplate]:
    """List available life milestone certificate templates."""
    return list(db.scalars(select(CertificateTemplate).order_by(CertificateTemplate.type.asc())).all())


@router.get("/issued", response_model=list[IssuedCertificateRead])
def list_issued_certificates(
    certificate_type: str | None = None,
    db: Session = Depends(get_db),
) -> list[IssuedCertificate]:
    """List all issued milestone certificates."""
    query = select(IssuedCertificate)
    if certificate_type:
        query = query.where(IssuedCertificate.certificate_type == certificate_type)
    return list(db.scalars(query.order_by(IssuedCertificate.issue_date.desc())).all())


@router.post("/issue", response_model=IssuedCertificateRead, status_code=status.HTTP_201_CREATED)
def issue_certificate(payload: IssueCertificateRequest, db: Session = Depends(get_db)) -> IssuedCertificate:
    """Issue a new life milestone certificate with unique serial and verification code."""
    # Generate certificate number
    type_code = payload.certificate_type[:3].upper()
    count = db.scalar(
        select(func.count(IssuedCertificate.id)).where(IssuedCertificate.certificate_type == payload.certificate_type)
    ) or 0
    cert_num = f"CERT-{type_code}-{date.today().year}-{count + 1:04d}"
    verification_code = uuid.uuid4().hex[:12].upper()

    config = load_localization_config()
    org = config.get("organization", {})
    default_reg = org.get("tax_id_in_80g") or org.get("pan_number") or org.get("us_ein") or org.get("uk_charity_number")
    default_address = org.get("address")

    cert = IssuedCertificate(
        certificate_number=cert_num,
        certificate_type=payload.certificate_type,
        member_id=payload.member_id,
        recipient_name=payload.recipient_name,
        secondary_name=payload.secondary_name,
        issue_date=payload.issue_date,
        event_date=payload.event_date,
        officiant_name=payload.officiant_name,
        witness_1=payload.witness_1,
        witness_2=payload.witness_2,
        church_name=payload.church_name or org.get("name", "Church Of Christ"),
        church_registration_no=payload.church_registration_no or default_reg,
        church_address=payload.church_address or default_address,
        verification_code=verification_code,
        notes=payload.notes,
        pdf_file_url=f"/api/v1/certificates/issued/{cert_num}/pdf",
    )
    db.add(cert)
    db.commit()
    db.refresh(cert)
    return cert


@router.get("/{certificate_id}/pdf")
def download_certificate_pdf(certificate_id: int, db: Session = Depends(get_db)) -> Response:
    """Generate and download dynamic high-resolution PDF certificate."""
    cert = db.get(IssuedCertificate, certificate_id)
    if not cert:
        raise HTTPException(status_code=404, detail="Certificate not found.")

    config = load_localization_config()
    org = config.get("organization", {})
    church_reg = cert.church_registration_no or org.get("tax_id_in_80g") or org.get("pan_number") or org.get("us_ein") or org.get("uk_charity_number")
    church_addr = cert.church_address or org.get("address")

    pdf_bytes = generate_certificate_pdf(
        certificate_type=cert.certificate_type,
        recipient_name=cert.recipient_name,
        secondary_name=cert.secondary_name,
        event_date=cert.event_date,
        issue_date=cert.issue_date,
        officiant_name=cert.officiant_name,
        church_name=cert.church_name,
        certificate_number=cert.certificate_number,
        verification_code=cert.verification_code,
        witness_1=cert.witness_1,
        witness_2=cert.witness_2,
        church_registration_no=church_reg,
        church_address=church_addr,
    )

    filename = f"{cert.certificate_type.lower()}_certificate_{cert.certificate_number}.pdf"
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'inline; filename="{filename}"'},
    )


@router.get("/verify/{verification_code}", response_model=CertificateVerificationResponse)
def verify_certificate(verification_code: str, db: Session = Depends(get_db)) -> CertificateVerificationResponse:
    """Public QR code / serial verification endpoint for issued certificates."""
    cert = db.scalar(
        select(IssuedCertificate).where(IssuedCertificate.verification_code == verification_code.strip().upper())
    )
    if not cert:
        return CertificateVerificationResponse(is_valid=False)

    return CertificateVerificationResponse(
        is_valid=True,
        certificate_number=cert.certificate_number,
        recipient_name=cert.recipient_name,
        certificate_type=cert.certificate_type,
        event_date=cert.event_date,
        officiant_name=cert.officiant_name,
        church_name=cert.church_name,
        issued_at=cert.created_at,
    )
