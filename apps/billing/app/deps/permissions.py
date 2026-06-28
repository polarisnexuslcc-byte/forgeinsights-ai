from fastapi import Depends, HTTPException
from app.deps.auth import get_current_context, CurrentContext


def require_roles(*allowed_roles: str):
    def checker(ctx: CurrentContext = Depends(get_current_context)) -> CurrentContext:
        if ctx.role not in allowed_roles:
            raise HTTPException(status_code=403, detail="Not enough permissions")
        return ctx

    return checker
