from pydantic import BaseModel
from typing import Optional


class AskQuestionRequest(BaseModel):
    question: str
    amount: int = 1


class AskQuestionResponse(BaseModel):
    status: str
    questions_remaining: int
    message: Optional[str] = None
