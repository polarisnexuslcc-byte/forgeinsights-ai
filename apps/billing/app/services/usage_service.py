from datetime import datetime, timezone
from sqlalchemy.orm import Session
from sqlalchemy import select, func
from app.models.usage_monthly import UsageMonthly
from app.models.file import File
from app.models.organization_member import OrganizationMember
from app.services.plan_service import PlanService
from app.services.extra_credit_service import ExtraCreditService
from app.schemas.usage import UsageSummary


def get_period_key(dt: datetime | None = None) -> str:
    """Returns current billing period as 'YYYY-MM' string."""
    dt = dt or datetime.now(timezone.utc)
    return dt.strftime("%Y-%m")


class UsageService:
    @staticmethod
    def get_or_create_monthly_usage_for_update(
        db: Session,
        organization_id,
        period_key: str | None = None,
    ) -> UsageMonthly:
        """
        Returns the UsageMonthly row for the given period, creating it if missing.
        Locks the row with SELECT FOR UPDATE to prevent concurrent double-writes.
        Always call inside an open transaction.
        """
        period_key = period_key or get_period_key()

        stmt = (
            select(UsageMonthly)
            .where(
                UsageMonthly.organization_id == organization_id,
                UsageMonthly.period_key == period_key,
            )
            .with_for_update()
        )
        row = db.execute(stmt).scalar_one_or_none()

        if row:
            return row

        row = UsageMonthly(
            organization_id=organization_id,
            period_key=period_key,
            base_questions_used=0,
            extra_questions_used=0,
            files_count=0,
            storage_bytes=0,
        )
        db.add(row)
        db.flush()
        return row

    @staticmethod
    def recalc_file_usage(db: Session, organization_id) -> UsageMonthly:
        """
        Recomputes files_count and storage_bytes from the files table.
        Safer than incremental counters — handles deletions and failed uploads.
        """
        stmt = select(
            func.count(File.id),
            func.coalesce(func.sum(File.size_bytes), 0),
        ).where(File.organization_id == organization_id)

        files_count, storage_bytes = db.execute(stmt).one()

        usage = UsageService.get_or_create_monthly_usage_for_update(db, organization_id)
        usage.files_count = int(files_count or 0)
        usage.storage_bytes = int(storage_bytes or 0)
        return usage

    @staticmethod
    def get_active_member_count(db: Session, organization_id) -> int:
        stmt = (
            select(func.count(OrganizationMember.id))
            .where(
                OrganizationMember.organization_id == organization_id,
                OrganizationMember.status == "active",
            )
        )
        return int(db.execute(stmt).scalar_one())

    @staticmethod
    def ensure_can_upload(
        db: Session, organization_id, incoming_size_bytes: int
    ) -> bool:
        """
        Raises ValueError with a human-readable reason if upload is not allowed.
        Does NOT consume quota — call recalc_file_usage() after the file is saved.
        """
        org, plan = PlanService.get_org_with_plan(db, organization_id)
        PlanService.ensure_active_subscription(org)

        usage = UsageService.get_or_create_monthly_usage_for_update(db, organization_id)
        ok, reason = PlanService.can_upload(
            files_count=usage.files_count,
            storage_bytes=usage.storage_bytes,
            incoming_size_bytes=incoming_size_bytes,
            plan=plan,
        )
        if not ok:
            raise ValueError(reason)

        return True

    @staticmethod
    def ensure_can_add_member(db: Session, organization_id) -> bool:
        """
        Raises ValueError if the plan's user seat limit has been reached.
        """
        org, plan = PlanService.get_org_with_plan(db, organization_id)
        PlanService.ensure_active_subscription(org)

        active_members = UsageService.get_active_member_count(db, organization_id)
        if not PlanService.can_add_member(active_members, plan):
            raise ValueError("User limit reached")

        return True

    @staticmethod
    def ensure_can_ask_question(
        db: Session, organization_id, amount: int = 1
    ) -> bool:
        """
        Raises ValueError if combined quota (base + extras) is insufficient.
        Does NOT consume quota — call consume_question_quota() to actually charge.
        """
        org, plan = PlanService.get_org_with_plan(db, organization_id)
        PlanService.ensure_active_subscription(org)

        usage = UsageService.get_or_create_monthly_usage_for_update(db, organization_id)
        extra_remaining = ExtraCreditService.get_extra_remaining(db, organization_id)
        base_remaining = PlanService.base_questions_remaining(
            usage.base_questions_used, plan
        )

        if extra_remaining + base_remaining < amount:
            raise ValueError("Question quota exceeded")

        return True

    @staticmethod
    def consume_question_quota(
        db: Session, organization_id, amount: int = 1
    ) -> dict:
        """
        Deducts 'amount' questions from the quota.
        Order: extra credits first (FIFO by granted_at), then base quota.
        Raises ValueError if combined quota is insufficient.
        Returns a breakdown dict for audit/logging.
        """
        org, plan = PlanService.get_org_with_plan(db, organization_id)
        PlanService.ensure_active_subscription(org)

        usage = UsageService.get_or_create_monthly_usage_for_update(db, organization_id)

        # Consume extras first
        consumed_from_extra = ExtraCreditService.consume_extra_questions(
            db, organization_id, amount
        )
        usage.extra_questions_used += consumed_from_extra

        # Fall through to base quota for any remainder
        remaining = amount - consumed_from_extra
        if remaining > 0:
            base_remaining = PlanService.base_questions_remaining(
                usage.base_questions_used, plan
            )
            if base_remaining < remaining:
                raise ValueError("Question quota exceeded")
            usage.base_questions_used += remaining

        db.flush()

        return {
            "consumed_total": amount,
            "consumed_from_extra": consumed_from_extra,
            "consumed_from_base": amount - consumed_from_extra,
        }

    @staticmethod
    def get_usage_summary(db: Session, organization_id) -> UsageSummary:
        """
        Returns a complete usage snapshot for the current period.
        Use for dashboard widgets and API responses.
        """
        org, plan = PlanService.get_org_with_plan(db, organization_id)
        usage = UsageService.get_or_create_monthly_usage_for_update(db, organization_id)

        extra_remaining = ExtraCreditService.get_extra_remaining(db, organization_id)
        base_remaining = PlanService.base_questions_remaining(
            usage.base_questions_used, plan
        )

        return UsageSummary(
            plan_code=plan.code,
            max_users=plan.max_users,
            max_files=plan.max_files,
            max_storage_bytes=plan.max_storage_bytes,
            base_questions_per_month=plan.base_questions_per_month,
            files_count=usage.files_count,
            storage_bytes=usage.storage_bytes,
            base_questions_used=usage.base_questions_used,
            extra_questions_used=usage.extra_questions_used,
            base_questions_remaining=base_remaining,
            extra_questions_remaining=extra_remaining,
            total_questions_remaining=base_remaining + extra_remaining,
            can_upload_files=(
                usage.files_count < plan.max_files
                and usage.storage_bytes < plan.max_storage_bytes
            ),
            can_ask_questions=(base_remaining + extra_remaining) > 0,
            can_buy_extra=extra_remaining == 0,
        )
