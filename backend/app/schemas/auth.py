from pydantic import BaseModel
from app.core.roles import Role

class LoginRequest(BaseModel):
    email: str
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"

class RegisterTenantRequest(BaseModel):
    tenant_name: str
    owner_email: str
    owner_password: str
    lang: str = "pl"
    plan_code: str = "PRO_M_TRIAL"
    discount_code: str | None = None
    billing_full_name: str | None = None
    billing_street: str | None = None
    billing_house_no: str | None = None
    billing_apartment_no: str | None = None
    billing_postcode: str | None = None
    billing_city: str | None = None
    billing_region: str | None = None
    billing_country: str | None = None
    billing_tax_id: str | None = None
    billing_auto_filled: bool | None = False
    newsletter_subscribed: bool = False

class RegisterInitRequest(BaseModel):
    email: str
    password: str
    lang: str = "en"
    metadata: dict | None = None  # To store plan, tenant name etc draft

class MeResponse(BaseModel):
    id: str
    email: str
    role: Role
    tenant_id: str | None
