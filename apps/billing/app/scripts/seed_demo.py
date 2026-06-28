import uuid
from sqlalchemy import select
from app.core.database import SessionLocal
from app.models.plan import Plan
from app.models.organization import Organization
from app.models.organization_member import OrganizationMember
from app.services.subscription_service import SubscriptionService


DEMO_USER_ID = uuid.UUID("11111111-1111-1111-1111-111111111111")
DEMO_ORG_ID = uuid.UUID("22222222-2222-2222-2222-222222222222")


def upsert_plans(db):
    plans = [
        {
            "code": "basic",
            "name": "Basic",
            "max_users": 1,
            "max_files": 1000,
            "max_storage_bytes": 1073741824,
            "base_questions_per_month": 300,
            "extra_questions_pack": 300,
        },
        {
            "code": "medium",
            "name": "Medium",
            "max_users": 2,
            "max_files": 10000,
            "max_storage_bytes": 5368709120,
            "base_questions_per_month": 600,
            "extra_questions_pack": 600,
        },
        {
            "code": "enterprise",
            "name": "Enterprise",
            "max_users": 5,
            "max_files": 50000,
            "max_storage_bytes": 10737418240,
            "base_questions_per_month": 2000,
            "extra_questions_pack": 2000,
        },
    ]

    for item in plans:
        stmt = select(Plan).where(Plan.code == item["code"])
        row = db.execute(stmt).scalar_one_or_none()
        if row:
            row.name = item["name"]
            row.max_users = item["max_users"]
            row.max_files = item["max_files"]
            row.max_storage_bytes = item["max_storage_bytes"]
            row.base_questions_per_month = item["base_questions_per_month"]
            row.extra_questions_pack = item["extra_questions_pack"]
            row.active = True
        else:
            db.add(Plan(**item))


def ensure_demo_org(db):
    stmt = select(Organization).where(Organization.id == DEMO_ORG_ID)
    org = db.execute(stmt).scalar_one_or_none()

    if not org:
        org = Organization(
            id=DEMO_ORG_ID,
            name="Demo Organization",
            slug="demo-organization",
            owner_user_id=DEMO_USER_ID,
            subscription_status="inactive",
            billing_provider="wordpress_pmpro",
        )
        db.add(org)
        db.flush()

    stmt_member = select(OrganizationMember).where(
        OrganizationMember.organization_id == DEMO_ORG_ID,
        OrganizationMember.user_id == DEMO_USER_ID,
    )
    member = db.execute(stmt_member).scalar_one_or_none()

    if not member:
        db.add(
            OrganizationMember(
                organization_id=DEMO_ORG_ID,
                user_id=DEMO_USER_ID,
                role="owner",
                status="active",
            )
        )

    return org


def main():
    db = SessionLocal()
    try:
        upsert_plans(db)
        db.flush()

        org = ensure_demo_org(db)
        db.flush()

        SubscriptionService.activate_subscription(
            db=db,
            organization_id=str(org.id),
            plan_code="basic",
            email="owner@example.com",
            current_period_start="2026-06-01T00:00:00+00:00",
            current_period_end="2026-07-01T00:00:00+00:00",
            external_order_ref="seed-demo-activation",
        )

        db.commit()
        print("Seed completed")
        print("Demo user id: " + str(DEMO_USER_ID))
        print("Demo org id: " + str(DEMO_ORG_ID))
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    main()
