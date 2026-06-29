from datetime import datetime
from sqlalchemy.orm import Session
from app.models.billing_event import BillingEvent


class BillingEventService:
    @staticmethod
    def is_duplicate(db: Session, event_key: str) -> bool:
        return db.query(BillingEvent).filter(BillingEvent.event_key == event_key).first() is not None

    @staticmethod
    def create_event(db: Session, organization_id: str, event_key: str, event_type: str, raw_payload: str = None) -> BillingEvent:
        event = BillingEvent(
            organization_id=organization_id,
            event_key=event_key,
            event_type=event_type,
            raw_payload=raw_payload,
        )
        db.add(event)
        db.commit()
        db.refresh(event)
        return event

    @staticmethod
    def mark_processed(db: Session, event: BillingEvent) -> BillingEvent:
        event.processed = True
        event.processed_at = datetime.utcnow()
        db.commit()
        db.refresh(event)
        return event
