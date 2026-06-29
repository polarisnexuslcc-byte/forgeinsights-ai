from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.deps.auth import get_current_context, CurrentContext
from app.services.extra_credit_service import ExtraCreditService
from app.schemas.extra import ExtraStatusResponse, ExtraCheckoutLinkResponse

router = APIRouter(prefix="/api/org/me/extras", tags=["extras"])

WP_CHECKOUT_BASE = "https://starthenode.xyz/membership-checkout/"

EXTRA_LEVEL_MAP = {
    "basic": "4",
    "medium": "5",
    "enterprise": "6",
}


@router.get("/status", response_model=ExtraStatusResponse)
def get_extra_status(
    ctx: CurrentContext = Depends(get_current_context),
    db: Session = Depends(get_db),
):
    extra_remaining = ExtraCreditService.get_extra_remaining(db, ctx.organization_id)
    can_buy = ExtraCreditService.can_buy_extra(db, ctx.organization_id)
    return ExtraStatusResponse(
        extra_questions_remaining=extra_remaining,
        can_buy_extra=can_buy,
    )


@router.post("/checkout-link", response_model=ExtraCheckoutLinkResponse)
def get_checkout_link(
    ctx: CurrentContext = Depends(get_current_context),
    db: Session = Depends(get_db),
):
    can_buy = ExtraCreditService.can_buy_extra(db, ctx.organization_id)
    if not can_buy:
        raise HTTPException(status_code=400, detail="Extra questions still remaining. Cannot purchase more.")

    org_id_str = str(ctx.organization_id)
    level = "4"

    real_url = WP_CHECKOUT_BASE + "?level=" + level + "&org=" + org_id_str
    return ExtraCheckoutLinkResponse(url=real_url)
