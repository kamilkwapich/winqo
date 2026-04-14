from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from uuid import UUID
from app.db.session import get_session
from app.db.models import Tenant, Subscription
from app.schemas.tenants import TenantProfileOut, TenantProfileUpdate
from app.api.tenant_deps import require_tenant, current_user
from app.services.billing.plans import get_plan

router = APIRouter(prefix="/tenants", tags=["tenants"])


@router.get("/me", response_model=TenantProfileOut)
def get_tenant_profile(tenant_id: UUID = Depends(require_tenant), session: Session = Depends(get_session), user=Depends(current_user)):
    tenant = session.get(Tenant, tenant_id)
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")
    return TenantProfileOut(
        id=str(tenant.id),
        name=tenant.name,
        default_lang=tenant.default_lang,
        default_currency=tenant.default_currency,
        company_email=tenant.company_email,
        company_phone=tenant.company_phone,
        company_website=tenant.company_website,
        company_address=tenant.company_address,
        logo_data=tenant.logo_data,
        billing_full_name=tenant.billing_full_name,
        billing_street=tenant.billing_street,
        billing_house_no=tenant.billing_house_no,
        billing_apartment_no=tenant.billing_apartment_no,
        billing_postcode=tenant.billing_postcode,
        billing_city=tenant.billing_city,
        billing_region=tenant.billing_region,
        billing_country=tenant.billing_country,
        billing_tax_id=tenant.billing_tax_id,
    )


@router.put("/me", response_model=TenantProfileOut)
def update_tenant_profile(data: TenantProfileUpdate, tenant_id: UUID = Depends(require_tenant), session: Session = Depends(get_session), user=Depends(current_user)):
    tenant = session.get(Tenant, tenant_id)
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")
    sub = session.exec(
        select(Subscription)
        .where(Subscription.tenant_id == tenant_id)
        .order_by(Subscription.created_at.desc())
    ).first()
    plan = get_plan(sub.plan_code if sub else None)
    if data.name is not None:
        tenant.name = data.name.strip() or tenant.name
    if data.default_lang is not None:
        tenant.default_lang = data.default_lang
    if data.default_currency is not None:
        tenant.default_currency = data.default_currency
    if data.company_email is not None:
        tenant.company_email = data.company_email or None
    if data.company_phone is not None:
        tenant.company_phone = data.company_phone or None
    if data.company_website is not None:
        tenant.company_website = data.company_website or None
    if data.company_address is not None:
        tenant.company_address = data.company_address or None
    if data.logo_data is not None:
        if data.logo_data and not plan.logo_allowed:
            raise HTTPException(status_code=403, detail="Logo not allowed for plan")
        tenant.logo_data = data.logo_data or None
    if data.billing_full_name is not None:
        tenant.billing_full_name = data.billing_full_name or None
    if data.billing_street is not None:
        tenant.billing_street = data.billing_street or None
    if data.billing_house_no is not None:
        tenant.billing_house_no = data.billing_house_no or None
    if data.billing_apartment_no is not None:
        tenant.billing_apartment_no = data.billing_apartment_no or None
    if data.billing_postcode is not None:
        tenant.billing_postcode = data.billing_postcode or None
    if data.billing_city is not None:
        tenant.billing_city = data.billing_city or None
    if data.billing_region is not None:
        tenant.billing_region = data.billing_region or None
    if data.billing_country is not None:
        tenant.billing_country = data.billing_country or None
    if data.billing_tax_id is not None:
        tenant.billing_tax_id = data.billing_tax_id or None
    session.add(tenant); session.commit(); session.refresh(tenant)
    return TenantProfileOut(
        id=str(tenant.id),
        name=tenant.name,
        default_lang=tenant.default_lang,
        default_currency=tenant.default_currency,
        company_email=tenant.company_email,
        company_phone=tenant.company_phone,
        company_website=tenant.company_website,
        company_address=tenant.company_address,
        logo_data=tenant.logo_data,
        billing_full_name=tenant.billing_full_name,
        billing_street=tenant.billing_street,
        billing_house_no=tenant.billing_house_no,
        billing_apartment_no=tenant.billing_apartment_no,
        billing_postcode=tenant.billing_postcode,
        billing_city=tenant.billing_city,
        billing_region=tenant.billing_region,
        billing_country=tenant.billing_country,
        billing_tax_id=tenant.billing_tax_id,
    )
