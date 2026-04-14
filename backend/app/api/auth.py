from fastapi import APIRouter, Depends, Header, HTTPException
from sqlmodel import Session, select
from app.db.session import get_session
from app.db.models import User, Tenant, Subscription, GlobalBillingSettings
from app.schemas.auth import LoginRequest, TokenResponse, RegisterTenantRequest, MeResponse, RegisterInitRequest
from app.core.security import verify_password, hash_password, create_access_token, create_payment_token
from app.core.roles import Role
from app.services.billing.plans import get_plan, normalize_lang, SUPPORTED_LANGS, has_plan, currency_for_lang, convert_cents, get_fx_rates
from app.services.billing.discounts import compute_discount, DiscountError
from app.services.email import send_payment_link_email, send_verification_email, send_password_reset_email
from app.api.deps import decode_token
from uuid import uuid4, UUID

router = APIRouter(prefix="/auth", tags=["auth"])

def get_user_from_token(session: Session, token: str) -> User:
    payload = decode_token(token)
    user_id = payload.get("uid")
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid token")
    user = session.get(User, UUID(user_id))
    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="Inactive user")
    return user

@router.post("/login-from-payment", response_model=TokenResponse)
def login_from_payment(payload: dict, session: Session = Depends(get_session)):
    token = payload.get("token")
    if not token:
        raise HTTPException(status_code=400, detail="Missing token")
    claims = decode_token(token)
    if not claims.get("pay") or not claims.get("tid"):
        raise HTTPException(status_code=403, detail="Invalid token")

    tenant_id = UUID(str(claims["tid"]))
    email = claims.get("sub")
    if not email:
        raise HTTPException(status_code=400, detail="Missing email")

    user = session.exec(select(User).where(User.email == email)).first()
    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="Invalid user")
    if user.tenant_id and user.tenant_id != tenant_id:
        raise HTTPException(status_code=403, detail="Tenant mismatch")

    sub = session.exec(
        select(Subscription)
        .where(Subscription.tenant_id == tenant_id)
        .order_by(Subscription.created_at.desc())
    ).first()
    if not sub or sub.status != "active":
        raise HTTPException(status_code=402, detail="Payment required")

    access_token = create_access_token(
        subject=user.email,
        claims={"uid": str(user.id), "tid": str(tenant_id), "role": user.role},
    )
    return TokenResponse(access_token=access_token)

@router.post("/login", response_model=TokenResponse)
def login(data: LoginRequest, session: Session = Depends(get_session)):
    user = session.exec(select(User).where(User.email == data.email)).first()
    if not user or not verify_password(data.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    if user.tenant_id:
        sub = session.exec(
            select(Subscription)
            .where(Subscription.tenant_id == user.tenant_id)
            .order_by(Subscription.created_at.desc())
        ).first()
        if not sub or sub.status != "active":
            tenant = session.get(Tenant, user.tenant_id)
            token = create_payment_token(str(user.tenant_id), user.email)
            if tenant:
                try:
                    send_payment_link_email(session, tenant, user.email, token)
                except Exception:
                    pass
            raise HTTPException(status_code=402, detail={"error": "payment_required", "payment_token": token})
    token = create_access_token(subject=user.email, claims={"uid": str(user.id), "tid": str(user.tenant_id) if user.tenant_id else None, "role": user.role})
    return TokenResponse(access_token=token)

@router.get("/me", response_model=MeResponse)
def me(authorization: str = Header(...), session: Session = Depends(get_session)):
    if not authorization.lower().startswith("bearer "):
        raise HTTPException(status_code=401, detail="Missing bearer token")
    token = authorization.split(" ", 1)[1]
    user = get_user_from_token(session, token)
    return MeResponse(id=str(user.id), email=user.email, role=user.role, tenant_id=str(user.tenant_id) if user.tenant_id else None)

@router.post("/register-init")
def register_init(data: RegisterInitRequest, session: Session = Depends(get_session)):
    existing = session.exec(select(User).where(User.email == data.email)).first()
    if existing:
        if existing.is_verified:
            raise HTTPException(status_code=400, detail="Email already registered")
        # If exists but not verified, resend email or update?
        # Let's update details and resend
        existing.password_hash = hash_password(data.password)
        existing.registration_metadata = data.metadata
        existing.verification_token = str(uuid4())
        session.add(existing)
        session.commit()
        session.refresh(existing)
        try:
            send_verification_email(session, existing.email, existing.verification_token, data.lang)
        except Exception as e:
            print(f"Error sending verification email: {e}")
            pass # Non-blocking if email fails in dev
        return {"ok": True, "message": "Verification email sent"}

    u = User(
        email=data.email, 
        password_hash=hash_password(data.password), 
        is_active=True,  # User itself is active (can login potentially?) No, we use is_verified check usually. Or let them login but restricted?
        is_verified=False,
        verification_token=str(uuid4()),
        registration_metadata=data.metadata
    )
    session.add(u)
    session.commit()
    session.refresh(u)
    try:
        send_verification_email(session, u.email, u.verification_token, data.lang)
    except Exception as e:
        print(f"Error sending verification email: {e}")
        pass
    return {"ok": True, "message": "Verification email sent"}

@router.post("/verify-email")
def verify_email(payload: dict, session: Session = Depends(get_session)):
    token = payload.get("token")
    if not token:
        raise HTTPException(status_code=400, detail="Missing token")
    
    user = session.exec(select(User).where(User.verification_token == token)).first()
    if not user:
        raise HTTPException(status_code=400, detail="Invalid token")
    
    user.is_verified = True
    user.verification_token = None
    session.add(user)
    session.commit()
    session.refresh(user)
    
    # Return metadata to rehydrate frontend state
    return {
        "ok": True,
        "metadata": user.registration_metadata,
        "email": user.email
    }

@router.post("/request-password-reset")
def request_password_reset(payload: dict, session: Session = Depends(get_session)):
    email = payload.get("email")
    lang = payload.get("lang", "en")
    
    # Normally for security we always say "If email exists..." but user asked for specific behavior:
    # "jesli mail w bazie to komunikat ze link... jesli nie ma to komunikat ze nie ma takiego adresu"
    user = session.exec(select(User).where(User.email == email)).first()
    if not user:
         raise HTTPException(status_code=404, detail="User not found")
    
    # Generate token
    token = str(uuid4())
    user.password_reset_token = token
    session.add(user)
    session.commit()
    session.refresh(user)
    
    try:
        send_password_reset_email(session, user.email, token, lang)
    except Exception as e:
        print(f"Error sending reset email: {e}")
        # Dont fail request if email fails? Or fail? Let's not fail critical flow but log it.
        pass
    
    return {"ok": True, "message": "Reset link sent"}

@router.post("/reset-password")
def reset_password(payload: dict, session: Session = Depends(get_session)):
    token = payload.get("token")
    password = payload.get("password")
    
    if not token or not password:
         raise HTTPException(status_code=400, detail="Missing required fields")
    
    user = session.exec(select(User).where(User.password_reset_token == token)).first()
    if not user:
         raise HTTPException(status_code=400, detail="Invalid token")

    user.password_hash = hash_password(password)
    user.password_reset_token = None
    session.add(user)
    session.commit()
    
    return {"ok": True, "message": "Password changed"}

@router.post("/register-tenant")
def register_tenant(data: RegisterTenantRequest, session: Session = Depends(get_session)):
    # MVP: open registration. In production, you likely create tenant only after successful checkout webhook.
    existing = session.exec(select(User).where(User.email == data.owner_email)).first()
    
    owner = None
    
    if existing:
        if existing.tenant_id:
             raise HTTPException(status_code=400, detail="Email already exists and has tenant")
        if not existing.is_verified:
             raise HTTPException(status_code=400, detail="Email not verified")
        if not verify_password(data.owner_password, existing.password_hash):
             raise HTTPException(status_code=400, detail="Invalid password")
        
        owner = existing
    
    normalized_lang = normalize_lang(data.lang)
    if normalized_lang not in SUPPORTED_LANGS:
        raise HTTPException(status_code=400, detail="Unsupported language")
    if not has_plan(data.plan_code):
        raise HTTPException(status_code=400, detail="Unknown plan")
    plan = get_plan(data.plan_code)
    currency = currency_for_lang(normalized_lang)
    rates = get_fx_rates(session)
    base_price_amount = convert_cents(plan.price_amount, currency, rates=rates)
    discount_code = None
    discount_amount_cents = 0
    if data.discount_code:
        try:
            discount_result, _ = compute_discount(session, data.discount_code, base_price_amount, currency)
            discount_code = discount_result.get("code")
            discount_amount_cents = int(discount_result.get("discount_amount_cents") or 0)
        except DiscountError as exc:
            raise HTTPException(status_code=400, detail=str(exc))
    # VAT rules:
    EU_COUNTRIES = {"AT","BE","BG","HR","CY","CZ","DK","EE","FI","FR","DE","GR","HU","IE","IT","LV","LT","LU","MT","NL","PT","RO","SK","SI","ES","SE","PL"}
    def is_eu(country_code: str) -> bool:
        return (country_code or "").upper() in EU_COUNTRIES

    vat_rate = 0.0
    billing_country = (data.billing_country or "").upper()
    billing_vat = (data.billing_tax_id or "").strip()
    # Poland: always add 23% VAT (display as brutto in frontend)
    if billing_country == "PL":
        vat_rate = 23.0
    elif is_eu(billing_country) and billing_country != "PL":
        # For EU (except PL) VAT number is expected; verify via VIES if present
        if not billing_vat:
            # require VAT number per business rule
            raise HTTPException(status_code=400, detail="VAT number required for EU country")
        # call VIES SOAP to verify
        try:
            import httpx
            import xml.etree.ElementTree as ET
            url = "https://ec.europa.eu/taxation_customs/vies/services/checkVatService"
            envelope = f"""
            <soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
              <soap:Body>
                <checkVat xmlns="urn:ec.europa.eu:taxud:vies:services:checkVat:types">
                  <countryCode>{billing_country}</countryCode>
                  <vatNumber>{billing_vat}</vatNumber>
                </checkVat>
              </soap:Body>
            </soap:Envelope>
            """
            headers = {"Content-Type": "text/xml; charset=utf-8"}
            with httpx.Client(timeout=20) as client:
                res = client.post(url, content=envelope.encode("utf-8"), headers=headers)
                res.raise_for_status()
                root = ET.fromstring(res.text)
                valid_el = root.find('.//{urn:ec.europa.eu:taxud:vies:services:checkVat:types}valid') or root.find('.//valid')
                valid = (valid_el.text.lower() == "true") if valid_el is not None and valid_el.text else False
        except Exception:
            valid = False
        if not valid:
            vat_rate = 23.0
        else:
            vat_rate = 0.0

    tenant = Tenant(
        name=data.tenant_name,
        default_lang=normalized_lang,
        default_currency=currency,
        billing_full_name=data.billing_full_name,
        billing_street=data.billing_street,
        billing_house_no=data.billing_house_no,
        billing_apartment_no=data.billing_apartment_no,
        billing_postcode=data.billing_postcode,
        billing_city=data.billing_city,
        billing_region=data.billing_region,
        billing_country=data.billing_country,
        billing_tax_id=data.billing_tax_id,
        billing_auto_filled=bool(getattr(data, "billing_auto_filled", False)),
        newsletter_subscribed=data.newsletter_subscribed,
    )
    session.add(tenant)
    session.flush()

    if owner:
        owner.tenant_id = tenant.id
        owner.role = Role.TENANT_OWNER
        owner.is_active = True
        session.add(owner)
    else:
        owner = User(
            tenant_id=tenant.id,
            email=data.owner_email,
            password_hash=hash_password(data.owner_password),
            role=Role.TENANT_OWNER,
            is_active=True,
        )
        session.add(owner)

    # Create placeholder subscription (inactive) until provider activates it
    final_net = max(base_price_amount - discount_amount_cents, 0)
    vat_amount = int(round(final_net * (vat_rate / 100.0))) if vat_rate else 0
    final_price = final_net + vat_amount
    sub = Subscription(
        tenant_id=tenant.id,
        provider="stripe",
        status="inactive",
        plan_code=plan.code,
        base_price_amount=base_price_amount,
        price_amount=final_price,
        currency=currency,
        discount_code=discount_code,
        discount_amount_cents=discount_amount_cents,
    )
    session.add(sub)

    # Ensure global billing settings exists
    g = session.get(GlobalBillingSettings, 1)
    if not g:
        session.add(GlobalBillingSettings(id=1, stripe_enabled=True, paypal_enabled=True, autopay_enabled=False, mode="sandbox"))

    session.commit()
    payment_token = create_payment_token(str(tenant.id), owner.email)
    try:
        send_payment_link_email(session, tenant, owner.email, payment_token)
    except Exception:
        pass
    return {"tenant_id": str(tenant.id), "owner_id": str(owner.id), "payment_token": payment_token}
