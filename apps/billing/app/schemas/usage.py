from pydantic import BaseModel
from typing import Optional, List


class UsageWarning(BaseModel):
    code: str
    message: str
    severity: str = "info"


class UsageResponse(BaseModel):
    plan_code: str
    max_users: int
    max_files: int
    max_storage_bytes: int
    base_questions_per_month: int
    files_count: int
    storage_bytes: int
    base_questions_used: int
    extra_questions_used: int
    base_questions_remaining: int
    extra_questions_remaining: int
    total_questions_remaining: int
    can_upload_files: bool
    can_ask_questions: bool
    can_buy_extra: bool


class UsageSummary(BaseModel):
    plan_code: str
    max_users: int
    max_files: int
    max_storage_bytes: int
    base_questions_per_month: int
    files_count: int
    storage_bytes: int
    base_questions_used: int
    extra_questions_used: int
    base_questions_remaining: int
    extra_questions_remaining: int
    total_questions_remaining: int
    can_upload_files: bool
    can_ask_questions: bool
    can_buy_extra: bool
    warnings: Optional[List[UsageWarning]] = []
