from pydantic import BaseModel


class ExtraStatusResponse(BaseModel):
    organization_id: str
    extra_questions_available: int
    can_buy_extra: bool
    checkout_url: str


class CheckoutLinkResponse(BaseModel):
    checkout_url: str
