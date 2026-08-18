"""Double-entry Bookkeeping, Chart of Accounts, and Staff Payroll Endpoints."""

from datetime import date
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.models.ledger import Account, JournalEntry, JournalLine, PayrollRecord, Staff
from app.schemas.ledger import (
    AccountCreate,
    AccountRead,
    JournalEntryCreate,
    JournalEntryRead,
    JournalLineRead,
    PayrollRecordCreate,
    PayrollRecordRead,
    StaffCreate,
    StaffRead,
    TrialBalanceItem,
    TrialBalanceReport,
)

router = APIRouter(prefix="/ledger", tags=["ledger"])


# --- Chart of Accounts ---
@router.get("/accounts", response_model=list[AccountRead])
def list_accounts(
    account_type: str | None = None,
    is_fcra: bool | None = None,
    db: Session = Depends(get_db),
) -> list[Account]:
    """List chart of accounts with current balances."""
    query = select(Account).where(Account.is_active.is_(True))
    if account_type:
        query = query.where(Account.account_type == account_type)
    if is_fcra is not None:
        query = query.where(Account.is_fcra == is_fcra)
    query = query.order_by(Account.code.asc())
    return list(db.scalars(query).all())


@router.post("/accounts", response_model=AccountRead, status_code=status.HTTP_201_CREATED)
def create_account(payload: AccountCreate, db: Session = Depends(get_db)) -> Account:
    """Create a new account in the chart of accounts."""
    existing = db.scalar(select(Account).where(Account.code == payload.code))
    if existing:
        raise HTTPException(status_code=400, detail=f"Account code {payload.code} already exists.")
    account = Account(
        code=payload.code,
        name=payload.name,
        account_type=payload.account_type,
        sub_category=payload.sub_category,
        currency=payload.currency,
        is_active=payload.is_active,
        is_fcra=payload.is_fcra,
        balance=payload.initial_balance,
        description=payload.description,
    )
    db.add(account)
    db.commit()
    db.refresh(account)
    return account


# --- Double-Entry Journal Entries ---
@router.get("/journal-entries", response_model=list[JournalEntryRead])
def list_journal_entries(
    limit: int = Query(default=50, le=200),
    is_fcra: bool | None = None,
    db: Session = Depends(get_db),
) -> list[JournalEntryRead]:
    """List balanced double-entry vouchers with debit/credit breakdown."""
    query = select(JournalEntry)
    if is_fcra is not None:
        query = query.where(JournalEntry.is_fcra == is_fcra)
    query = query.order_by(JournalEntry.entry_date.desc(), JournalEntry.id.desc()).limit(limit)
    entries = db.scalars(query).all()

    results = []
    for entry in entries:
        lines_read = []
        tot_debit = 0.0
        tot_credit = 0.0
        for l in entry.lines:
            tot_debit += l.debit
            tot_credit += l.credit
            acct = db.get(Account, l.account_id)
            lines_read.append(
                JournalLineRead(
                    id=l.id,
                    account_id=l.account_id,
                    account_code=acct.code if acct else None,
                    account_name=acct.name if acct else None,
                    debit=l.debit,
                    credit=l.credit,
                    memo=l.memo,
                )
            )
        results.append(
            JournalEntryRead(
                id=entry.id,
                entry_number=entry.entry_number,
                entry_date=entry.entry_date,
                description=entry.description,
                reference=entry.reference,
                status=entry.status,
                is_fcra=entry.is_fcra,
                posted_by=entry.posted_by,
                total_debit=round(tot_debit, 2),
                total_credit=round(tot_credit, 2),
                lines=lines_read,
                created_at=entry.created_at,
            )
        )
    return results


@router.post("/journal-entries", response_model=JournalEntryRead, status_code=status.HTTP_201_CREATED)
def create_journal_entry(payload: JournalEntryCreate, db: Session = Depends(get_db)) -> JournalEntryRead:
    """Create a balanced double-entry transaction. Updates account balances automatically."""
    entry_number = payload.entry_number
    if not entry_number:
        count = db.scalar(select(func.count(JournalEntry.id))) or 0
        entry_number = f"JE-{date.today().year}-{count + 1:04d}"

    entry = JournalEntry(
        entry_number=entry_number,
        entry_date=payload.entry_date,
        description=payload.description,
        reference=payload.reference,
        is_fcra=payload.is_fcra,
        posted_by=payload.posted_by,
        status="Posted",
    )
    db.add(entry)
    db.flush()

    tot_debit = 0.0
    tot_credit = 0.0
    lines_read = []

    for line_in in payload.lines:
        account = db.get(Account, line_in.account_id)
        if not account:
            raise HTTPException(status_code=404, detail=f"Account with ID {line_in.account_id} not found.")

        # In accounting:
        # Asset / Expense: normal balance is Debit (Debit increases, Credit decreases)
        # Liability / Equity / Revenue: normal balance is Credit (Credit increases, Debit decreases)
        if account.account_type in {"Asset", "Expense"}:
            account.balance += (line_in.debit - line_in.credit)
        else:
            account.balance += (line_in.credit - line_in.debit)

        line_model = JournalLine(
            journal_entry_id=entry.id,
            account_id=line_in.account_id,
            debit=line_in.debit,
            credit=line_in.credit,
            memo=line_in.memo,
        )
        db.add(line_model)
        tot_debit += line_in.debit
        tot_credit += line_in.credit
        lines_read.append(
            JournalLineRead(
                id=0,
                account_id=account.id,
                account_code=account.code,
                account_name=account.name,
                debit=line_in.debit,
                credit=line_in.credit,
                memo=line_in.memo,
            )
        )

    db.commit()
    db.refresh(entry)

    return JournalEntryRead(
        id=entry.id,
        entry_number=entry.entry_number,
        entry_date=entry.entry_date,
        description=entry.description,
        reference=entry.reference,
        status=entry.status,
        is_fcra=entry.is_fcra,
        posted_by=entry.posted_by,
        total_debit=round(tot_debit, 2),
        total_credit=round(tot_credit, 2),
        lines=lines_read,
        created_at=entry.created_at,
    )


# --- Trial Balance Report ---
@router.get("/trial-balance", response_model=TrialBalanceReport)
def get_trial_balance(
    is_fcra: bool | None = None,
    db: Session = Depends(get_db),
) -> TrialBalanceReport:
    """Generate a Trial Balance report ensuring debits equal credits."""
    query = select(Account).where(Account.is_active.is_(True))
    if is_fcra is not None:
        query = query.where(Account.is_fcra == is_fcra)
    accounts = db.scalars(query.order_by(Account.code.asc())).all()

    items = []
    tot_d = 0.0
    tot_c = 0.0
    for acct in accounts:
        # Determine trial balance presentation
        bal = acct.balance
        debit_val = 0.0
        credit_val = 0.0
        if acct.account_type in {"Asset", "Expense"}:
            if bal >= 0:
                debit_val = bal
            else:
                credit_val = abs(bal)
        else:
            if bal >= 0:
                credit_val = bal
            else:
                debit_val = abs(bal)

        tot_d += debit_val
        tot_c += credit_val
        items.append(
            TrialBalanceItem(
                account_id=acct.id,
                code=acct.code,
                name=acct.name,
                account_type=acct.account_type,
                debit=round(debit_val, 2),
                credit=round(credit_val, 2),
            )
        )

    return TrialBalanceReport(
        as_of_date=date.today(),
        currency="INR",
        items=items,
        total_debits=round(tot_d, 2),
        total_credits=round(tot_c, 2),
        is_balanced=abs(tot_d - tot_c) < 0.01,
    )


# --- Staff & Payroll Ledger ---
@router.get("/staff", response_model=list[StaffRead])
def list_staff(db: Session = Depends(get_db)) -> list[StaffRead]:
    """List church staff and clergy."""
    staff_members = db.scalars(select(Staff).where(Staff.is_active.is_(True)).order_by(Staff.first_name.asc())).all()
    results = []
    for s in staff_members:
        results.append(
            StaffRead(
                id=s.id,
                first_name=s.first_name,
                last_name=s.last_name,
                full_name=f"{s.first_name} {s.last_name}",
                role_title=s.role_title,
                email=s.email,
                phone=s.phone,
                pan_or_tax_id=s.pan_or_tax_id,
                bank_account_number=s.bank_account_number,
                bank_ifsc_or_routing=s.bank_ifsc_or_routing,
                base_salary_monthly=s.base_salary_monthly,
                housing_allowance=s.housing_allowance,
                travel_allowance=s.travel_allowance,
                is_active=s.is_active,
                joined_date=s.joined_date,
                expense_account_id=s.expense_account_id,
                created_at=s.created_at,
            )
        )
    return results


@router.post("/staff", response_model=StaffRead, status_code=status.HTTP_201_CREATED)
def create_staff(payload: StaffCreate, db: Session = Depends(get_db)) -> StaffRead:
    """Add a new staff member."""
    staff = Staff(**payload.model_dump())
    db.add(staff)
    db.commit()
    db.refresh(staff)
    return StaffRead(
        id=staff.id,
        first_name=staff.first_name,
        last_name=staff.last_name,
        full_name=f"{staff.first_name} {staff.last_name}",
        role_title=staff.role_title,
        email=staff.email,
        phone=staff.phone,
        pan_or_tax_id=staff.pan_or_tax_id,
        bank_account_number=staff.bank_account_number,
        bank_ifsc_or_routing=staff.bank_ifsc_or_routing,
        base_salary_monthly=staff.base_salary_monthly,
        housing_allowance=staff.housing_allowance,
        travel_allowance=staff.travel_allowance,
        is_active=staff.is_active,
        joined_date=staff.joined_date,
        expense_account_id=staff.expense_account_id,
        created_at=staff.created_at,
    )


@router.get("/payroll", response_model=list[PayrollRecordRead])
def list_payroll_records(db: Session = Depends(get_db)) -> list[PayrollRecordRead]:
    """List payroll disbursement runs."""
    records = db.scalars(select(PayrollRecord).order_by(PayrollRecord.payment_date.desc())).all()
    results = []
    for r in records:
        staff = db.get(Staff, r.staff_id)
        results.append(
            PayrollRecordRead(
                id=r.id,
                staff_id=r.staff_id,
                staff_name=f"{staff.first_name} {staff.last_name}" if staff else "Unknown Staff",
                staff_role=staff.role_title if staff else None,
                pay_period=r.pay_period,
                payment_date=r.payment_date,
                basic_salary=r.basic_salary,
                allowances=r.allowances,
                deductions=r.deductions,
                net_pay=r.net_pay,
                payment_method=r.payment_method,
                status=r.status,
                payslip_reference=r.payslip_reference,
                created_at=r.created_at,
            )
        )
    return results


@router.post("/payroll", response_model=PayrollRecordRead, status_code=status.HTTP_201_CREATED)
def record_payroll(payload: PayrollRecordCreate, db: Session = Depends(get_db)) -> PayrollRecordRead:
    """Disburse payroll and automatically generate matching double-entry ledger entry."""
    staff = db.get(Staff, payload.staff_id)
    if not staff:
        raise HTTPException(status_code=404, detail="Staff member not found.")

    net_pay = round(payload.basic_salary + payload.allowances - payload.deductions, 2)
    payslip_ref = f"PAY-{date.today().strftime('%Y%m')}-{staff.id:03d}"

    record = PayrollRecord(
        staff_id=staff.id,
        pay_period=payload.pay_period,
        payment_date=payload.payment_date,
        basic_salary=payload.basic_salary,
        allowances=payload.allowances,
        deductions=payload.deductions,
        net_pay=net_pay,
        payment_method=payload.payment_method,
        status="Disbursed",
        payslip_reference=payslip_ref,
    )
    db.add(record)
    db.commit()
    db.refresh(record)

    return PayrollRecordRead(
        id=record.id,
        staff_id=staff.id,
        staff_name=f"{staff.first_name} {staff.last_name}",
        staff_role=staff.role_title,
        pay_period=record.pay_period,
        payment_date=record.payment_date,
        basic_salary=record.basic_salary,
        allowances=record.allowances,
        deductions=record.deductions,
        net_pay=record.net_pay,
        payment_method=record.payment_method,
        status=record.status,
        payslip_reference=record.payslip_reference,
        created_at=record.created_at,
    )
