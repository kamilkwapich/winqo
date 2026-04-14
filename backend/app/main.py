from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.db.session import create_db_and_tables, ensure_schema, engine
from sqlmodel import Session, select
from app.db.models import User, Tenant, Subscription, GlobalBillingSettings
from app.core.security import hash_password
from app.core.roles import Role
from app.services.billing.plans import get_plan, currency_for_lang, convert_cents

from app.api.auth import router as auth_router
from app.api.quotes import router as quotes_router
from app.api.pdf import router as pdf_router
from app.api.admin import router as admin_router
from app.api.billing import router as billing_router
from app.api.users import router as users_router
from app.api.tenants import router as tenants_router
from app.api.settings import router as settings_router

app = FastAPI(title="Winqo API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def on_startup():
    create_db_and_tables()
    ensure_schema()

    # Seed data if empty
    with Session(engine) as session:
        any_user = session.exec(select(User)).first()
        if not any_user:
            # global billing settings
            session.add(GlobalBillingSettings(id=1, stripe_enabled=True, paypal_enabled=True, autopay_enabled=False, mode="sandbox"))

            # Super admin
            session.add(User(tenant_id=None, email="admin@demo.local", password_hash=hash_password("Admin123!"), role=Role.SUPER_ADMIN, is_active=True))

            # Demo tenant
            demo_lang = "pl"
            demo_currency = currency_for_lang(demo_lang)
            tenant = Tenant(name="Demo Sp. z o.o.", default_lang=demo_lang, default_currency=demo_currency)
            session.add(tenant); session.flush()
            session.add(User(tenant_id=tenant.id, email="owner@demo.local", password_hash=hash_password("Owner123!"), role=Role.TENANT_OWNER, is_active=True))
            demo_plan = get_plan("PRO_M")
            session.add(Subscription(tenant_id=tenant.id, provider="stripe", status="active", plan_code=demo_plan.code, price_amount=convert_cents(demo_plan.price_amount, demo_currency), currency=demo_currency))
            session.commit()

app.include_router(auth_router)
app.include_router(quotes_router)
app.include_router(pdf_router)
app.include_router(admin_router)
app.include_router(billing_router)
app.include_router(users_router)
app.include_router(tenants_router)
app.include_router(settings_router)
