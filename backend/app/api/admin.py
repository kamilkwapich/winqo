from fastapi import APIRouter, Depends, HTTPException
from datetime import datetime
from sqlmodel import Session, select, delete
from uuid import UUID
from app.db.session import get_session
from app.db.models import Tenant, User, Subscription, DiscountCode, Client, Quote, QuoteItem, UserSettings, PaymentEvent
from app.schemas.admin import TenantOut, UserOut, CreateUserIn, CreateTenantIn, CreateSubscriptionIn, DiscountCodeIn, DiscountCodeOut
from app.api.tenant_deps import require_roles
from app.core.roles import Role
from app.core.security import hash_password
from app.services.billing.plan_changes import change_subscription_plan
from app.services.billing.plans import has_plan, get_plan, convert_cents, get_fx_rates
from app.services.email import get_email_settings, test_email_settings

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/users-dashboard")
def list_users_dashboard(session: Session = Depends(get_session), user=Depends(require_roles(Role.SUPER_ADMIN))):
    users = session.exec(select(User).order_by(User.created_at.desc())).all()
    tenants = {t.id: t for t in session.exec(select(Tenant)).all()}
    
    subs = session.exec(select(Subscription).order_by(Subscription.created_at.desc())).all()
    latest_subs = {}
    for s in subs:
        if s.tenant_id not in latest_subs:
            latest_subs[s.tenant_id] = s
            
    results = []
    for u in users:
        t = tenants.get(u.tenant_id)
        s = latest_subs.get(u.tenant_id)
        
        results.append({
            "user_id": str(u.id),
            "email": u.email,
            "created_at": u.created_at.isoformat(),
            "tenant": {
                "id": str(t.id),
                "name": t.name,
                "billing_full_name": t.billing_full_name,
                "billing_tax_id": t.billing_tax_id,
                "billing_country": t.billing_country,
                "billing_city": t.billing_city,
                "billing_street": t.billing_street,
                "billing_postcode": t.billing_postcode,
                "billing_house_no": t.billing_house_no,
                "billing_apartment_no": t.billing_apartment_no,
                "billing_region": t.billing_region,
                "company_email": t.company_email,
                "default_currency": t.default_currency,
            } if t else None,
            "subscription": {
                "plan_code": s.plan_code,
                "status": s.status,
                "current_period_end": s.current_period_end.isoformat() if s.current_period_end else None,
                "price_amount": s.price_amount,
                "currency": s.currency,
            } if s else None
        })
    return results

@router.get("/payment-logs")
def list_payment_logs(limit: int = 100, session: Session = Depends(get_session), user=Depends(require_roles(Role.SUPER_ADMIN))):
    rows = session.exec(select(PaymentEvent).order_by(PaymentEvent.received_at.desc()).limit(limit)).all()
    # Enrich with tenant name if possible
    logs = []
    tenants_cache = {}
    
    for row in rows:
        tenant_name = None
        if row.tenant_id:
            if row.tenant_id not in tenants_cache:
                t = session.get(Tenant, row.tenant_id)
                tenants_cache[row.tenant_id] = t.name if t else "Unknown"
            tenant_name = tenants_cache[row.tenant_id]
            
        logs.append({
            "id": str(row.id),
            "provider": row.provider,
            "event_type": row.event_type,
            "received_at": row.received_at.isoformat(),
            "processed_ok": row.processed_ok,
            "error": row.error,
            "tenant_id": str(row.tenant_id) if row.tenant_id else None,
            "tenant_name": tenant_name,
            "payload": row.payload,
        })
    return logs

@router.get("/tenants", response_model=list[TenantOut])
def list_tenants(session: Session = Depends(get_session), user=Depends(require_roles(Role.SUPER_ADMIN))):
    rows = session.exec(select(Tenant).order_by(Tenant.created_at.desc())).all()
    return [TenantOut(
        id=str(t.id), 
        name=t.name, 
        default_lang=t.default_lang, 
        newsletter_subscribed=t.newsletter_subscribed,
        created_at=t.created_at.isoformat()
    ) for t in rows]

@router.post("/tenants", response_model=TenantOut)
def create_tenant(data: CreateTenantIn, session: Session = Depends(get_session), user=Depends(require_roles(Role.SUPER_ADMIN))):
    name = (data.name or "").strip()
    if not name:
        raise HTTPException(status_code=400, detail="Name required")
    tnt = Tenant(
        name=name,
        default_lang=data.default_lang or "pl",
        default_currency=data.default_currency or "EUR",
        newsletter_subscribed=bool(data.newsletter_subscribed),
    )
    session.add(tnt)
    session.commit()
    session.refresh(tnt)
    return TenantOut(
        id=str(tnt.id),
        name=tnt.name,
        default_lang=tnt.default_lang,
        newsletter_subscribed=tnt.newsletter_subscribed,
        created_at=tnt.created_at.isoformat(),
    )

@router.delete("/tenants/{tenant_id}")
def delete_tenant(tenant_id: UUID, session: Session = Depends(get_session), user=Depends(require_roles(Role.SUPER_ADMIN))):
    tenant = session.get(Tenant, tenant_id)
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")

    # Remove dependent records to avoid FK conflicts
    session.exec(delete(QuoteItem).where(QuoteItem.tenant_id == tenant_id))
    session.exec(delete(Quote).where(Quote.tenant_id == tenant_id))
    session.exec(delete(Client).where(Client.tenant_id == tenant_id))
    session.exec(delete(Subscription).where(Subscription.tenant_id == tenant_id))
    session.exec(delete(UserSettings).where(UserSettings.tenant_id == tenant_id))
    session.exec(delete(PaymentEvent).where(PaymentEvent.tenant_id == tenant_id))
    session.exec(delete(User).where(User.tenant_id == tenant_id))
    session.delete(tenant)
    session.commit()
    return {"ok": True}

@router.get("/users", response_model=list[UserOut])
def list_users(session: Session = Depends(get_session), user=Depends(require_roles(Role.SUPER_ADMIN))):
    rows = session.exec(select(User).order_by(User.created_at.desc())).all()
    return [UserOut(id=str(u.id), tenant_id=str(u.tenant_id) if u.tenant_id else None, email=u.email, role=u.role, is_active=u.is_active, created_at=u.created_at.isoformat()) for u in rows]

@router.post("/users", response_model=UserOut)
def create_user(data: CreateUserIn, session: Session = Depends(get_session), user=Depends(require_roles(Role.SUPER_ADMIN))):
    existing = session.exec(select(User).where(User.email == data.email)).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email exists")
    tenant_id = UUID(data.tenant_id) if data.tenant_id else None
    u = User(tenant_id=tenant_id, email=data.email, password_hash=hash_password(data.password), role=data.role, is_active=data.is_active)
    session.add(u); session.commit(); session.refresh(u)
    return UserOut(id=str(u.id), tenant_id=str(u.tenant_id) if u.tenant_id else None, email=u.email, role=u.role, is_active=u.is_active, created_at=u.created_at.isoformat())

@router.put("/users/{user_id}", response_model=UserOut)
def update_user(user_id: UUID, payload: dict, session: Session = Depends(get_session), user=Depends(require_roles(Role.SUPER_ADMIN))):
    u = session.get(User, user_id)
    if not u:
        raise HTTPException(status_code=404, detail="User not found")
    if "is_active" in payload:
        u.is_active = bool(payload.get("is_active"))
    if "role" in payload and payload.get("role"):
        try:
            u.role = Role(payload.get("role"))
        except Exception as exc:
            raise HTTPException(status_code=400, detail="Invalid role") from exc
    session.add(u); session.commit(); session.refresh(u)
    return UserOut(id=str(u.id), tenant_id=str(u.tenant_id) if u.tenant_id else None, email=u.email, role=u.role, is_active=u.is_active, created_at=u.created_at.isoformat())

@router.delete("/users/{user_id}")
def delete_user(user_id: UUID, session: Session = Depends(get_session), user=Depends(require_roles(Role.SUPER_ADMIN))):
    if str(user.id) == str(user_id):
        raise HTTPException(status_code=400, detail="Cannot delete self")
    u = session.get(User, user_id)
    if not u:
        raise HTTPException(status_code=404, detail="User not found")
    session.delete(u)
    session.commit()
    return {"ok": True}

@router.get("/email-settings")
def get_email_settings_admin(session: Session = Depends(get_session), user=Depends(require_roles(Role.SUPER_ADMIN))):
    s = get_email_settings(session)
    return {
        "smtp_host": s.smtp_host,
        "smtp_port": s.smtp_port,
        "smtp_user": s.smtp_user,
        "smtp_password": s.smtp_password,
        "smtp_from": s.smtp_from,
        "smtp_tls": s.smtp_tls,
        "imap_host": s.imap_host,
        "imap_port": s.imap_port,
        "imap_user": s.imap_user,
        "imap_password": s.imap_password,
        "imap_tls": s.imap_tls,
    }

@router.put("/email-settings")
def update_email_settings(payload: dict, session: Session = Depends(get_session), user=Depends(require_roles(Role.SUPER_ADMIN))):
    s = get_email_settings(session)
    s.smtp_host = payload.get("smtp_host") or None
    s.smtp_port = int(payload.get("smtp_port") or 0) or None
    s.smtp_user = payload.get("smtp_user") or None
    s.smtp_password = payload.get("smtp_password") or None
    s.smtp_from = payload.get("smtp_from") or None
    s.smtp_tls = bool(payload.get("smtp_tls", True))
    s.imap_host = payload.get("imap_host") or None
    s.imap_port = int(payload.get("imap_port") or 0) or None
    s.imap_user = payload.get("imap_user") or None
    s.imap_password = payload.get("imap_password") or None
    s.imap_tls = bool(payload.get("imap_tls", True))
    session.add(s); session.commit()
    return {"ok": True}

@router.post("/email-settings/test")
def test_email_settings_admin(payload: dict, session: Session = Depends(get_session), user=Depends(require_roles(Role.SUPER_ADMIN))):
    return test_email_settings(session, payload or {})

@router.get("/subscriptions")
def list_subscriptions(session: Session = Depends(get_session), user=Depends(require_roles(Role.SUPER_ADMIN))):
    rows = session.exec(select(Subscription).order_by(Subscription.created_at.desc())).all()
    return [{
        "id": str(s.id),
        "tenant_id": str(s.tenant_id),
        "provider": s.provider,
        "status": s.status,
        "plan_code": s.plan_code,
        "pending_plan_code": s.pending_plan_code,
        "price_amount": s.price_amount,
        "currency": s.currency,
        "current_period_end": s.current_period_end.isoformat() if s.current_period_end else None,
    } for s in rows]

@router.post("/subscriptions", response_model=dict)
def create_subscription(data: CreateSubscriptionIn, session: Session = Depends(get_session), user=Depends(require_roles(Role.SUPER_ADMIN))):
    tenant = session.get(Tenant, UUID(data.tenant_id)) if data.tenant_id else None
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")

    if not has_plan(data.plan_code):
        raise HTTPException(status_code=400, detail="Unknown plan")

    plan = get_plan(data.plan_code)
    rates = get_fx_rates(session)
    currency = (data.currency or plan.currency or "EUR").upper()
    price_amount = data.price_amount if data.price_amount is not None else convert_cents(plan.price_amount, currency, rates=rates)

    sub = Subscription(
        tenant_id=tenant.id,
        provider=data.provider or "stripe",
        status=data.status or "active",
        plan_code=plan.code,
        price_amount=price_amount,
        currency=currency,
    )
    session.add(sub)
    session.commit()
    session.refresh(sub)
    return {
        "id": str(sub.id),
        "tenant_id": str(sub.tenant_id),
        "provider": sub.provider,
        "status": sub.status,
        "plan_code": sub.plan_code,
        "pending_plan_code": sub.pending_plan_code,
        "price_amount": sub.price_amount,
        "currency": sub.currency,
        "current_period_end": sub.current_period_end.isoformat() if sub.current_period_end else None,
    }

@router.post("/subscriptions/{subscription_id}/change-plan")
def change_subscription(subscription_id: UUID, payload: dict, session: Session = Depends(get_session), user=Depends(require_roles(Role.SUPER_ADMIN))):
    plan_code = payload.get("plan_code")
    if not plan_code:
        raise HTTPException(status_code=400, detail="Missing plan code")
    sub = session.get(Subscription, subscription_id)
    if not sub:
        raise HTTPException(status_code=404, detail="Subscription not found")
    tenant = session.get(Tenant, sub.tenant_id)
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")
    try:
        result = change_subscription_plan(session, tenant, sub, plan_code, payload.get("timing"))
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    return result

@router.post("/subscriptions/{subscription_id}/force-plan")
def force_subscription(subscription_id: UUID, payload: dict, session: Session = Depends(get_session), user=Depends(require_roles(Role.SUPER_ADMIN))):
    plan_code = payload.get("plan_code")
    if not plan_code or not has_plan(plan_code):
        raise HTTPException(status_code=400, detail="Unknown plan")
    sub = session.get(Subscription, subscription_id)
    if not sub:
        raise HTTPException(status_code=404, detail="Subscription not found")
    plan = get_plan(plan_code)
    rates = get_fx_rates(session)
    currency = sub.currency or plan.currency
    sub.plan_code = plan.code
    sub.price_amount = convert_cents(plan.price_amount, currency, rates=rates)
    sub.pending_plan_code = None
    sub.pending_change_at = None
    if sub.status != "active":
        sub.status = "active"
    session.add(sub)
    session.commit()
    return {"ok": True, "plan_code": sub.plan_code, "status": sub.status}


@router.delete("/subscriptions/{subscription_id}")
def delete_subscription(subscription_id: UUID, session: Session = Depends(get_session), user=Depends(require_roles(Role.SUPER_ADMIN))):
    sub = session.get(Subscription, subscription_id)
    if not sub:
        raise HTTPException(status_code=404, detail="Subscription not found")
    session.delete(sub)
    session.commit()
    return {"ok": True}


@router.get("/discount-codes", response_model=list[DiscountCodeOut])
def list_discount_codes(session: Session = Depends(get_session), user=Depends(require_roles(Role.SUPER_ADMIN))):
    rows = session.exec(select(DiscountCode).order_by(DiscountCode.created_at.desc())).all()
    return [
        DiscountCodeOut(
            id=str(row.id),
            code=row.code,
            type=row.type,
            percent_value=row.percent_value,
            amount_cents=row.amount_cents,
            currency=row.currency,
            active=row.active,
            expires_at=row.expires_at.isoformat() if row.expires_at else None,
            created_at=row.created_at.isoformat(),
        )
        for row in rows
    ]


@router.post("/discount-codes", response_model=DiscountCodeOut)
def create_discount_code(data: DiscountCodeIn, session: Session = Depends(get_session), user=Depends(require_roles(Role.SUPER_ADMIN))):
    code = (data.code or "").strip().upper()
    if not code:
        raise HTTPException(status_code=400, detail="Missing code")
    existing = session.exec(select(DiscountCode).where(DiscountCode.code == code)).first()
    if existing:
        raise HTTPException(status_code=400, detail="Code already exists")
    if data.type not in ("percent", "amount"):
        raise HTTPException(status_code=400, detail="Invalid type")
    percent_value = data.percent_value if data.type == "percent" else None
    amount_cents = data.amount_cents if data.type == "amount" else None
    currency = data.currency.upper() if data.currency else None
    expires_at = None
    if data.expires_at:
        try:
            expires_at = datetime.fromisoformat(data.expires_at)
        except Exception as exc:
            raise HTTPException(status_code=400, detail="Invalid expires_at") from exc
    row = DiscountCode(
        code=code,
        type=data.type,
        percent_value=percent_value,
        amount_cents=amount_cents,
        currency=currency,
        active=bool(data.active),
        expires_at=expires_at,
    )
    session.add(row)
    session.commit()
    session.refresh(row)
    return DiscountCodeOut(
        id=str(row.id),
        code=row.code,
        type=row.type,
        percent_value=row.percent_value,
        amount_cents=row.amount_cents,
        currency=row.currency,
        active=row.active,
        expires_at=row.expires_at.isoformat() if row.expires_at else None,
        created_at=row.created_at.isoformat(),
    )


@router.put("/discount-codes/{code}", response_model=DiscountCodeOut)
def update_discount_code(code: str, payload: dict, session: Session = Depends(get_session), user=Depends(require_roles(Role.SUPER_ADMIN))):
    normalized = (code or "").strip().upper()
    row = session.exec(select(DiscountCode).where(DiscountCode.code == normalized)).first()
    if not row:
        raise HTTPException(status_code=404, detail="Discount code not found")
    if "active" in payload:
        row.active = bool(payload.get("active"))
    if "expires_at" in payload:
        val = payload.get("expires_at")
        if val:
            try:
                row.expires_at = datetime.fromisoformat(str(val))
            except Exception as exc:
                raise HTTPException(status_code=400, detail="Invalid expires_at") from exc
        else:
            row.expires_at = None
    session.add(row)
    session.commit()
    session.refresh(row)
    return DiscountCodeOut(
        id=str(row.id),
        code=row.code,
        type=row.type,
        percent_value=row.percent_value,
        amount_cents=row.amount_cents,
        currency=row.currency,
        active=row.active,
        expires_at=row.expires_at.isoformat() if row.expires_at else None,
        created_at=row.created_at.isoformat(),
    )


@router.delete("/discount-codes/{code}")
def delete_discount_code(code: str, session: Session = Depends(get_session), user=Depends(require_roles(Role.SUPER_ADMIN))):
    normalized = (code or "").strip().upper()
    row = session.exec(select(DiscountCode).where(DiscountCode.code == normalized)).first()
    if not row:
        raise HTTPException(status_code=404, detail="Discount code not found")
    session.delete(row)
    session.commit()
    return {"ok": True}
