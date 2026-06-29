from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime


class BillingLogItem(BaseModel):
    id: str
    organization_id: str
    action: str
    description: Optional[str] = None
    meta: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class BillingLogListResponse(BaseModel):
    items: List[BillingLogItem]
    total: int
