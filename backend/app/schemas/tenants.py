from pydantic import BaseModel


class TenantProfileOut(BaseModel):
    id: str
    name: str
    default_lang: str
    default_currency: str
    company_email: str | None = None
    company_phone: str | None = None
    company_website: str | None = None
    company_address: str | None = None
    logo_data: str | None = None
    billing_full_name: str | None = None
    billing_street: str | None = None
    billing_house_no: str | None = None
    billing_apartment_no: str | None = None
    billing_postcode: str | None = None
    billing_city: str | None = None
    billing_region: str | None = None
    billing_country: str | None = None
    billing_tax_id: str | None = None


class TenantProfileUpdate(BaseModel):
    name: str | None = None
    default_lang: str | None = None
    default_currency: str | None = None
    company_email: str | None = None
    company_phone: str | None = None
    company_website: str | None = None
    company_address: str | None = None
    logo_data: str | None = None
    billing_full_name: str | None = None
    billing_street: str | None = None
    billing_house_no: str | None = None
    billing_apartment_no: str | None = None
    billing_postcode: str | None = None
    billing_city: str | None = None
    billing_region: str | None = None
    billing_country: str | None = None
    billing_tax_id: str | None = None
