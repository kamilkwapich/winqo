from pydantic import BaseModel
from app.core.roles import Role

class TenantOut(BaseModel):
    id: str
    name: str
    default_lang: str
    newsletter_subscribed: bool = False
    created_at: str

class CreateTenantIn(BaseModel):
    name: str
    default_lang: str = "pl"
    default_currency: str | None = None
    newsletter_subscribed: bool = False

class UserOut(BaseModel):
    id: str
    tenant_id: str | None
    email: str
    role: Role
    is_active: bool
    created_at: str

class CreateUserIn(BaseModel):
    tenant_id: str | None
    email: str
    password: str
    role: Role
    is_active: bool = True


class CreateSubscriptionIn(BaseModel):
    tenant_id: str
    plan_code: str
    provider: str = "stripe"
    currency: str | None = None
    status: str = "active"
    price_amount: int | None = None

class BillingSettingsOut(BaseModel):
    stripe_enabled: bool
    paypal_enabled: bool
    autopay_enabled: bool
    mode: str

class BillingSettingsIn(BaseModel):
    stripe_enabled: bool
    paypal_enabled: bool
    autopay_enabled: bool
    mode: str


class DiscountCodeIn(BaseModel):
    code: str
    type: str  # percent or amount
    percent_value: float | None = None
    amount_cents: int | None = None
    currency: str | None = None
    active: bool = True
    expires_at: str | None = None  # ISO timestamp or null


class DiscountCodeOut(BaseModel):
    id: str
    code: str
    type: str
    percent_value: float | None
    amount_cents: int | None
    currency: str | None
    active: bool
    expires_at: str | None
    created_at: str
