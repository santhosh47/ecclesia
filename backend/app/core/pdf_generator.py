"""Dynamic PDF Generator for Life Milestone Certificates and Tax Exemption Receipts."""

import io
from datetime import date


def _escape_pdf_text(text: str) -> str:
    """Escape special characters for raw PDF text stream."""
    return text.replace("\\", "\\\\").replace("(", "\\(").replace(")", "\\)")


def generate_certificate_pdf(
    certificate_type: str,
    recipient_name: str,
    secondary_name: str | None,
    event_date: date,
    issue_date: date,
    officiant_name: str,
    church_name: str,
    certificate_number: str,
    verification_code: str,
    witness_1: str | None = None,
    witness_2: str | None = None,
) -> bytes:
    """Generate a clean, high-resolution A4 Landscape PDF certificate."""

    # Pre-format values
    formatted_event_date = event_date.strftime("%B %d, %Y")
    formatted_issue_date = issue_date.strftime("%B %d, %Y")
    
    scriptures = {
        "Baptism": "Matthew 28:19 - 'Go therefore and make disciples of all nations, baptizing them in the name of the Father and of the Son and of the Holy Spirit.'",
        "Wedding": "Mark 10:9 - 'What therefore God has joined together, let not man put asunder.'",
        "Child Dedication": "1 Samuel 1:27-28 - 'For this child I prayed, and the Lord has granted me my petition.'",
        "Confirmation": "2 Timothy 1:6 - 'Fan into flame the gift of God, which is in you through the laying on of hands.'",
        "Membership": "Ephesians 2:19 - 'So then you are no longer strangers and aliens, but you are fellow citizens with the saints and members of the household of God.'",
    }
    scripture_text = scriptures.get(certificate_type, "Colossians 3:17 - Whatever you do, in word or deed, do everything in the name of the Lord Jesus.")

    # PDF Stream construction (A4 Landscape: 842 x 595 points)
    w, h = 842, 595
    stream = []
    
    # Background fill
    stream.append("0.98 0.97 0.94 rg")  # Warm parchment cream
    stream.append(f"0 0 {w} {h} re f")
    
    # Outer Border (Gold / Bronze)
    stream.append("0.75 0.60 0.20 RG 4 w")
    stream.append(f"30 30 {w-60} {h-60} re S")
    
    # Inner Border (Thin Dark Slate)
    stream.append("0.20 0.25 0.35 RG 1.5 w")
    stream.append(f"40 40 {w-80} {h-80} re S")
    
    # Corner Accents
    corner_size = 20
    for cx, cy in [(40, 40), (w-40, 40), (40, h-40), (w-40, h-40)]:
        stream.append(f"0.75 0.60 0.20 RG 1 w")
        stream.append(f"{cx-corner_size} {cy} m {cx+corner_size} {cy} l S")
        stream.append(f"{cx} {cy-corner_size} m {cx} {cy+corner_size} l S")

    # Text Objects
    # Header: Church Name
    stream.append("BT")
    stream.append("/F1 20 Tf")
    stream.append("0.20 0.25 0.35 rg")
    stream.append(f"1 0 0 1 220 {h - 85} Tm")
    stream.append(f"({_escape_pdf_text(church_name.upper())}) Tj")
    stream.append("ET")

    # Certificate Title
    stream.append("BT")
    stream.append("/F2 28 Tf")
    stream.append("0.75 0.55 0.15 rg")
    title_text = f"CERTIFICATE OF {certificate_type.upper()}"
    stream.append(f"1 0 0 1 200 {h - 130} Tm")
    stream.append(f"({_escape_pdf_text(title_text)}) Tj")
    stream.append("ET")

    # Body Intro
    stream.append("BT")
    stream.append("/F1 14 Tf")
    stream.append("0.35 0.35 0.35 rg")
    stream.append(f"1 0 0 1 330 {h - 175} Tm")
    stream.append("(This is proudly presented to) Tj")
    stream.append("ET")

    # Recipient Name (Large, Prominent)
    stream.append("BT")
    stream.append("/F2 32 Tf")
    stream.append("0.12 0.18 0.30 rg")
    stream.append(f"1 0 0 1 200 {h - 225} Tm")
    stream.append(f"({_escape_pdf_text(recipient_name)}) Tj")
    stream.append("ET")
    
    # Decorative underline below recipient
    stream.append("0.75 0.60 0.20 RG 2 w")
    stream.append(f"180 {h - 235} m {w - 180} {h - 235} l S")

    # Secondary text or description
    stream.append("BT")
    stream.append("/F1 13 Tf")
    stream.append("0.25 0.25 0.25 rg")
    if secondary_name:
        desc_text = f"United in faith with {_escape_pdf_text(secondary_name)} on {formatted_event_date}"
    else:
        desc_text = f"Having publicly confessed faith in Jesus Christ and received on {formatted_event_date}"
    stream.append(f"1 0 0 1 150 {h - 275} Tm")
    stream.append(f"({_escape_pdf_text(desc_text)}) Tj")
    stream.append("ET")

    # Scripture Verse
    stream.append("BT")
    stream.append("/F1 10 Tf")
    stream.append("0.45 0.45 0.45 rg")
    stream.append(f"1 0 0 1 100 {h - 320} Tm")
    stream.append(f"({_escape_pdf_text(scripture_text[:110])}) Tj")
    stream.append("ET")

    # Signatures
    # Left Signatory: Officiant
    stream.append("0.20 0.25 0.35 RG 1 w")
    stream.append(f"100 {h - 430} m 340 {h - 430} l S")
    stream.append("BT")
    stream.append("/F2 12 Tf")
    stream.append("0.15 0.20 0.30 rg")
    stream.append(f"1 0 0 1 100 {h - 448} Tm")
    stream.append(f"({_escape_pdf_text(officiant_name)}) Tj")
    stream.append("/F1 10 Tf")
    stream.append("0.40 0.40 0.40 rg")
    stream.append(f"1 0 0 1 100 {h - 464} Tm")
    stream.append("(Senior Pastor / Officiant) Tj")
    stream.append("ET")

    # Right Signatory: Church Elder / Witness
    witness_display = witness_1 or "Church Secretary & Session Clerk"
    stream.append(f"500 {h - 430} m 740 {h - 430} l S")
    stream.append("BT")
    stream.append("/F2 12 Tf")
    stream.append("0.15 0.20 0.30 rg")
    stream.append(f"1 0 0 1 500 {h - 448} Tm")
    stream.append(f"({_escape_pdf_text(witness_display)}) Tj")
    stream.append("/F1 10 Tf")
    stream.append("0.40 0.40 0.40 rg")
    stream.append(f"1 0 0 1 500 {h - 464} Tm")
    stream.append("(Authorized Church Official / Witness) Tj")
    stream.append("ET")

    # Footer: Certificate Number & Verification UUID
    stream.append("BT")
    stream.append("/F1 9 Tf")
    stream.append("0.50 0.50 0.50 rg")
    stream.append(f"1 0 0 1 60 55 Tm")
    stream.append(f"(Certificate No: {_escape_pdf_text(certificate_number)}   |   Issued: {_escape_pdf_text(formatted_issue_date)}   |   Verification Code: {_escape_pdf_text(verification_code)}) Tj")
    stream.append("ET")

    content = "\n".join(stream)
    content_bytes = content.encode("latin1", errors="replace")

    # Assemble complete PDF Document Objects
    pdf_objects = []
    # 1: Catalog
    pdf_objects.append(b"<< /Type /Catalog /Pages 2 0 R >>")
    # 2: Pages
    pdf_objects.append(f"<< /Type /Pages /Kids [3 0 R] /Count 1 >>".encode("ascii"))
    # 3: Page (Landscape 842 x 595)
    pdf_objects.append(
        f"<< /Type /Page /Parent 2 0 R /MediaBox [0 0 {w} {h}] /Contents 4 0 R /Resources << /Font << /F1 << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> /F2 << /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >> >> >> >>".encode("ascii")
    )
    # 4: Stream
    pdf_objects.append(
        f"<< /Length {len(content_bytes)} >>\nstream\n".encode("ascii") + content_bytes + b"\nendstream"
    )

    # Build PDF with xref table
    out = io.BytesIO()
    out.write(b"%PDF-1.4\n")
    offsets = []
    for i, obj in enumerate(pdf_objects, start=1):
        offsets.append(out.tell())
        out.write(f"{i} 0 obj\n".encode("ascii"))
        out.write(obj)
        out.write(b"\nendobj\n")

    xref_offset = out.tell()
    out.write(f"xref\n0 {len(pdf_objects) + 1}\n0000000000 65535 f \n".encode("ascii"))
    for offset in offsets:
        out.write(f"{offset:010d} 00000 n \n".encode("ascii"))
    out.write(
        f"trailer\n<< /Size {len(pdf_objects) + 1} /Root 1 0 R >>\nstartxref\n{xref_offset}\n%%EOF\n".encode("ascii")
    )
    return out.getvalue()


def generate_tax_receipt_pdf(
    receipt_number: str,
    donor_name: str,
    donor_pan_or_tax_id: str | None,
    amount: float,
    currency: str,
    financial_year: str,
    issue_date: date,
    tax_regime: str,
    church_name: str,
    church_tax_id: str,
    signatory: str,
) -> bytes:
    """Generate an official 80G / 501(c)(3) / UK Gift Aid tax exemption receipt PDF (A4 Portrait: 595 x 842)."""
    
    w, h = 595, 842
    formatted_date = issue_date.strftime("%B %d, %Y")
    currency_symbol = "Rs. " if currency == "INR" else ("$ " if currency == "USD" else f"{currency} ")

    stream = []
    
    # White background
    stream.append("1 1 1 rg")
    stream.append(f"0 0 {w} {h} re f")
    
    # Header box (Deep Navy)
    stream.append("0.10 0.18 0.32 rg")
    stream.append(f"40 {h - 130} {w - 80} 90 re f")
    
    # Church Title
    stream.append("BT")
    stream.append("/F2 18 Tf")
    stream.append("1 1 1 rg")
    stream.append(f"1 0 0 1 60 {h - 75} Tm")
    stream.append(f"({_escape_pdf_text(church_name)}) Tj")
    stream.append("/F1 10 Tf")
    stream.append(f"1 0 0 1 60 {h - 95} Tm")
    stream.append(f"(Tax Exemption Registration No: {_escape_pdf_text(church_tax_id)}) Tj")
    stream.append("ET")

    # Document Type Title
    if "80G" in tax_regime:
        doc_title = "SECTION 80G DONATION TAX RECEIPT (INCOME TAX ACT, 1961)"
        regime_note = "Donations are eligible for tax deduction under Section 80G of the Indian Income Tax Act."
    elif "501C3" in tax_regime or "501" in tax_regime:
        doc_title = "OFFICIAL 501(c)(3) CHARITABLE DONATION TAX RECEIPT"
        regime_note = "Ecclesia Church is a registered 501(c)(3) non-profit religious organization. No goods or services were provided in exchange for this contribution."
    elif "GIFT_AID" in tax_regime:
        doc_title = "UK GIFT AID DONOR CERTIFICATE AND DECLARATION"
        regime_note = "This donation qualifies for a 25% Gift Aid tax reclaim under HMRC regulations."
    else:
        doc_title = "OFFICIAL CHARITABLE CONTRIBUTION RECEIPT"
        regime_note = "Official tax exemption acknowledgment for charitable giving."

    stream.append("BT")
    stream.append("/F2 13 Tf")
    stream.append("0.10 0.18 0.32 rg")
    stream.append(f"1 0 0 1 50 {h - 165} Tm")
    stream.append(f"({_escape_pdf_text(doc_title)}) Tj")
    stream.append("ET")

    # Table / Summary Box
    stream.append("0.85 0.85 0.85 RG 1 w")
    stream.append(f"40 {h - 430} {w - 80} 240 re S")
    
    # Rows
    labels_values = [
        ("Receipt Number:", receipt_number),
        ("Financial / Tax Year:", financial_year),
        ("Date of Issue:", formatted_date),
        ("Donor Full Name:", donor_name),
        ("Donor PAN / Tax ID:", donor_pan_or_tax_id or "Not Provided"),
        ("Contribution Amount:", f"{currency_symbol}{amount:,.2f}"),
        ("Eligible Deductible Amount:", f"{currency_symbol}{amount:,.2f}"),
        ("Payment Mode:", "Electronic Bank Transfer / Online"),
    ]

    y_pos = h - 200
    for label, val in labels_values:
        stream.append("BT")
        stream.append("/F2 10 Tf")
        stream.append("0.25 0.25 0.25 rg")
        stream.append(f"1 0 0 1 60 {y_pos} Tm")
        stream.append(f"({_escape_pdf_text(label)}) Tj")
        stream.append("/F1 10 Tf")
        stream.append("0.10 0.10 0.10 rg")
        stream.append(f"1 0 0 1 240 {y_pos} Tm")
        stream.append(f"({_escape_pdf_text(val)}) Tj")
        stream.append("ET")
        y_pos -= 26

    # Compliance Note
    stream.append("BT")
    stream.append("/F1 9 Tf")
    stream.append("0.40 0.40 0.40 rg")
    stream.append(f"1 0 0 1 50 {h - 460} Tm")
    stream.append(f"({_escape_pdf_text(regime_note)}) Tj")
    stream.append("ET")

    # Signatory Line
    stream.append("0.30 0.30 0.30 RG 1 w")
    stream.append(f"60 {h - 570} m 280 {h - 570} l S")
    stream.append("BT")
    stream.append("/F2 11 Tf")
    stream.append("0.10 0.18 0.32 rg")
    stream.append(f"1 0 0 1 60 {h - 588} Tm")
    stream.append(f"({_escape_pdf_text(signatory)}) Tj")
    stream.append("/F1 9 Tf")
    stream.append("0.40 0.40 0.40 rg")
    stream.append(f"1 0 0 1 60 {h - 604} Tm")
    stream.append("(Authorized Signatory & Seal)")
    stream.append("ET")

    # Verification footer
    stream.append("BT")
    stream.append("/F1 8 Tf")
    stream.append("0.55 0.55 0.55 rg")
    stream.append(f"1 0 0 1 50 40 Tm")
    stream.append(f"(Generated electronically by Ecclesia ChMS  |  Verification Serial: {receipt_number}) Tj")
    stream.append("ET")

    content = "\n".join(stream)
    content_bytes = content.encode("latin1", errors="replace")

    pdf_objects = [
        b"<< /Type /Catalog /Pages 2 0 R >>",
        f"<< /Type /Pages /Kids [3 0 R] /Count 1 >>".encode("ascii"),
        f"<< /Type /Page /Parent 2 0 R /MediaBox [0 0 {w} {h}] /Contents 4 0 R /Resources << /Font << /F1 << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> /F2 << /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >> >> >> >>".encode("ascii"),
        f"<< /Length {len(content_bytes)} >>\nstream\n".encode("ascii") + content_bytes + b"\nendstream",
    ]

    out = io.BytesIO()
    out.write(b"%PDF-1.4\n")
    offsets = []
    for i, obj in enumerate(pdf_objects, start=1):
        offsets.append(out.tell())
        out.write(f"{i} 0 obj\n".encode("ascii"))
        out.write(obj)
        out.write(b"\nendobj\n")

    xref_offset = out.tell()
    out.write(f"xref\n0 {len(pdf_objects) + 1}\n0000000000 65535 f \n".encode("ascii"))
    for offset in offsets:
        out.write(f"{offset:010d} 00000 n \n".encode("ascii"))
    out.write(
        f"trailer\n<< /Size {len(pdf_objects) + 1} /Root 1 0 R >>\nstartxref\n{xref_offset}\n%%EOF\n".encode("ascii")
    )
    return out.getvalue()
