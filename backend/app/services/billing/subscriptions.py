from __future__ import annotations
from datetime import datetime, timezone
from uuid import UUID
from sqlmodel import Session, select
from app.db.models import Subscription
from app.services.billing.plans import monthly_equivalent

def classify_change(current_code: str, target_code: str) -> str:
    if current_code == target_code:
        return "same"
    current_value = monthly_equivalent(current_code)
    target_value = monthly_equivalent(target_code)
    if target_value > current_value:
        return "upgrade"
    if target_value < current_value:
        return "downgrade"
    return "lateral"

def apply_subscription_update(session: Session, provider_name: str, payload: dict | None) -> None:
    if not payload:
        return
    tenant_id = payload.get("tenant_id")
    if not tenant_id:
        return
    try:
        tenant_uuid = UUID(str(tenant_id))
    except Exception:
        return
    sub = None
    provider_subscription_id = payload.get("provider_subscription_id")
    if provider_subscription_id:
        sub = session.exec(
            select(Subscription)
            .where(Subscription.provider_subscription_id == provider_subscription_id)
            .order_by(Subscription.created_at.desc())
        ).first()
    if not sub:
        sub = session.exec(
            select(Subscription)
            .where(Subscription.tenant_id == tenant_uuid, Subscription.provider == provider_name)
            .order_by(Subscription.created_at.desc())
        ).first()
    if not sub:
        sub = Subscription(tenant_id=tenant_uuid, provider=provider_name, status="inactive", plan_code=payload.get("plan_code") or "PRO_M")
        session.add(sub)
    sub.provider = provider_name
    sub.plan_code = payload.get("plan_code") or sub.plan_code
    sub.status = payload.get("status") or sub.status
    sub.provider_customer_id = payload.get("provider_customer_id") or sub.provider_customer_id
    sub.provider_subscription_id = payload.get("provider_subscription_id") or sub.provider_subscription_id
    if payload.get("price_amount") is not None:
        sub.price_amount = int(payload["price_amount"])
    if payload.get("currency"):
        sub.currency = payload["currency"]
    if payload.get("current_period_start"):
        sub.current_period_start = payload["current_period_start"]
    if payload.get("current_period_end"):
        sub.current_period_end = payload["current_period_end"]
    if payload.get("cancel_at_period_end") is not None:
        sub.cancel_at_period_end = bool(payload["cancel_at_period_end"])
    if payload.get("plan_code") and sub.pending_plan_code == payload.get("plan_code"):
        sub.pending_plan_code = None
        sub.pending_change_at = None
    sub.last_event_at = datetime.now(timezone.utc)
    session.commit()
