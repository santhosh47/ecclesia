"""Member-directory endpoints."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.models.member import Member
from app.schemas.member import MemberCreate, MemberRead, MemberUpdate

router = APIRouter(prefix="/members", tags=["members"])


def get_member_or_404(member_id: int, db: Session) -> Member:
    member = db.get(Member, member_id)
    if member is None:
        raise HTTPException(status_code=404, detail="Member not found")
    return member


@router.get("", response_model=list[MemberRead])
def list_members(db: Session = Depends(get_db)) -> list[Member]:
    return list(db.scalars(select(Member).order_by(Member.last_name, Member.first_name)))


@router.post("", response_model=MemberRead, status_code=status.HTTP_201_CREATED)
def create_member(payload: MemberCreate, db: Session = Depends(get_db)) -> Member:
    member = Member(**payload.model_dump())
    db.add(member)
    try:
        db.commit()
    except IntegrityError as error:
        db.rollback()
        raise HTTPException(status_code=409, detail="A member with this email already exists") from error
    db.refresh(member)
    return member


@router.get("/{member_id}", response_model=MemberRead)
def get_member(member_id: int, db: Session = Depends(get_db)) -> Member:
    return get_member_or_404(member_id, db)


@router.patch("/{member_id}", response_model=MemberRead)
def update_member(member_id: int, payload: MemberUpdate, db: Session = Depends(get_db)) -> Member:
    member = get_member_or_404(member_id, db)
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(member, field, value)
    try:
        db.commit()
    except IntegrityError as error:
        db.rollback()
        raise HTTPException(status_code=409, detail="A member with this email already exists") from error
    db.refresh(member)
    return member


@router.delete("/{member_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_member(member_id: int, db: Session = Depends(get_db)) -> None:
    db.delete(get_member_or_404(member_id, db))
    db.commit()
