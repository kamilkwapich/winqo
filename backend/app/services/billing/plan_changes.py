from __future__ import annotations
from typing import Any
from sqlmodel import Session
from app.core.config import settings
from app.db.models import Subscription, Tenant
from app.services.billing.plans import has_plan
from app.services.billing.subscriptions import classify_change, apply_subscription_update
from app.services.billing.stripe_provider import StripeProvider
from app.services.billing.paypal_provider import PayPalProvider

PROVIDER_CLIENTS = {
    "stripe": StripeProvider(),
    "paypal": PayPalProvider(),
}

PROMO_PLAN_MAP = {
    "PRO_M_TRIAL": "PRO_M",
    "PRO_Y_PROMO": "PRO_Y",
}

def normalize_plan_code(plan_code: str) -> str:
    return PROMO_PLAN_MAP.get(plan_code, plan_code)

def change_subscription_plan(
    session: Session,
    tenant: Tenant,
    subscription: Subscription,
    target_plan_code: str,
    requested_timing: str | None = None,
) -> dict[str, Any]:
    provider_name = subscription.provider
    if provider_name not in PROVIDER_CLIENTS:
        raise ValueError("Unsupported provider")

    target_code = normalize_plan_code(target_plan_code)
    if not has_plan(target_code):
        raise ValueError("Unknown plan")

    kind = classify_change(subscription.plan_code, target_code)
    if kind == "same":
        raise ValueError("Plan already active")
    timing = requested_timing or ("now" if kind != "downgrade" else "period_end")
    if kind == "upgrade":
        timing = "now"
    if kind == "downgrade":
        timing = "period_end"
        if not subscription.current_period_end:
            timing = "now"

    provider = PROVIDER_CLIENTS[provider_name]
    if not provider.enabled():
        raise ValueError("Provider not configured")
    currency = tenant.default_currency or "EUR"
    if not subscription.provider_subscription_id:
        raise ValueError("Missing provider subscription")

    if provider_name == "stripe":
        update = provider.change_plan(
            subscription.provider_subscription_id,
            target_code,
            currency,
            timing,
            db_session=session,
            tenant_id=str(tenant.id),
        )
    elif provider_name == "paypal":
        update = provider.change_plan(
            subscription.provider_subscription_id,
            target_code,
            currency,
            timing,
            mode=settings.mode,
            db_session=session,
        )
    else:
        update = None

    if timing == "period_end":
        subscription.pending_plan_code = target_code
        subscription.pending_change_at = subscription.current_period_end
        session.add(subscription)
        session.commit()

    if update:
        apply_subscription_update(session, provider_name, update)
    return {"timing": timing, "kind": kind, "target_plan_code": target_code}
