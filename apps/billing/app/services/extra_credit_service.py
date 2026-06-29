from sqlalchemy.orm import Session
from app.models.question_extra_credit import QuestionExtraCredit
from app.core.exceptions import QuotaExceededError


class ExtraCreditService:
    @staticmethod
    def get_extra_remaining(db: Session, org_id: str) -> int:
        """Returns total unused extra credits for an org."""
        credits = (
            db.query(QuestionExtraCredit)
            .filter(QuestionExtraCredit.organization_id == org_id)
            .all()
        )
        return sum(max(0, c.credits_added - c.credits_used) for c in credits)

    @staticmethod
    def consume_extra_questions(db: Session, org_id: str, amount: int = 1) -> int:
        """Consume extra credits FIFO. Returns remaining after consumption."""
        credits = (
            db.query(QuestionExtraCredit)
            .filter(
                QuestionExtraCredit.organization_id == org_id,
                QuestionExtraCredit.credits_used < QuestionExtraCredit.credits_added,
            )
            .order_by(QuestionExtraCredit.created_at)
            .all()
        )
        remaining_to_consume = amount
        for credit in credits:
            available = credit.credits_added - credit.credits_used
            consume = min(available, remaining_to_consume)
            credit.credits_used += consume
            remaining_to_consume -= consume
            if remaining_to_consume <= 0:
                break
        if remaining_to_consume > 0:
            raise QuotaExceededError("Not enough extra question credits")
        db.commit()
        return ExtraCreditService.get_extra_remaining(db, org_id)
