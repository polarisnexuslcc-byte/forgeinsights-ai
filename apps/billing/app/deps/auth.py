import uuid
from dataclasses import dataclass
from fastapi import Header, HTTPException, Depends
from sqlalchemy.orm import Session
from sqlalchemy import select
from app.core.database import get_db
from app.models.organization_member import OrganizationMember


@dataclass
class CurrentContext:
    user_id: uuid.UUID
    organization_id: uuid.UUID
    role: str


def get_current_context(
    x_user_id: str | None = Header(default=None),
    x_organization_id: str | None = Header(default=None),
    db: Session = Depends(get_db),
) -> CurrentContext:
    if not x_user_id or not x_organization_id:
        raise HTTPException(status_code=401, detail="Missing auth headers")

    try:
        user_id = uuid.UUID(x_user_id)
        organization_id = uuid.UUID(x_organization_id)
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid auth headers")

    stmt = select(OrganizationMember).where(
        OrganizationMember.user_id == user_id,
        OrganizationMember.organization_id == organization_id,
        OrganizationMember.status == "active",
    )
    member = db.execute(stmt).scalar_one_or_none()

    if not member:
        raise HTTPException(status_code=403, detail="User does not belong to organization")

    return CurrentContext(
        user_id=user_id,
        organization_id=organization_id,
        role=member.role,
    )
