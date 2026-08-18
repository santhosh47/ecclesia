"""Ministry and small group management endpoints."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session, joinedload

from app.database.session import get_db
from app.models.member import Member
from app.models.ministry import MemberMinistry, Ministry
from app.schemas.ministry import (
    MemberMinistryLink,
    MinistryCreate,
    MinistryDetail,
    MinistryRead,
    MinistryUpdate,
)

router = APIRouter(prefix="/ministries", tags=["ministries"])


def get_ministry_or_404(ministry_id: int, db: Session) -> Ministry:
    ministry = db.scalar(
        select(Ministry)
        .options(
            joinedload(Ministry.members).joinedload(MemberMinistry.member)
        )
        .where(Ministry.id == ministry_id)
    )
    if ministry is None:
        raise HTTPException(status_code=404, detail="Ministry not found")
    return ministry


@router.get("", response_model=list[MinistryRead])
def list_ministries(db: Session = Depends(get_db)) -> list[MinistryRead]:
    ministries = list(
        db.scalars(
            select(Ministry)
            .options(joinedload(Ministry.members))
            .order_by(Ministry.category, Ministry.name)
        ).unique()
    )
    
    result: list[MinistryRead] = []
    for m in ministries:
        leader_name = None
        if m.leader_id:
            leader = db.get(Member, m.leader_id)
            if leader:
                leader_name = f"{leader.first_name} {leader.last_name}"
        
        result.append(
            MinistryRead(
                id=m.id,
                name=m.name,
                category=m.category,
                description=m.description,
                meeting_time=m.meeting_time,
                meeting_location=m.meeting_location,
                leader_id=m.leader_id,
                created_at=m.created_at,
                member_count=len(m.members),
                leader_name=leader_name,
            )
        )
    return result


@router.post("", response_model=MinistryRead, status_code=status.HTTP_201_CREATED)
def create_ministry(payload: MinistryCreate, db: Session = Depends(get_db)) -> MinistryRead:
    ministry = Ministry(**payload.model_dump())
    db.add(ministry)
    db.commit()
    db.refresh(ministry)
    
    leader_name = None
    if ministry.leader_id:
        leader = db.get(Member, ministry.leader_id)
        if leader:
            leader_name = f"{leader.first_name} {leader.last_name}"

    return MinistryRead(
        id=ministry.id,
        name=ministry.name,
        category=ministry.category,
        description=ministry.description,
        meeting_time=ministry.meeting_time,
        meeting_location=ministry.meeting_location,
        leader_id=ministry.leader_id,
        created_at=ministry.created_at,
        member_count=0,
        leader_name=leader_name,
    )


@router.get("/{ministry_id}", response_model=MinistryDetail)
def get_ministry(ministry_id: int, db: Session = Depends(get_db)) -> MinistryDetail:
    ministry = get_ministry_or_404(ministry_id, db)
    leader_name = None
    if ministry.leader_id:
        leader = db.get(Member, ministry.leader_id)
        if leader:
            leader_name = f"{leader.first_name} {leader.last_name}"

    members_links = [
        MemberMinistryLink(
            member_id=mm.member.id,
            role=mm.role,
            first_name=mm.member.first_name,
            last_name=mm.member.last_name,
            avatar_url=mm.member.avatar_url,
        )
        for mm in ministry.members
        if mm.member
    ]

    return MinistryDetail(
        id=ministry.id,
        name=ministry.name,
        category=ministry.category,
        description=ministry.description,
        meeting_time=ministry.meeting_time,
        meeting_location=ministry.meeting_location,
        leader_id=ministry.leader_id,
        created_at=ministry.created_at,
        member_count=len(members_links),
        leader_name=leader_name,
        members=members_links,
    )


@router.patch("/{ministry_id}", response_model=MinistryRead)
def update_ministry(ministry_id: int, payload: MinistryUpdate, db: Session = Depends(get_db)) -> MinistryRead:
    ministry = get_ministry_or_404(ministry_id, db)
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(ministry, field, value)
    db.commit()
    db.refresh(ministry)
    
    leader_name = None
    if ministry.leader_id:
        leader = db.get(Member, ministry.leader_id)
        if leader:
            leader_name = f"{leader.first_name} {leader.last_name}"

    return MinistryRead(
        id=ministry.id,
        name=ministry.name,
        category=ministry.category,
        description=ministry.description,
        meeting_time=ministry.meeting_time,
        meeting_location=ministry.meeting_location,
        leader_id=ministry.leader_id,
        created_at=ministry.created_at,
        member_count=len(ministry.members),
        leader_name=leader_name,
    )


@router.delete("/{ministry_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_ministry(ministry_id: int, db: Session = Depends(get_db)) -> None:
    ministry = get_ministry_or_404(ministry_id, db)
    db.delete(ministry)
    db.commit()


@router.post("/{ministry_id}/members", status_code=status.HTTP_201_CREATED)
def add_member_to_ministry(
    ministry_id: int,
    member_id: int,
    role: str = "Member",
    db: Session = Depends(get_db),
) -> dict[str, str]:
    get_ministry_or_404(ministry_id, db)
    existing = db.scalar(
        select(MemberMinistry).where(
            MemberMinistry.ministry_id == ministry_id,
            MemberMinistry.member_id == member_id,
        )
    )
    if existing:
        existing.role = role
    else:
        db.add(MemberMinistry(ministry_id=ministry_id, member_id=member_id, role=role))
    db.commit()
    return {"message": "Member added to ministry successfully"}


@router.delete("/{ministry_id}/members/{member_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_member_from_ministry(
    ministry_id: int,
    member_id: int,
    db: Session = Depends(get_db),
) -> None:
    link = db.scalar(
        select(MemberMinistry).where(
            MemberMinistry.ministry_id == ministry_id,
            MemberMinistry.member_id == member_id,
        )
    )
    if link:
        db.delete(link)
        db.commit()
