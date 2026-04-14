from __future__ import annotations
from datetime import datetime, timezone
from sqlmodel import Session, select
from app.db.models import DiscountCode
from app.services.billing.plans import get_fx_rates

class DiscountError(ValueError):
    pass


def normalize_discount_code(code: str | None) -> str:
    return (code or "").strip().upper()


def compute_discount(
    session: Session,
    code: str,
    base_amount_cents: int,
    currency: str,
):
    normalized = normalize_discount_code(code)
    row = session.exec(select(DiscountCode).where(DiscountCode.code == normalized)).first()
    if not row or not row.active:
        raise DiscountError("Invalid discount code")
    now = datetime.now(timezone.utc)
    expires_at = row.expires_at
    if expires_at and expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if expires_at and expires_at < now:
        raise DiscountError("Discount code expired")
    if base_amount_cents <= 0:
        raise DiscountError("Invalid base amount")

    currency = (currency or "EUR").upper()
    discount_cents = 0
    if (row.type or "").lower() == "percent":
        pct = float(row.percent_value or 0)
        if pct <= 0 or pct > 100:
            raise DiscountError("Invalid percent value")
        discount_cents = int(round(base_amount_cents * (pct / 100.0)))
    else:
        amount = int(row.amount_cents or 0)
        if amount <= 0:
            raise DiscountError("Invalid discount value")
        origin_currency = (row.currency or currency).upper()
        target_currency = currency
        if origin_currency != target_currency:
            rates = get_fx_rates(session)
            origin_rate = float(rates.get(origin_currency, 1.0)) or 1.0
            target_rate = float(rates.get(target_currency, 1.0)) or 1.0
            discount_cents = int(round((amount / origin_rate) * target_rate))
        else:
            discount_cents = amount

    if discount_cents > base_amount_cents:
        discount_cents = base_amount_cents
    final_cents = base_amount_cents - discount_cents
    return (
        {
            "code": normalized,
            "discount_amount_cents": discount_cents,
            "final_amount_cents": final_cents,
            "base_amount_cents": base_amount_cents,
            "currency": currency,
            "type": row.type,
        },
        row,
    )
