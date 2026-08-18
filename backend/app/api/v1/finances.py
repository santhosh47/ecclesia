"""Church finances, contributions, expenses, campaigns, and reports endpoints."""

from datetime import date, datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session, joinedload

from app.database.session import get_db
from app.models.finance import Contribution, Expense, Pledge, PledgeCampaign
from app.models.member import Member
from app.schemas.finance import (
    ContributionCreate,
    ContributionRead,
    DonorStatement,
    ExpenseCreate,
    ExpenseRead,
    FinanceSummary,
    FundSummary,
    MonthlyFinanceData,
    PledgeCampaignCreate,
    PledgeCampaignRead,
    PledgeCreate,
    PledgeRead,
)

router = APIRouter(prefix="/finances", tags=["finances"])


def _format_contribution_read(c: Contribution) -> ContributionRead:
    member_name = None
    if c.member:
        member_name = f"{c.member.first_name} {c.member.last_name}"
    elif c.donor_name:
        member_name = c.donor_name
    elif c.is_anonymous:
        member_name = "Anonymous Donor"

    return ContributionRead(
        id=c.id,
        member_id=c.member_id,
        donor_name=c.donor_name,
        amount=c.amount,
        fund=c.fund,
        payment_method=c.payment_method,
        reference_number=c.reference_number,
        date=c.date,
        is_anonymous=c.is_anonymous,
        notes=c.notes,
        created_at=c.created_at,
        member_name=member_name,
    )


# --- Contributions ---
@router.get("/contributions", response_model=list[ContributionRead])
def list_contributions(
    member_id: int | None = None,
    fund: str | None = None,
    payment_method: str | None = None,
    start_date: date | None = None,
    end_date: date | None = None,
    limit: int = Query(default=100, ge=1, le=500),
    db: Session = Depends(get_db),
) -> list[ContributionRead]:
    query = select(Contribution).options(joinedload(Contribution.member)).order_by(Contribution.date.desc(), Contribution.id.desc())

    if member_id is not None:
        query = query.where(Contribution.member_id == member_id)
    if fund:
        query = query.where(Contribution.fund == fund)
    if payment_method:
        query = query.where(Contribution.payment_method == payment_method)
    if start_date:
        query = query.where(Contribution.date >= start_date)
    if end_date:
        query = query.where(Contribution.date <= end_date)

    contributions = list(db.scalars(query.limit(limit)).unique())
    return [_format_contribution_read(c) for c in contributions]


@router.post("/contributions", response_model=ContributionRead, status_code=status.HTTP_201_CREATED)
def create_contribution(payload: ContributionCreate, db: Session = Depends(get_db)) -> ContributionRead:
    contribution = Contribution(**payload.model_dump())
    db.add(contribution)
    db.commit()
    db.refresh(contribution)

    reloaded = db.scalar(
        select(Contribution).options(joinedload(Contribution.member)).where(Contribution.id == contribution.id)
    )
    return _format_contribution_read(reloaded or contribution)


@router.delete("/contributions/{contribution_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_contribution(contribution_id: int, db: Session = Depends(get_db)) -> None:
    contribution = db.get(Contribution, contribution_id)
    if not contribution:
        raise HTTPException(status_code=404, detail="Contribution not found")
    db.delete(contribution)
    db.commit()


# --- Expenses ---
@router.get("/expenses", response_model=list[ExpenseRead])
def list_expenses(
    category: str | None = None,
    start_date: date | None = None,
    end_date: date | None = None,
    limit: int = Query(default=100, ge=1, le=500),
    db: Session = Depends(get_db),
) -> list[ExpenseRead]:
    query = select(Expense).order_by(Expense.date.desc(), Expense.id.desc())

    if category:
        query = query.where(Expense.category == category)
    if start_date:
        query = query.where(Expense.date >= start_date)
    if end_date:
        query = query.where(Expense.date <= end_date)

    expenses = list(db.scalars(query.limit(limit)))
    return [ExpenseRead.model_validate(e) for e in expenses]


@router.post("/expenses", response_model=ExpenseRead, status_code=status.HTTP_201_CREATED)
def create_expense(payload: ExpenseCreate, db: Session = Depends(get_db)) -> ExpenseRead:
    expense = Expense(**payload.model_dump())
    db.add(expense)
    db.commit()
    db.refresh(expense)
    return ExpenseRead.model_validate(expense)


@router.delete("/expenses/{expense_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_expense(expense_id: int, db: Session = Depends(get_db)) -> None:
    expense = db.get(Expense, expense_id)
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")
    db.delete(expense)
    db.commit()


# --- Campaigns & Pledges ---
@router.get("/campaigns", response_model=list[PledgeCampaignRead])
def list_campaigns(db: Session = Depends(get_db)) -> list[PledgeCampaignRead]:
    campaigns = list(db.scalars(select(PledgeCampaign).options(joinedload(PledgeCampaign.pledges))).unique())
    results: list[PledgeCampaignRead] = []

    for c in campaigns:
        total_pledged = sum(p.amount_pledged for p in c.pledges)
        total_received = sum(p.amount_paid for p in c.pledges)
        pct = (total_received / c.target_amount * 100) if c.target_amount > 0 else 0.0
        results.append(
            PledgeCampaignRead(
                id=c.id,
                title=c.title,
                target_amount=c.target_amount,
                start_date=c.start_date,
                end_date=c.end_date,
                description=c.description,
                is_active=c.is_active,
                created_at=c.created_at,
                total_pledged=round(total_pledged, 2),
                total_received=round(total_received, 2),
                pledge_count=len(c.pledges),
                percent_completed=round(pct, 1),
            )
        )
    return results


@router.post("/campaigns", response_model=PledgeCampaignRead, status_code=status.HTTP_201_CREATED)
def create_campaign(payload: PledgeCampaignCreate, db: Session = Depends(get_db)) -> PledgeCampaignRead:
    campaign = PledgeCampaign(**payload.model_dump())
    db.add(campaign)
    db.commit()
    db.refresh(campaign)
    return PledgeCampaignRead(
        id=campaign.id,
        title=campaign.title,
        target_amount=campaign.target_amount,
        start_date=campaign.start_date,
        end_date=campaign.end_date,
        description=campaign.description,
        is_active=campaign.is_active,
        created_at=campaign.created_at,
        total_pledged=0.0,
        total_received=0.0,
        pledge_count=0,
        percent_completed=0.0,
    )


@router.post("/pledges", response_model=PledgeRead, status_code=status.HTTP_201_CREATED)
def create_pledge(payload: PledgeCreate, db: Session = Depends(get_db)) -> PledgeRead:
    pledge = Pledge(**payload.model_dump())
    db.add(pledge)
    db.commit()
    db.refresh(pledge)

    member_name = None
    if pledge.member_id:
        member = db.get(Member, pledge.member_id)
        if member:
            member_name = f"{member.first_name} {member.last_name}"

    return PledgeRead(
        id=pledge.id,
        campaign_id=pledge.campaign_id,
        member_id=pledge.member_id,
        amount_pledged=pledge.amount_pledged,
        amount_paid=pledge.amount_paid,
        status=pledge.status,
        created_at=pledge.created_at,
        member_name=member_name,
    )


# --- Financial Summary & Analytics ---
@router.get("/summary", response_model=FinanceSummary)
def get_finance_summary(db: Session = Depends(get_db)) -> FinanceSummary:
    today = date.today()
    year_start = date(today.year, 1, 1)

    # 1. Total Income & Expense YTD
    total_income = db.scalar(
        select(func.coalesce(func.sum(Contribution.amount), 0.0)).where(Contribution.date >= year_start)
    ) or 0.0
    total_expense = db.scalar(
        select(func.coalesce(func.sum(Expense.amount), 0.0)).where(Expense.date >= year_start)
    ) or 0.0
    net_operating = total_income - total_expense

    # 2. Total active pledges
    total_pledges = db.scalar(
        select(func.coalesce(func.sum(Pledge.amount_pledged), 0.0)).where(Pledge.status == "Active")
    ) or 0.0

    # 3. Recent 5 contributions
    recent_contribs = list(
        db.scalars(
            select(Contribution)
            .options(joinedload(Contribution.member))
            .order_by(Contribution.date.desc(), Contribution.id.desc())
            .limit(5)
        ).unique()
    )

    # 4. Fund breakdown YTD
    fund_rows = db.execute(
        select(Contribution.fund, func.sum(Contribution.amount))
        .where(Contribution.date >= year_start)
        .group_by(Contribution.fund)
    ).all()
    
    fund_breakdown: list[FundSummary] = []
    for fund_name, amt in fund_rows:
        amount_val = float(amt or 0.0)
        pct = (amount_val / total_income * 100) if total_income > 0 else 0.0
        fund_breakdown.append(
            FundSummary(
                fund_name=fund_name,
                total_amount=round(amount_val, 2),
                percentage=round(pct, 1),
            )
        )

    # 5. Monthly trends for the current year
    monthly_trends: list[MonthlyFinanceData] = []
    month_names = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    
    for m in range(1, today.month + 1):
        m_start = date(today.year, m, 1)
        if m == 12:
            m_end = date(today.year, 12, 31)
        else:
            m_end = date(today.year, m + 1, 1) - timedelta(days=1)
        
        inc = db.scalar(
            select(func.coalesce(func.sum(Contribution.amount), 0.0)).where(
                Contribution.date >= m_start, Contribution.date <= m_end
            )
        ) or 0.0
        exp = db.scalar(
            select(func.coalesce(func.sum(Expense.amount), 0.0)).where(
                Expense.date >= m_start, Expense.date <= m_end
            )
        ) or 0.0

        monthly_trends.append(
            MonthlyFinanceData(
                month=f"{month_names[m - 1]} {today.year}",
                income=round(float(inc), 2),
                expense=round(float(exp), 2),
                net=round(float(inc - exp), 2),
            )
        )

    return FinanceSummary(
        total_income_ytd=round(float(total_income), 2),
        total_expense_ytd=round(float(total_expense), 2),
        net_operating_balance=round(float(net_operating), 2),
        total_pledges_active=round(float(total_pledges), 2),
        recent_contributions=[_format_contribution_read(c) for c in recent_contribs],
        fund_breakdown=fund_breakdown,
        monthly_trends=monthly_trends,
    )


# --- Donor Statement ---
@router.get("/statements/{member_id}", response_model=DonorStatement)
def generate_donor_statement(
    member_id: int,
    year: int | None = None,
    db: Session = Depends(get_db),
) -> DonorStatement:
    member = db.get(Member, member_id)
    if not member:
        raise HTTPException(status_code=404, detail="Member not found")

    target_year = year or date.today().year
    start_date = date(target_year, 1, 1)
    end_date = date(target_year, 12, 31)

    contributions = list(
        db.scalars(
            select(Contribution)
            .where(
                Contribution.member_id == member_id,
                Contribution.date >= start_date,
                Contribution.date <= end_date,
            )
            .order_by(Contribution.date)
        )
    )

    total_amount = sum(c.amount for c in contributions)
    full_name = f"{member.first_name} {member.last_name}"

    return DonorStatement(
        member_id=member.id,
        donor_name=full_name,
        address=member.address,
        email=member.email,
        phone=member.phone,
        start_date=start_date,
        end_date=end_date,
        total_amount=round(total_amount, 2),
        contributions=[_format_contribution_read(c) for c in contributions],
        generated_at=datetime.utcnow(),
    )
