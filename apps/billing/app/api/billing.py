import hmac
import hashlib
import json
import logging
from fastapi import APIRouter, Depends, Request, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.config import get_settings
from app.core.exceptions import ConflictError
from app.services.billing_event_service import BillingEventService
from app.services.billing_log_service import BillingLogService
from app.services.subscription_service import SubscriptionService
from app.models.organization import Organization

logger = logging.getLogger(__name__)
router = APIRouter()


def _verify_hmac(body: bytes, signature: str, secret: str) -> bool:
    expected = hmac.new(secret.encode(), body, hashlib.sha256).hexdigest()
    return hmac.compare_digest(expected, signature)


@router.post("/api/webhooks/billing/wordpress")
async def wordpress_webhook(
    request: Request,
    db: Session = Depends(get_db),
):
    settings = get_settings()
    body = await request.body()
    sig = request.headers.get("X-STN-Signature", "")
    if not _verify_hmac(body, sig, settings.WEBHOOK_SECRET):
        raise HTTPException(status_code=403, detail="Invalid webhook signature")

    try:
        payload = json.loads(body)
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid JSON payload")

    event_key = payload.get("event_key", "")
    event_type = payload.get("event_type", "")
    org_id = payload.get("organization_id", "")

    if BillingEventService.is_duplicate(db, event_key):
        return {"status": "duplicate", "event_key": event_key}

    event = BillingEventService.create_event(db, org_id, event_key, event_type, body.decode())

    if event_type in ("subscription_activated", "subscription_renewed"):
        plan_code = payload.get("plan_code", "basic")
        org = db.query(Organization).filter(Organization.id == str(org_id)).first()
        if org:
            SubscriptionService._do_activate(db, org, plan_code)
        BillingLogService.log(db, org_id, event_type, f"Plan: {plan_code}")
    elif event_type == "subscription_cancelled":
        org = db.query(Organization).filter(Organization.id == str(org_id)).first()
        if org:
            org.subscription_status = "cancelled"
            db.commit()
        BillingLogService.log(db, org_id, event_type)
    elif event_type == "subscription_expired":
        org = db.query(Organization).filter(Organization.id == str(org_id)).first()
        if org:
            org.subscription_status = "expired"
            db.commit()
        BillingLogService.log(db, org_id, event_type)
    elif event_type == "extra_questions_purchased":
        order_ref = payload.get("external_order_ref", event_key)
        result = SubscriptionService.grant_extra_pack(db, org_id, order_ref)
        BillingLogService.log(db, org_id, event_type, f"+{result.credits_added} credits")

    BillingEventService.mark_processed(db, event)
    return {"status": "ok", "event_type": event_type}
