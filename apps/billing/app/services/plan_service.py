from sqlalchemy.orm import Session
from app.models.organization import Organization
from app.models.plan import Plan
from app.core.exceptions import NotFoundError, PermissionDeniedError


_DEFAULT_PLAN = {
    "max_users": 5,
    "max_files": 10,
    "max_storage_bytes": 104857600,
    "max_storage_mb": 100,
    "base_questions_per_month": 500,
    "max_questions_month": 500,
    "extra_questions_pack": 50,
    "code": "basic",
}


class PlanService:
    @staticmethod
    def get_org_with_plan(db: Session, org_id: str):
        org = db.query(Organization).filter(Organization.id == str(org_id)).first()
        if not org:
            raise NotFoundError("Organization not found")
        return org

    @staticmethod
    def ensure_active_subscription(org: Organization) -> None:
        if org.subscription_status not in ("active", "trialing", "past_due"):
            raise PermissionDeniedError("Subscription is not active")

    @staticmethod
    def can_upload(files_count: int, storage_bytes: int, plan) -> bool:
        if isinstance(plan, dict):
            return files_count < plan["max_files"]
        return files_count < (plan.max_files if plan else _DEFAULT_PLAN["max_files"])

    @staticmethod
    def can_add_member(members_count: int, plan) -> bool:
        if isinstance(plan, dict):
            return members_count < plan["max_users"]
        return members_count < (plan.max_users if plan else _DEFAULT_PLAN["max_users"])

    @staticmethod
    def base_questions_remaining(questions_used: int, plan) -> int:
        if isinstance(plan, dict):
            return max(0, plan["base_questions_per_month"] - questions_used)
        limit = plan.base_questions_per_month if plan else _DEFAULT_PLAN["base_questions_per_month"]
        return max(0, limit - questions_used)
