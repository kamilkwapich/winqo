from pydantic import BaseModel
from typing import Any

class ClientIn(BaseModel):
    name: str
    email: str | None = None
    phone: str | None = None
    address: str | None = None
    tax_id: str | None = None

class ClientOut(ClientIn):
    id: str
    created_at: str | None = None

class QuoteIn(BaseModel):
    name: str
    client_id: str | None = None
    lang: str = "pl"
    currency: str = "EUR"
    discount_pct: float = 0.0
    vat_rate: float = 0.0
    transport_cost: float = 0.0
    installation_cost: float = 0.0
    extra_costs: float = 0.0
    notes: str | None = None

class QuoteOut(QuoteIn):
    id: str
    number: str
    status: str
    created_at: str | None = None

class QuoteUpdate(BaseModel):
    name: str | None = None
    client_id: str | None = None
    lang: str | None = None
    currency: str | None = None
    discount_pct: float | None = None
    vat_rate: float | None = None
    transport_cost: float | None = None
    installation_cost: float | None = None
    extra_costs: float | None = None
    notes: str | None = None

class QuoteItemIn(BaseModel):
    name: str
    qty: int = 1
    unit_price: float = 0.0
    window_spec: Any = {}
    svg: str | None = None
    notes: str | None = None

class QuoteItemOut(QuoteItemIn):
    id: str
    position: int
    unit_price_cents: int = 0

class QuoteItemUpdate(BaseModel):
    name: str | None = None
    qty: int | None = None
    unit_price: float | None = None
    window_spec: Any | None = None
    svg: str | None = None
    notes: str | None = None

class ClientUpdate(BaseModel):
    name: str | None = None
    email: str | None = None
    phone: str | None = None
    address: str | None = None
    tax_id: str | None = None
