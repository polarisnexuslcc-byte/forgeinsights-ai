import uuid
from fastapi import Header, HTTPException, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.organization_member import OrganizationMember
from app.models.organization import Organization


def get_current_user_id(x_user_id: str = Header(...)) -> uuid.UUID:
    try:
        return uuid.UUID(x_user_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid X-User-Id header")


def get_current_organization_id(x_organization_id: str = Header(...)) -> uuid.UUID:
    try:
        return uuid.UUID(x_organization_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid X-Organization-Id header")


def get_current_member(
    user_id: uuid.UUID = Depends(get_current_user_id),
    organization_id: uuid.UUID = Depends(get_current_organization_id),
    db: Session = Depends(get_db),
) -> OrganizationMember:
    # SQLite stores UUIDs as strings, so cast to str for comparison
    member = (
        db.query(OrganizationMember)
        .filter(
            OrganizationMember.user_id == str(user_id),
            OrganizationMember.organization_id == str(organization_id),
            OrganizationMember.status == "active",
        )
        .first()
    )
    if not member:
        raise HTTPException(status_code=403, detail="User does not belong to organization")
    return member


def require_owner(member: OrganizationMember = Depends(get_current_member)) -> OrganizationMember:
    if member.role not in ("owner", "admin"):
        raise HTTPException(status_code=403, detail="Owner or admin role required")
    return member
