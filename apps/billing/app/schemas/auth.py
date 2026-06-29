from typing import Optional
from pydantic import BaseModel


class LoginRequest(BaseModel):
    email: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int  # seconds


class UserContext(BaseModel):
    """Resolved user + org context - injected by get_current_context."""
    user_id: str
    email: str
    full_name: Optional[str] = None
    organization_id: str
    role: str  # owner | admin | member
    is_superuser: bool = False
