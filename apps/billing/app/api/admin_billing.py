from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.services.billing_log_service import BillingLogService
from app.schemas.billing_log import BillingLogListResponse, BillingLogItem

router = APIRouter()


@router.get("/api/admin/org/{org_id}/billing-logs", response_model=BillingLogListResponse)
def list_billing_logs(
    org_id: str,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
):
    logs = BillingLogService.list_logs(db, org_id, skip=skip, limit=limit)
    total = BillingLogService.count_logs(db, org_id)
    return BillingLogListResponse(
        items=[BillingLogItem.from_orm(log) for log in logs],
        total=total,
    )
