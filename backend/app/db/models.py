from __future__ import annotations
from datetime import datetime, timezone
from typing import Optional, Any
from sqlmodel import SQLModel, Field, Column, JSON
from uuid import UUID, uuid4
from app.core.roles import Role

def utcnow():
    return datetime.now(timezone.utc)

class Tenant(SQLModel, table=True):
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    name: str
    default_lang: str = "pl"
    default_currency: str = "EUR"
    company_email: Optional[str] = None
    company_phone: Optional[str] = None
    company_website: Optional[str] = None
    company_address: Optional[str] = None
    logo_data: Optional[str] = None
    billing_full_name: Optional[str] = None
    billing_street: Optional[str] = None
    billing_house_no: Optional[str] = None
    billing_apartment_no: Optional[str] = None
    billing_postcode: Optional[str] = None
    billing_city: Optional[str] = None
    billing_region: Optional[str] = None
    billing_country: Optional[str] = None
    billing_tax_id: Optional[str] = None
    billing_auto_filled: bool = False
    newsletter_subscribed: bool = False
    created_at: datetime = Field(default_factory=utcnow)

class User(SQLModel, table=True):
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    tenant_id: Optional[UUID] = Field(default=None, index=True)  # null for super admin if desired
    email: str = Field(index=True, unique=True)
    password_hash: str
    role: Role = Field(default=Role.TENANT_USER)
    is_active: bool = True
    is_verified: bool = False
    verification_token: Optional[str] = None
    password_reset_token: Optional[str] = None
    registration_metadata: Any = Field(sa_column=Column(JSON), default={})
    created_at: datetime = Field(default_factory=utcnow)

class Provider(str):
    pass

class Subscription(SQLModel, table=True):
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    tenant_id: UUID = Field(index=True)
    provider: str = Field(default="stripe", index=True)  # stripe/paypal/autopay
    provider_customer_id: Optional[str] = None
    provider_subscription_id: Optional[str] = None
    status: str = Field(default="inactive", index=True)  # active/past_due/canceled/trialing/inactive
    plan_code: str = Field(default="PRO_M")
    base_price_amount: int | None = None  # cents before discounts
    price_amount: int = 7999  # cents actually charged
    currency: str = "EUR"
    discount_code: Optional[str] = None
    discount_amount_cents: Optional[int] = None
    current_period_start: Optional[datetime] = None
    current_period_end: Optional[datetime] = None
    cancel_at_period_end: bool = False
    pending_plan_code: Optional[str] = None
    pending_change_at: Optional[datetime] = None
    last_event_at: Optional[datetime] = None
    created_at: datetime = Field(default_factory=utcnow)

class GlobalBillingSettings(SQLModel, table=True):
    id: int = Field(default=1, primary_key=True)
    stripe_enabled: bool = True
    paypal_enabled: bool = True
    autopay_enabled: bool = False
    mode: str = "sandbox"  # sandbox/live
    fx_rates: dict[str, float] = Field(default_factory=dict, sa_column=Column(JSON))
    smtp_host: Optional[str] = None
    smtp_port: Optional[int] = None
    smtp_user: Optional[str] = None
    smtp_password: Optional[str] = None
    smtp_from: Optional[str] = None
    smtp_tls: bool = True
    imap_host: Optional[str] = None
    imap_port: Optional[int] = None
    imap_user: Optional[str] = None
    imap_password: Optional[str] = None
    imap_tls: bool = True
    stripe_coupon_ids: dict[str, str] = Field(default_factory=dict, sa_column=Column(JSON))
    stripe_price_ids: dict[str, str] = Field(default_factory=dict, sa_column=Column(JSON))
    stripe_product_id: Optional[str] = None
    paypal_plan_ids: dict[str, str] = Field(default_factory=dict, sa_column=Column(JSON))
    paypal_product_id: Optional[str] = None
    dashboard_banner_data: Optional[str] = None
    updated_at: datetime = Field(default_factory=utcnow)


class DiscountCode(SQLModel, table=True):
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    code: str = Field(index=True, unique=True)
    type: str = Field(default="percent")  # percent/amount
    percent_value: float | None = None
    amount_cents: int | None = None
    currency: Optional[str] = None
    active: bool = True
    expires_at: Optional[datetime] = None
    created_at: datetime = Field(default_factory=utcnow)

class PaymentEvent(SQLModel, table=True):
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    provider: str = Field(index=True)
    event_id: str = Field(index=True)
    event_type: str = Field(index=True)
    tenant_id: Optional[UUID] = Field(default=None, index=True)
    received_at: datetime = Field(default_factory=utcnow)
    processed_ok: bool = False
    error: Optional[str] = None
    payload: Any = Field(sa_column=Column(JSON), default={})

class Client(SQLModel, table=True):
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    tenant_id: UUID = Field(index=True)
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    tax_id: Optional[str] = None
    created_at: datetime = Field(default_factory=utcnow)

class Quote(SQLModel, table=True):
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    tenant_id: UUID = Field(index=True)
    client_id: Optional[UUID] = Field(default=None, index=True)
    number: str = Field(index=True)
    name: str = ""
    lang: str = "pl"
    currency: str = "EUR"
    status: str = "draft"  # draft/sent/accepted
    discount_pct: float = 0.0
    vat_rate: float = 0.0
    transport_cost_cents: int = 0
    installation_cost_cents: int = 0
    extra_costs_cents: int = 0
    notes: Optional[str] = None
    created_at: datetime = Field(default_factory=utcnow)

class QuoteItem(SQLModel, table=True):
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    tenant_id: UUID = Field(index=True)
    quote_id: UUID = Field(index=True)
    name: str
    qty: int = 1
    unit_price_cents: int = 0
    window_spec: Any = Field(sa_column=Column(JSON), default={})  # WindowSpec JSON from frontend
    svg: Optional[str] = None  # optional cached SVG
    notes: Optional[str] = None
    created_at: datetime = Field(default_factory=utcnow)

class UserSettings(SQLModel, table=True):
    __tablename__ = "user_settings"
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    tenant_id: UUID = Field(index=True)
    systems: list[str] = Field(default_factory=list, sa_column=Column(JSON))
    glass_types: list[str] = Field(default_factory=list, sa_column=Column(JSON))
    profile_colors: list[str] = Field(default_factory=list, sa_column=Column(JSON))
    handle_colors: list[str] = Field(default_factory=list, sa_column=Column(JSON))
    created_at: datetime = Field(default_factory=utcnow)
    updated_at: datetime = Field(default_factory=utcnow)

