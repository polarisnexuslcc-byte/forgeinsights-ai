"""
Auth dependencies.

Two authentication modes are supported:
1. JWT Bearer token  ->  get_current_context()  (real auth, used by frontend)
2. X-User-Id / X-Organization-Id headers  ->  legacy, kept for backward-compat
"""
import uuid
from typing import Optional

from fastapi import Depends, Header, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import decode_access_token
from app.models.organization_member import OrganizationMember
from app.models.user import User
from app.schemas.auth import UserContext


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


_bearer = HTTPBearer(auto_error=False)


def get_current_context(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(_bearer),
    db: Session = Depends(get_db),
) -> UserContext:
    """
    Decode JWT bearer token, resolve user + org from DB, return UserContext.
    Raises 401 if missing/invalid token, 403 if no active membership.
    """
    if not credentials:
        raise HTTPException(status_code=401, detail="Not authenticated")

    try:
        payload = decode_access_token(credentials.credentials)
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    user_id: str = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid token payload")

    user = db.query(User).filter(User.id == user_id).first()
    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="User not found or inactive")

    member = (
        db.query(OrganizationMember)
        .filter(
            OrganizationMember.user_id == user_id,
            OrganizationMember.status == "active",
        )
        .first()
    )
    if not member:
        raise HTTPException(status_code=403, detail="No active organization membership")

    return UserContext(
        user_id=user.id,
        email=user.email,
        full_name=user.full_name,
        organization_id=member.organization_id,
        role=member.role,
        is_superuser=bool(user.is_superuser),
    )


# Backward-compat alias used by existing routers
CurrentContext = UserContext
