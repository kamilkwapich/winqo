from __future__ import annotations
from dataclasses import dataclass
from typing import Optional
import os
from sqlmodel import Session
from app.db.models import GlobalBillingSettings

SUPPORTED_LANGS = ["pl", "en-us", "en-uk", "fr", "de", "it", "es"]

@dataclass(frozen=True)
class Plan:
    code: str
    tier: str
    interval: str  # month/year
    price_amount: int
    currency: str
    monthly_quote_limit: Optional[int]
    language_mode: str  # single/all
    logo_allowed: bool
    show_branding: bool
    popular: bool = False

PLANS: dict[str, Plan] = {
    "DEMO": Plan(code="DEMO", tier="demo", interval="month", price_amount=0, currency="EUR", monthly_quote_limit=None, language_mode="all", logo_allowed=False, show_branding=True),
    "STARTER_M": Plan(code="STARTER_M", tier="starter", interval="month", price_amount=899, currency="EUR", monthly_quote_limit=35, language_mode="single", logo_allowed=False, show_branding=True),
    "STARTER_Y": Plan(code="STARTER_Y", tier="starter", interval="year", price_amount=8999, currency="EUR", monthly_quote_limit=35, language_mode="single", logo_allowed=False, show_branding=True),
    "PRO_M": Plan(code="PRO_M", tier="pro", interval="month", price_amount=2199, currency="EUR", monthly_quote_limit=150, language_mode="single", logo_allowed=True, show_branding=True, popular=True),
    "PRO_Y": Plan(code="PRO_Y", tier="pro", interval="year", price_amount=21999, currency="EUR", monthly_quote_limit=150, language_mode="single", logo_allowed=True, show_branding=True, popular=True),
    "PRO_M_TRIAL": Plan(code="PRO_M_TRIAL", tier="pro", interval="month", price_amount=1499, currency="EUR", monthly_quote_limit=150, language_mode="single", logo_allowed=True, show_branding=True, popular=True),
    "PRO_Y_PROMO": Plan(code="PRO_Y_PROMO", tier="pro", interval="year", price_amount=21999, currency="EUR", monthly_quote_limit=150, language_mode="single", logo_allowed=True, show_branding=True, popular=True),
    "MAX_M": Plan(code="MAX_M", tier="max", interval="month", price_amount=3999, currency="EUR", monthly_quote_limit=None, language_mode="all", logo_allowed=True, show_branding=False),
    "MAX_Y": Plan(code="MAX_Y", tier="max", interval="year", price_amount=39999, currency="EUR", monthly_quote_limit=None, language_mode="all", logo_allowed=True, show_branding=False),
}

DEFAULT_PLAN_CODE = "PRO_M"

FX_RATES = {
    "EUR": 1.0,
    "PLN": float(os.getenv("FX_RATE_PLN", "4.3")),
    "USD": float(os.getenv("FX_RATE_USD", "1.1")),
    "GBP": float(os.getenv("FX_RATE_GBP", "0.86")),
}

CURRENCY_BY_LANG = {
    "pl": "PLN",
    "en-us": "USD",
    "en-uk": "GBP",
}


def normalize_lang(lang: str | None) -> str:
    value = (lang or "").strip().lower()
    if value == "en":
        return "en-us"
    return value


def get_plan(code: str | None) -> Plan:
    if not code:
        return PLANS[DEFAULT_PLAN_CODE]
    return PLANS.get(code, PLANS[DEFAULT_PLAN_CODE])

def has_plan(code: str | None) -> bool:
    return bool(code) and code in PLANS

def currency_for_lang(lang: str | None) -> str:
    normalized = normalize_lang(lang)
    return CURRENCY_BY_LANG.get(normalized, "EUR")

def get_fx_rates(session: Session | None = None) -> dict[str, float]:
    rates = dict(FX_RATES)
    if not session:
        return rates
    settings_row = session.get(GlobalBillingSettings, 1)
    if not settings_row or not settings_row.fx_rates:
        return rates
    for key, value in settings_row.fx_rates.items():
        try:
            rate = float(value)
        except (TypeError, ValueError):
            continue
        if rate > 0:
            rates[key.upper()] = rate
    return rates

def convert_cents(amount_cents_eur: int, currency: str, rates: dict[str, float] | None = None) -> int:
    table = rates or FX_RATES
    rate = table.get(currency, 1.0)
    return int(round(amount_cents_eur * rate))

def monthly_equivalent(plan_code: str) -> float:
    plan = get_plan(plan_code)
    if plan.interval == "year":
        return plan.price_amount / 12.0
    return float(plan.price_amount)

def allowed_languages(plan: Plan, tenant_lang: str | None) -> list[str]:
    if plan.language_mode == "all":
        return SUPPORTED_LANGS[:]
    return [normalize_lang(tenant_lang)] if tenant_lang else []
