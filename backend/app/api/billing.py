from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from fastapi import APIRouter, Depends, Header, Request, HTTPException
from sqlmodel import Session, select
from sqlalchemy import func
from uuid import UUID
from datetime import datetime, timezone
from urllib.request import urlopen
import json
import stripe
from app.db.session import get_session
from app.api.tenant_deps import require_roles, current_user
from app.api.deps import decode_token
from app.core.roles import Role
from app.core.config import settings
from app.db.models import GlobalBillingSettings, PaymentEvent, Subscription, Tenant, Quote
from app.services.billing.stripe_provider import StripeProvider
from app.services.billing.paypal_provider import PayPalProvider
from app.services.billing.autopay_provider import AutopayProvider
from app.services.billing.plans import get_plan, allowed_languages, normalize_lang, has_plan, currency_for_lang, convert_cents, get_fx_rates
from app.services.billing.subscriptions import apply_subscription_update
from app.services.billing.plan_changes import change_subscription_plan
from app.services.billing.discounts import compute_discount, DiscountError

router = APIRouter(prefix="/billing", tags=["billing"])

providers = {
    "stripe": StripeProvider(),
    "paypal": PayPalProvider(),
    "autopay": AutopayProvider(),
}

def get_settings_row(session: Session) -> GlobalBillingSettings:
    s = session.get(GlobalBillingSettings, 1)
    if not s:
        s = GlobalBillingSettings(id=1)
        session.add(s)
        session.commit()
        session.refresh(s)
    return s

def sync_stripe_session(session_id: str, session: Session, expected_tenant_id: UUID | None = None) -> dict:
    provider = providers.get("stripe")
    if not provider or not provider.enabled() or not settings.stripe_secret_key:
        raise HTTPException(status_code=400, detail="Stripe not configured")

    stripe.api_key = settings.stripe_secret_key
    try:
        checkout = stripe.checkout.Session.retrieve(session_id)
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"Invalid Stripe session: {exc}") from exc

    if checkout.get("mode") != "subscription":
        raise HTTPException(status_code=400, detail="Stripe session is not a subscription")

    payment_status = checkout.get("payment_status")
    if payment_status not in {"paid", "no_payment_required"}:
        raise HTTPException(status_code=400, detail="Stripe payment not completed")

    tenant_id = checkout.get("client_reference_id")
    if expected_tenant_id and tenant_id and str(expected_tenant_id) != str(tenant_id):
        raise HTTPException(status_code=403, detail="Stripe session tenant mismatch")

    sub_id = checkout.get("subscription")
    if not sub_id:
        raise HTTPException(status_code=400, detail="Missing Stripe subscription")

    subscription = stripe.Subscription.retrieve(sub_id)
    update = provider._normalize_subscription(subscription)
    if not update:
        raise HTTPException(status_code=400, detail="Unable to parse Stripe subscription")

    if not update.get("tenant_id"):
        update["tenant_id"] = str(expected_tenant_id or tenant_id or "")
    if expected_tenant_id:
        update["tenant_id"] = str(expected_tenant_id)

    if not update.get("tenant_id"):
        raise HTTPException(status_code=400, detail="Missing tenant_id in Stripe subscription")

    apply_subscription_update(session, "stripe", update)
    return {"ok": True, "subscription": update}


class VATVerifyRequest(BaseModel):
    country: str
    vat_number: str


@router.post("/verify-vat")
def verify_vat(body: VATVerifyRequest):
    import httpx
    import xml.etree.ElementTree as ET

    country = (body.country or "").strip().upper()
    vat = (body.vat_number or "").strip()
    if not country or not vat:
        raise HTTPException(status_code=400, detail="country and vat_number required")

    # VIES SOAP endpoint
    url = "https://ec.europa.eu/taxation_customs/vies/services/checkVatService"
    envelope = f"""
    <soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
      <soap:Body>
        <checkVat xmlns="urn:ec.europa.eu:taxud:vies:services:checkVat:types">
          <countryCode>{country}</countryCode>
          <vatNumber>{vat}</vatNumber>
        </checkVat>
      </soap:Body>
    </soap:Envelope>
    """
    headers = {"Content-Type": "text/xml; charset=utf-8"}
    try:
        with httpx.Client(timeout=20) as client:
            res = client.post(url, content=envelope.encode("utf-8"), headers=headers)
            res.raise_for_status()
            text = res.text
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"VIES request failed: {exc}")

    # Parse simple XML response
    try:
        root = ET.fromstring(text)
        ns = "{urn:ec.europa.eu:taxud:vies:services:checkVat:types}"
        # Try to find response body with namespace
        body_el = root.find(f".//{ns}checkVatResponse")
        
        # Fallback to no namespace or partial search if needed, but primary is namespaced
        def get_text(element, tag):
            # Try specific namespace first
            el = element.find(f"{ns}{tag}")
            if el is None:
                # Try recursive search without namespace as fallback
                el = element.find(f".//{tag}")
            return el.text.strip() if el is not None and el.text else None

        if body_el is not None:
             valid_str = get_text(body_el, "valid")
             valid = (valid_str.lower() == "true") if valid_str else False
             name = get_text(body_el, "name")
             address = get_text(body_el, "address")
        else:
             # Try searching from root if structure is different
             valid_el = root.find('.//valid')
             valid = (valid_el.text.lower() == "true") if valid_el is not None and valid_el.text else False
             name_el = root.find('.//name')
             addr_el = root.find('.//address')
             name = name_el.text.strip() if name_el is not None and name_el.text else None
             address = addr_el.text.strip() if addr_el is not None and addr_el.text else None

    except Exception:
        raise HTTPException(status_code=502, detail="Failed to parse VIES response")

    return {"valid": valid, "name": name, "address": address}

def get_latest_subscription(session: Session, tenant_id: UUID) -> Subscription | None:
    return session.exec(
        select(Subscription)
        .where(Subscription.tenant_id == tenant_id)
        .order_by(Subscription.created_at.desc())
    ).first()

def month_bounds(now: datetime | None = None) -> tuple[datetime, datetime]:
    current = now or datetime.now(timezone.utc)
    start = current.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    if start.month == 12:
        end = start.replace(year=start.year + 1, month=1)
    else:
        end = start.replace(month=start.month + 1)
    return start, end

def fetch_nbp_rates() -> dict[str, float]:
    url = "https://api.nbp.pl/api/exchangerates/tables/A?format=json"
    try:
        with urlopen(url, timeout=10) as resp:
            payload = resp.read().decode("utf-8")
        data = json.loads(payload)
    except Exception as exc:
        raise HTTPException(status_code=502, detail="NBP fetch failed") from exc
    if not isinstance(data, list) or not data:
        raise HTTPException(status_code=502, detail="NBP data invalid")
    table = data[0]
    rates_list = table.get("rates", [])
    if not isinstance(rates_list, list):
        raise HTTPException(status_code=502, detail="NBP data invalid")
    rates = {}
    for entry in rates_list:
        code = entry.get("code")
        mid = entry.get("mid")
        if not code or mid is None:
            continue
        try:
            rates[code.upper()] = float(mid)
        except (TypeError, ValueError):
            continue
    if "EUR" not in rates or rates["EUR"] <= 0:
        raise HTTPException(status_code=502, detail="NBP data missing EUR rate")
    pln_per_eur = rates["EUR"]
    result = {"PLN": round(pln_per_eur, 6)}
    usd = rates.get("USD")
    if usd and usd > 0:
        result["USD"] = round(pln_per_eur / usd, 6)
    gbp = rates.get("GBP")
    if gbp and gbp > 0:
        result["GBP"] = round(pln_per_eur / gbp, 6)
    return result


@router.get("/settings")
def get_settings(session: Session = Depends(get_session), user=Depends(require_roles(Role.SUPER_ADMIN))):
    s = get_settings_row(session)
    return {
        "stripe_enabled": s.stripe_enabled,
        "paypal_enabled": s.paypal_enabled,
        "autopay_enabled": s.autopay_enabled,
        "mode": s.mode,
        "fx_rates": s.fx_rates or {},
        "dashboard_banner_data": s.dashboard_banner_data,
    }

@router.get("/fx-rates/nbp")
def get_nbp_rates(session: Session = Depends(get_session), user=Depends(require_roles(Role.SUPER_ADMIN))):
    return {"rates": fetch_nbp_rates()}

@router.put("/settings")
def update_settings(payload: dict, session: Session = Depends(get_session), user=Depends(require_roles(Role.SUPER_ADMIN))):
    s = get_settings_row(session)
    s.stripe_enabled = bool(payload.get("stripe_enabled", s.stripe_enabled))
    s.paypal_enabled = bool(payload.get("paypal_enabled", s.paypal_enabled))
    s.autopay_enabled = bool(payload.get("autopay_enabled", s.autopay_enabled))
    s.mode = payload.get("mode", s.mode)
    if "dashboard_banner_data" in payload:
        s.dashboard_banner_data = payload.get("dashboard_banner_data") or None
    fx_rates = payload.get("fx_rates")
    if isinstance(fx_rates, dict):
        cleaned = dict(s.fx_rates or {})
        for key in ["PLN", "USD", "GBP"]:
            value = fx_rates.get(key)
            if value is None:
                continue
            try:
                rate = float(value)
            except (TypeError, ValueError):
                continue
            if rate > 0:
                cleaned[key] = rate
        s.fx_rates = cleaned
    session.commit()
    return {"ok": True}

@router.get("/banner")
def get_dashboard_banner(session: Session = Depends(get_session), user=Depends(current_user)):
    s = get_settings_row(session)
    return {"dashboard_banner_data": s.dashboard_banner_data}

@router.get("/providers")
def available_providers(session: Session = Depends(get_session), user=Depends(current_user)):
    s = get_settings_row(session)
    return {
        "stripe": bool(s.stripe_enabled and providers["stripe"].enabled()),
        "paypal": bool(s.paypal_enabled and providers["paypal"].enabled()),
        "autopay": bool(s.autopay_enabled and providers["autopay"].enabled()),
    }

@router.post("/checkout")
def start_checkout(payload: dict, session: Session = Depends(get_session), user=Depends(current_user)):
    if not getattr(user, "tenant_id", None):
        raise HTTPException(status_code=403, detail="Tenant required")
    plan_code = payload.get("plan_code")
    if not has_plan(plan_code):
        raise HTTPException(status_code=400, detail="Unknown plan")

    s = get_settings_row(session)
    provider_name = payload.get("provider")
    if provider_name:
        if provider_name not in providers:
            raise HTTPException(status_code=400, detail="Unknown provider")
        if provider_name == "stripe" and not s.stripe_enabled:
            raise HTTPException(status_code=400, detail="Stripe disabled")
        if provider_name == "paypal" and not s.paypal_enabled:
            raise HTTPException(status_code=400, detail="PayPal disabled")
        if provider_name == "autopay" and not s.autopay_enabled:
            raise HTTPException(status_code=400, detail="Autopay disabled")
        if not providers[provider_name].enabled():
            raise HTTPException(status_code=400, detail="Provider not configured")
    else:
        if s.stripe_enabled and providers["stripe"].enabled():
            provider_name = "stripe"
        elif s.paypal_enabled and providers["paypal"].enabled():
            provider_name = "paypal"
        elif s.autopay_enabled and providers["autopay"].enabled():
            provider_name = "autopay"
        else:
            raise HTTPException(status_code=400, detail="No billing provider configured")

    provider = providers[provider_name]
    tenant = session.get(Tenant, user.tenant_id)
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")
    lang = normalize_lang(tenant.default_lang)
    currency = tenant.default_currency or currency_for_lang(lang)
    base_url = payload.get("base_url") or settings.web_base_url
    success_url = payload.get("success_url") or f"{base_url}/{lang}/app/account?billing=success"
    cancel_url = payload.get("cancel_url") or f"{base_url}/{lang}/app/account?billing=cancel"
    discount_kwargs = {}
    sub = get_latest_subscription(session, tenant.id)
    if sub and sub.discount_amount_cents:
        discount_kwargs = {
            "discount_amount_cents": sub.discount_amount_cents,
            "discount_code": sub.discount_code,
            "base_amount_cents": sub.base_price_amount,  # using base_price_amount for discounting logic
        }
    
    # Use subscription specific price amount/currency if available (e.g. VAT adjusted)
    checkout_amount_cents = sub.price_amount if sub.price_amount else None
    checkout_currency = sub.currency if sub.currency else (tenant.default_currency or currency_for_lang(lang))

    url = provider.create_checkout(
        str(tenant.id),
        user.email,
        plan_code,
        success_url=success_url,
        cancel_url=cancel_url,
        currency=checkout_currency,
        amount_cents=checkout_amount_cents,
        mode=s.mode,
        db_session=session,
        **discount_kwargs,
    )
    return {"url": url}

@router.get("/providers-public")
def available_providers_public(session: Session = Depends(get_session)):
    s = get_settings_row(session)
    return {
        "stripe": bool(s.stripe_enabled and providers["stripe"].enabled()),
        "paypal": bool(s.paypal_enabled and providers["paypal"].enabled()),
        "autopay": bool(s.autopay_enabled and providers["autopay"].enabled()),
    }

@router.post("/checkout-public")
def start_checkout_public(payload: dict, session: Session = Depends(get_session)):
    token = payload.get("token")
    if not token:
        raise HTTPException(status_code=400, detail="Missing token")
    claims = decode_token(token)
    if not claims.get("pay") or not claims.get("tid"):
        raise HTTPException(status_code=403, detail="Invalid token")
    tenant_id = UUID(str(claims["tid"]))
    email = claims.get("sub")
    tenant = session.get(Tenant, tenant_id)
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")
    sub = get_latest_subscription(session, tenant_id)
    if not sub:
        raise HTTPException(status_code=404, detail="Subscription not found")
    s = get_settings_row(session)
    provider_name = payload.get("provider")
    if provider_name:
        if provider_name not in providers:
            raise HTTPException(status_code=400, detail="Unknown provider")
        if provider_name == "stripe" and not s.stripe_enabled:
            raise HTTPException(status_code=400, detail="Stripe disabled")
        if provider_name == "paypal" and not s.paypal_enabled:
            raise HTTPException(status_code=400, detail="PayPal disabled")
        if provider_name == "autopay" and not s.autopay_enabled:
            raise HTTPException(status_code=400, detail="Autopay disabled")
        if not providers[provider_name].enabled():
            raise HTTPException(status_code=400, detail="Provider not configured")
    else:
        if s.stripe_enabled and providers["stripe"].enabled():
            provider_name = "stripe"
        elif s.paypal_enabled and providers["paypal"].enabled():
            provider_name = "paypal"
        elif s.autopay_enabled and providers["autopay"].enabled():
            provider_name = "autopay"
        else:
            raise HTTPException(status_code=400, detail="No billing provider configured")
    provider = providers[provider_name]
    lang = normalize_lang(tenant.default_lang)
    base_url = payload.get("base_url") or settings.web_base_url
    success_url = payload.get("success_url") or f"{base_url}/{lang}/payment-required?token={token}&status=success"
    cancel_url = payload.get("cancel_url") or f"{base_url}/{lang}/payment-required?token={token}&status=cancel"
    discount_kwargs = {}
    if sub.discount_amount_cents:
        discount_kwargs = {
            "discount_amount_cents": sub.discount_amount_cents,
            "discount_code": sub.discount_code,
            "base_amount_cents": sub.base_price_amount, 
        }

    # Use subscription specific price amount/currency if available (e.g. VAT adjusted)
    checkout_amount_cents = sub.price_amount if sub.price_amount else None
    checkout_currency = sub.currency if sub.currency else (tenant.default_currency or currency_for_lang(lang))

    url = provider.create_checkout(
        str(tenant.id),
        email,
        sub.plan_code,
        success_url=success_url,
        cancel_url=cancel_url,
        currency=checkout_currency,
        amount_cents=checkout_amount_cents,
        mode=s.mode,
        db_session=session,
        **discount_kwargs,
    )
    return {"url": url}

@router.post("/stripe/sync-session")
def stripe_sync_session(payload: dict, session: Session = Depends(get_session), user=Depends(current_user)):
    session_id = payload.get("session_id")
    if not session_id:
        raise HTTPException(status_code=400, detail="Missing session_id")
    if not getattr(user, "tenant_id", None):
        raise HTTPException(status_code=403, detail="Tenant required")
    return sync_stripe_session(session_id, session, expected_tenant_id=user.tenant_id)

@router.post("/stripe/sync-session-public")
def stripe_sync_session_public(payload: dict, session: Session = Depends(get_session)):
    token = payload.get("token")
    session_id = payload.get("session_id")
    if not token or not session_id:
        raise HTTPException(status_code=400, detail="Missing token or session_id")
    claims = decode_token(token)
    if not claims.get("pay") or not claims.get("tid"):
        raise HTTPException(status_code=403, detail="Invalid token")
    tenant_id = UUID(str(claims["tid"]))
    return sync_stripe_session(session_id, session, expected_tenant_id=tenant_id)


@router.post("/discount-codes/preview")
def preview_discount(payload: dict, session: Session = Depends(get_session)):
    code = payload.get("code")
    plan_code = payload.get("plan_code")
    lang = payload.get("lang") or "en"
    if not code:
        raise HTTPException(status_code=400, detail="Missing code")
    if not has_plan(plan_code):
        raise HTTPException(status_code=400, detail="Unknown plan")
    normalized_lang = normalize_lang(lang)
    plan = get_plan(plan_code)
    currency = currency_for_lang(normalized_lang)
    rates = get_fx_rates(session)
    base_amount_cents = convert_cents(plan.price_amount, currency, rates=rates)
    try:
        result, _ = compute_discount(session, code, base_amount_cents, currency)
    except DiscountError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    return {
        **result,
        "base_amount": round(result["base_amount_cents"] / 100, 2),
        "discount_amount": round(result["discount_amount_cents"] / 100, 2),
        "final_amount": round(result["final_amount_cents"] / 100, 2),
    }

@router.post("/change-plan")
def change_plan(payload: dict, session: Session = Depends(get_session), user=Depends(current_user)):
    if not getattr(user, "tenant_id", None):
        raise HTTPException(status_code=403, detail="Tenant required")
    plan_code = payload.get("plan_code")
    if not has_plan(plan_code):
        raise HTTPException(status_code=400, detail="Unknown plan")
    sub = get_latest_subscription(session, user.tenant_id)
    if not sub or not sub.provider_subscription_id:
        raise HTTPException(status_code=400, detail="No active subscription")
    tenant = session.get(Tenant, user.tenant_id)
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")
    try:
        result = change_subscription_plan(session, tenant, sub, plan_code, payload.get("timing"))
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    return result

@router.post("/webhook/{provider_name}")
async def webhook(provider_name: str, request: Request, session: Session = Depends(get_session)):
    provider = providers.get(provider_name)
    if not provider:
        raise HTTPException(status_code=404, detail="Unknown provider")

    settings_row = get_settings_row(session)
    payload = await request.body()
    headers = {k.lower(): v for k, v in request.headers.items()}
    try:
        result = provider.handle_webhook(payload, headers, mode=settings_row.mode) or {}
    except Exception as exc:
        ev = PaymentEvent(
            provider=provider_name,
            event_id="error",
            event_type="error",
            tenant_id=None,
            processed_ok=False,
            error=str(exc),
            payload={},
        )
        session.add(ev)
        session.commit()
        raise HTTPException(status_code=400, detail=f"Webhook error: {exc}") from exc

    event_id = str(result.get("id") or result.get("event_id") or "unknown")
    event_type = str(result.get("type") or result.get("event_type") or "unknown")

    tenant_id = None
    try:
        tid = result.get("tenant_id")
        if tid:
            tenant_id = UUID(str(tid))
    except Exception:
        tenant_id = None

    ev = PaymentEvent(
        provider=provider_name,
        event_id=event_id,
        event_type=event_type,
        tenant_id=tenant_id,
        processed_ok=bool(result.get("ok", False)),
        error=result.get("error"),
        payload=result.get("data") or {},
    )
    session.add(ev)
    session.commit()
    if result.get("ok") and result.get("subscription"):
        apply_subscription_update(session, provider_name, result.get("subscription"))
    return {"ok": True}

@router.get("/subscription")
def my_subscription(session: Session = Depends(get_session), user=Depends(current_user)):
    if not getattr(user, "tenant_id", None):
        return {"has_tenant": False, "subscription": None}

    sub = get_latest_subscription(session, user.tenant_id)

    if not sub:
        return {"has_tenant": True, "subscription": None}

    plan = get_plan(sub.plan_code)
    return {
        "has_tenant": True,
        "subscription": {
            "id": str(sub.id),
            "tenant_id": str(sub.tenant_id),
            "provider": sub.provider,
            "status": sub.status,
            "plan_code": sub.plan_code,
            "plan_tier": plan.tier,
            "interval": plan.interval,
            "monthly_quote_limit": plan.monthly_quote_limit,
            "language_mode": plan.language_mode,
            "logo_allowed": plan.logo_allowed,
            "show_branding": plan.show_branding,
            "price_amount": sub.price_amount,
            "currency": sub.currency,
            "current_period_start": sub.current_period_start.isoformat() if sub.current_period_start else None,
            "current_period_end": sub.current_period_end.isoformat() if sub.current_period_end else None,
            "cancel_at_period_end": sub.cancel_at_period_end,
            "pending_plan_code": sub.pending_plan_code,
            "pending_change_at": sub.pending_change_at.isoformat() if sub.pending_change_at else None,
        },
    }

@router.get("/entitlements")
def my_entitlements(session: Session = Depends(get_session), user=Depends(current_user)):
    if not getattr(user, "tenant_id", None):
        return {"has_tenant": False, "entitlements": None}

    tenant = session.get(Tenant, user.tenant_id)
    sub = get_latest_subscription(session, user.tenant_id)
    plan = get_plan(sub.plan_code if sub else None)
    langs = allowed_languages(plan, tenant.default_lang if tenant else None)
    start, end = month_bounds()
    count = session.exec(
        select(func.count())
        .select_from(Quote)
        .where(Quote.tenant_id == user.tenant_id, Quote.created_at >= start, Quote.created_at < end)
    ).one()
    limit = plan.monthly_quote_limit
    remaining = None if limit is None else max(0, limit - int(count))
    return {
        "has_tenant": True,
        "entitlements": {
            "plan_code": plan.code,
            "plan_tier": plan.tier,
            "interval": plan.interval,
            "price_amount": sub.price_amount if sub else plan.price_amount,
            "currency": sub.currency if sub else plan.currency,
            "monthly_quote_limit": limit,
            "monthly_quote_count": int(count),
            "monthly_quote_remaining": remaining,
            "language_mode": plan.language_mode,
            "allowed_languages": langs,
            "default_lang": normalize_lang(tenant.default_lang if tenant else None),
            "logo_allowed": plan.logo_allowed,
            "show_branding": plan.show_branding,
        },
    }

@router.get("/history")
def my_billing_history(limit: int = 50, session: Session = Depends(get_session), user=Depends(current_user)):
    if not getattr(user, "tenant_id", None):
        return []

    rows = session.exec(
        select(PaymentEvent)
        .where(PaymentEvent.tenant_id == user.tenant_id)
        .order_by(PaymentEvent.received_at.desc())
        .limit(max(1, min(limit, 200)))
    ).all()

    return [{
        "id": str(ev.id),
        "provider": ev.provider,
        "event_id": ev.event_id,
        "event_type": ev.event_type,
        "received_at": ev.received_at.isoformat(),
        "processed_ok": ev.processed_ok,
        "error": ev.error,
    } for ev in rows]

@router.post("/portal")
def open_billing_portal(payload: dict, session: Session = Depends(get_session), user=Depends(current_user)):
    if not getattr(user, "tenant_id", None):
        raise HTTPException(status_code=403, detail="Tenant required")

    return_url = payload.get("return_url") or "http://localhost:3000"

    sub = session.exec(
        select(Subscription)
        .where(Subscription.tenant_id == user.tenant_id)
        .order_by(Subscription.created_at.desc())
    ).first()
    if not sub:
        raise HTTPException(status_code=404, detail="Subscription not found")

    provider = providers.get(sub.provider)
    if not provider:
        raise HTTPException(status_code=400, detail="Unknown provider")

    if not sub.provider_customer_id:
        return {"url": "https://example.com/customer-not-linked"}

    try:
        url = provider.create_portal(sub.provider_customer_id, return_url)
    except NotImplementedError:
        url = "https://example.com/portal-not-implemented"

    return {"url": url}
