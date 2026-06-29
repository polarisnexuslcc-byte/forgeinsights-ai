from dataclasses import dataclass
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from app.models.organization import Organization
from app.models.plan import Plan
from app.models.question_extra_credit import QuestionExtraCredit
from app.core.exceptions import NotFoundError


@dataclass
class ExtraPackResult:
    credits_added: int
    credits_remaining: int


class SubscriptionService:
    @staticmethod
    def _do_activate(db: Session, org: Organization, plan_code: str, extend_months: int = 1) -> None:
        plan = db.query(Plan).filter(Plan.code == plan_code).first()
        if plan:
            org.plan_id = plan.id
        org.subscription_status = "active"
        org.subscription_expires_at = datetime.utcnow() + timedelta(days=30 * extend_months)
        db.commit()

    @staticmethod
    def schedule_plan_change(db: Session, org_id: str, new_plan_code: str) -> Organization:
        org = db.query(Organization).filter(Organization.id == str(org_id)).first()
        if not org:
            raise NotFoundError("Organization not found")
        plan = db.query(Plan).filter(Plan.code == new_plan_code).first()
        if not plan:
            raise NotFoundError(f"Plan '{new_plan_code}' not found")
        org.pending_plan_id = plan.id
        db.commit()
        return org

    @staticmethod
    def grant_extra_pack(db: Session, org_id: str, external_order_ref: str) -> ExtraPackResult:
        org = db.query(Organization).filter(Organization.id == str(org_id)).first()
        if not org:
            raise NotFoundError("Organization not found")
        plan = None
        if org.plan_id:
            plan = db.query(Plan).filter(Plan.id == org.plan_id).first()
        credits = 50 if not plan else plan.extra_questions_pack
        credit = QuestionExtraCredit(
            organization_id=str(org_id),
            credits_added=credits,
            credits_used=0,
            source=external_order_ref,
        )
        db.add(credit)
        db.commit()
        total_remaining = sum(
            max(0, c.credits_added - c.credits_used)
            for c in db.query(QuestionExtraCredit)
            .filter(QuestionExtraCredit.organization_id == str(org_id))
            .all()
        )
        return ExtraPackResult(credits_added=credits, credits_remaining=total_remaining)
