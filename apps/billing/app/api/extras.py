from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.deps.auth import get_current_member
from app.models.organization_member import OrganizationMember
from app.services.extra_credit_service import ExtraCreditService
from app.schemas.extra import ExtraStatusResponse, CheckoutLinkResponse

router = APIRouter()

# WordPress Paid Memberships Pro level for extra questions
WP_CHECKOUT_BASE = "https://starthenode.xyz/membership-checkout/"
EXTRA_QUESTIONS_LEVEL = 4


@router.get("/api/org/me/extra-status", response_model=ExtraStatusResponse)
def get_extra_status(
    member: OrganizationMember = Depends(get_current_member),
    db: Session = Depends(get_db),
):
    org_id = member.organization_id
    extra_remaining = ExtraCreditService.get_extra_remaining(db, org_id)
    checkout_url = f"{WP_CHECKOUT_BASE}?level={EXTRA_QUESTIONS_LEVEL}&org={org_id}"
    return ExtraStatusResponse(
        organization_id=org_id,
        extra_questions_available=extra_remaining,
        can_buy_extra=True,
        checkout_url=checkout_url,
    )


@router.post("/api/org/me/extra-checkout", response_model=CheckoutLinkResponse)
def get_extra_checkout_link(
    member: OrganizationMember = Depends(get_current_member),
):
    org_id = member.organization_id
    checkout_url = f"{WP_CHECKOUT_BASE}?level={EXTRA_QUESTIONS_LEVEL}&org={org_id}"
    return CheckoutLinkResponse(checkout_url=checkout_url)
