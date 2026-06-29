from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.deps.auth import get_current_member
from app.models.organization_member import OrganizationMember
from app.services.usage_service import UsageService
from app.schemas.usage import UsageSummary

router = APIRouter()


@router.get("/api/org/me/usage", response_model=UsageSummary)
def get_usage(
    member: OrganizationMember = Depends(get_current_member),
    db: Session = Depends(get_db),
):
    return UsageService.get_usage_summary(db, member.organization_id)
