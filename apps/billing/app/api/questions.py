from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.deps.auth import get_current_member
from app.models.organization_member import OrganizationMember
from app.services.usage_service import UsageService
from app.schemas.question import AskQuestionRequest, AskQuestionResponse

router = APIRouter()


@router.post("/api/org/me/ask", response_model=AskQuestionResponse)
def ask_question(
    payload: AskQuestionRequest,
    member: OrganizationMember = Depends(get_current_member),
    db: Session = Depends(get_db),
):
    remaining = UsageService.consume_question_quota(db, member.organization_id, payload.amount)
    return AskQuestionResponse(status="ok", questions_remaining=remaining)
