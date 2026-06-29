from pydantic import BaseModel
from typing import Optional


class ErrorDetail(BaseModel):
    detail: str
    error_type: Optional[str] = None


class ErrorResponse(BaseModel):
    detail: str


class OkResponse(BaseModel):
    status: str = "ok"
