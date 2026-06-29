from pydantic import BaseModel
from typing import Optional, Dict, Any


class WebhookPayload(BaseModel):
    event_type: str
    event_key: str
    organization_id: str
    plan_code: Optional[str] = None
    external_order_ref: Optional[str] = None
    extra_data: Optional[Dict[str, Any]] = None


class SubscriptionResponse(BaseModel):
    status: str
    event_type: str
    event_key: str


class PlanScheduleRequest(BaseModel):
    new_plan_code: str


class GrantExtraRequest(BaseModel):
    external_order_ref: str
