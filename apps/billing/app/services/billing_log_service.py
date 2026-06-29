from typing import Optional, List
from sqlalchemy.orm import Session
from app.models.billing_log import BillingLog


class BillingLogService:
    @staticmethod
    def log(db: Session, organization_id: str, action: str, description: str = None, meta: str = None) -> BillingLog:
        entry = BillingLog(
            organization_id=organization_id,
            action=action,
            description=description,
            meta=meta,
        )
        db.add(entry)
        db.commit()
        db.refresh(entry)
        return entry

    @staticmethod
    def list_logs(db: Session, organization_id: str, skip: int = 0, limit: int = 50) -> List[BillingLog]:
        return (
            db.query(BillingLog)
            .filter(BillingLog.organization_id == organization_id)
            .order_by(BillingLog.created_at.desc())
            .offset(skip)
            .limit(limit)
            .all()
        )

    @staticmethod
    def count_logs(db: Session, organization_id: str) -> int:
        return db.query(BillingLog).filter(BillingLog.organization_id == organization_id).count()
