from pydantic import BaseModel, field_validator


class AskQuestionRequest(BaseModel):
    question: str

    @field_validator("question")
    @classmethod
    def question_not_empty(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("Question cannot be empty")
        if len(v) > 4000:
            raise ValueError("Question too long (max 4000 characters)")
        return v


class AskQuestionResponse(BaseModel):
    answer: str
    consumed_total: int
    consumed_from_extra: int
    consumed_from_base: int
