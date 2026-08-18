"""Household and family management endpoints."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from app.database.session import get_db
from app.models.household import Household
from app.models.member import Member
from app.schemas.household import HouseholdCreate, HouseholdMemberSummary, HouseholdRead, HouseholdUpdate

router = APIRouter(prefix="/households", tags=["households"])


def get_household_or_404(household_id: int, db: Session) -> Household:
    household = db.scalar(
        select(Household)
        .options(joinedload(Household.members))
        .where(Household.id == household_id)
    )
    if household is None:
        raise HTTPException(status_code=404, detail="Household not found")
    return household


def _format_household_read(h: Household) -> HouseholdRead:
    members_summary = [
        HouseholdMemberSummary(
            id=m.id,
            first_name=m.first_name,
            last_name=m.last_name,
            household_role=m.household_role,
            phone=m.phone,
            email=m.email,
            avatar_url=m.avatar_url,
        )
        for m in h.members
    ]
    return HouseholdRead(
        id=h.id,
        name=h.name,
        address=h.address,
        city=h.city,
        state=h.state,
        postal_code=h.postal_code,
        home_phone=h.home_phone,
        primary_contact_id=h.primary_contact_id,
        created_at=h.created_at,
        members=members_summary,
    )


@router.get("", response_model=list[HouseholdRead])
def list_households(db: Session = Depends(get_db)) -> list[HouseholdRead]:
    households = list(
        db.scalars(
            select(Household)
            .options(joinedload(Household.members))
            .order_by(Household.name)
        ).unique()
    )
    return [_format_household_read(h) for h in households]


@router.post("", response_model=HouseholdRead, status_code=status.HTTP_201_CREATED)
def create_household(payload: HouseholdCreate, db: Session = Depends(get_db)) -> HouseholdRead:
    household = Household(**payload.model_dump())
    db.add(household)
    db.commit()
    db.refresh(household)
    return _format_household_read(household)


@router.get("/{household_id}", response_model=HouseholdRead)
def get_household(household_id: int, db: Session = Depends(get_db)) -> HouseholdRead:
    return _format_household_read(get_household_or_404(household_id, db))


@router.patch("/{household_id}", response_model=HouseholdRead)
def update_household(household_id: int, payload: HouseholdUpdate, db: Session = Depends(get_db)) -> HouseholdRead:
    household = get_household_or_404(household_id, db)
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(household, field, value)
    db.commit()
    db.refresh(household)
    return _format_household_read(household)


@router.delete("/{household_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_household(household_id: int, db: Session = Depends(get_db)) -> None:
    household = get_household_or_404(household_id, db)
    # Unlink members from this household
    for member in household.members:
        member.household_id = None
        member.household_role = None
    db.delete(household)
    db.commit()
