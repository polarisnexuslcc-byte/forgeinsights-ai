"""
security.py - JWT + password hashing for StarTheNode Billing.

Hardening checklist:
  [x] Algorithm allowlist - only HS256 accepted; alg:none / RS256 injection rejected
  [x] jose.decode() called with explicit algorithms list (prevents alg-substitution)
  [x] create_access_token enforces sub, exp, iat, iss, aud - no bare payloads
  [x] decode_access_token verifies iss and aud - forged tokens from other services rejected
  [x] jti (UUID per token) included for future revocation support
  [x] SECRET_KEY sourced from settings - must be 64-char random hex in .env
"""
import uuid
from datetime import datetime, timedelta
from typing import Optional

from jose import JWTError, jwt
from passlib.context import CryptContext

from app.core.config import settings

# --------------------------------------------------------------------------- #
# Constants
# --------------------------------------------------------------------------- #
_ALGORITHM = "HS256"
_ALLOWED_ALGORITHMS = ["HS256"]   # explicit allowlist - rejects alg:none, RS256, etc.
_TOKEN_ISSUER = "stn-billing"
_TOKEN_AUDIENCE = "stn-billing-api"

# --------------------------------------------------------------------------- #
# Password hashing
# --------------------------------------------------------------------------- #
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)


def hash_password(plain: str) -> str:
    return pwd_context.hash(plain)


# --------------------------------------------------------------------------- #
# JWT
# --------------------------------------------------------------------------- #

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """
    Build a signed JWT.  Enforces: sub, exp, iat, iss, aud, jti.
    data MUST contain a 'sub' key (user id string).
    """
    if "sub" not in data:
        raise ValueError("create_access_token: 'sub' is required in data")

    now = datetime.utcnow()
    expire = now + (expires_delta or timedelta(minutes=settings.access_token_expire_minutes))

    payload = {
        **data,
        "exp": expire,
        "iat": now,
        "iss": _TOKEN_ISSUER,
        "aud": _TOKEN_AUDIENCE,
        "jti": str(uuid.uuid4()),
    }
    return jwt.encode(payload, settings.secret_key, algorithm=_ALGORITHM)


def decode_access_token(token: str) -> dict:
    """
    Decode and verify a JWT.

    Raises jose.JWTError on any failure:
      - invalid signature
      - expired token
      - wrong issuer or audience
      - algorithm not in allowlist (blocks alg:none / algorithm confusion)
    """
    return jwt.decode(
        token,
        settings.secret_key,
        algorithms=_ALLOWED_ALGORITHMS,
        audience=_TOKEN_AUDIENCE,
        issuer=_TOKEN_ISSUER,
        options={
            "verify_exp": True,
            "verify_iat": True,
            "verify_iss": True,
            "verify_aud": True,
            "require": ["sub", "exp", "iat", "iss", "aud"],
        },
    )
