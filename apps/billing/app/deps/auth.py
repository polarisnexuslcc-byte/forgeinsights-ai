import uuid
from dataclasses import dataclass
from fastapi import Header, HTTPException


@dataclass
class CurrentContext:
    user_id: uuid.UUID
    organization_id: uuid.UUID
    role: str


def get_current_context(
    x_user_id: str | None = Header(default=None),
    x_organization_id: str | None = Header(default=None),
    x_role: str | None = Header(default="owner"),
) -> CurrentContext:
    """
    Provisional header-based auth for local testing.
    Replace with real JWT/session verification before going to production.

    Expected headers:
        X-User-Id: <uuid>
        X-Organization-Id: <uuid>
        X-Role: owner | admin | member  (optional, defaults to 'owner')
    """
    if not x_user_id or not x_organization_id:
        raise HTTPException(status_code=401, detail="Missing auth headers")

    try:
        return CurrentContext(
            user_id=uuid.UUID(x_user_id),
            organization_id=uuid.UUID(x_organization_id),
            role=x_role or "owner",
        )
    except ValueError:
        raise HTTPException(status_code=401, detail="Invalid auth headers")
