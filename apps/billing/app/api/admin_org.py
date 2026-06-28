from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.deps.auth import CurrentContext
from app.deps.permissions import require_roles
from app.services.subscription_service import SubscriptionService

router = APIRouter(prefix="/api/admin/org", tags=["admin-org"])


@router.post("/{organization_id}/schedule-plan/{plan_code}")
def schedule_plan_change(
    organization_id: str,
    plan_code: str,
    ctx: CurrentContext = Depends(require_roles("owner", "admin")),
    db: Session = Depends(get_db),
):
    try:
        org = SubscriptionService.schedule_plan_change(
            db=db,
            organization_id=organization_id,
            new_plan_code=plan_code,
        )
        db.commit()
        return {
            "ok": True,
            "organization_id": str(org.id),
            "pending_plan_id": str(org.pending_plan_id) if org.pending_plan_id else None,
        }
    except ValueError as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))
    except Exception:
        db.rollback()
        raise


@router.post("/{organization_id}/grant-extra")
def grant_extra_manually(
    organization_id: str,
    ctx: CurrentContext = Depends(require_roles("owner", "admin")),
    db: Session = Depends(get_db),
):
    try:
        extra = SubscriptionService.grant_extra_pack(
            db=db,
            organization_id=organization_id,
            external_order_ref="manual-admin-grant",
        )
        db.commit()
        return {
            "ok": True,
            "extra_id": str(extra.id),
            "questions_total": extra.questions_total,
        }
    except ValueError as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))
    except Exception:
        db.rollback()
        raise
