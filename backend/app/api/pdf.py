from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Request
from fastapi.responses import Response
from sqlmodel import Session, select
from uuid import UUID
from app.db.session import get_session
from app.api.tenant_deps import require_tenant, current_user
from app.db.models import Quote, QuoteItem, Tenant, Client, Subscription
from app.services.pdf import render_quote_pdf, make_translator, format_window_spec
from app.services.billing.plans import get_plan, allowed_languages, normalize_lang
from datetime import datetime

router = APIRouter(prefix="/pdf", tags=["pdf"])


@router.get("/quote/{quote_id}")
def quote_pdf(
    quote_id: str,
    tenant_id: UUID = Depends(require_tenant),
    session: Session = Depends(get_session),
    user=Depends(current_user),
    variant: Optional[str] = Query(None),
    lang: Optional[str] = Query(None),
    price_mode: Optional[str] = Query(None),
    request: Request = None,
):
    qid = UUID(quote_id)
    quote = session.get(Quote, qid)
    if not quote or quote.tenant_id != tenant_id:
        raise HTTPException(status_code=404, detail="Quote not found")

    tenant = session.get(Tenant, tenant_id)
    client = session.get(Client, quote.client_id) if quote.client_id else None
    items = session.exec(select(QuoteItem).where(QuoteItem.tenant_id == tenant_id, QuoteItem.quote_id == qid).order_by(QuoteItem.created_at.asc())).all()

    subtotal = sum(i.qty * i.unit_price_cents for i in items)
    discount = int(subtotal * (quote.discount_pct / 100.0))
    base_after_discount = subtotal - discount

    transport_cents = quote.transport_cost_cents or 0
    installation_cents = quote.installation_cost_cents or 0
    extra_cents = quote.extra_costs_cents or 0

    taxable_cents = base_after_discount + transport_cents + installation_cents + extra_cents
    vat_amount_cents = int(round(taxable_cents * (quote.vat_rate or 0.0) / 100.0)) if quote.vat_rate else 0
    total = taxable_cents + vat_amount_cents
    sub = session.exec(
        select(Subscription)
        .where(Subscription.tenant_id == tenant_id)
        .order_by(Subscription.created_at.desc())
    ).first()
    plan = get_plan(sub.plan_code if sub else None)

    def normalize_requested(value: str | None) -> str | None:
        if not value:
            return None
        raw = value.strip().lower()
        # Map common prefixes to supported codes
        if raw.startswith("en"):
            return "en-us"
        if raw.startswith("pl"):
            return "pl"
        if raw.startswith("it"):
            return "it"
        if raw.startswith("es"):
            return "es"
        if raw.startswith("de"):
            return "de"
        if raw.startswith("fr"):
            return "fr"
        return normalize_lang(raw)

    def normalize_price_mode(value: str | None) -> str:
        raw = (value or "full").strip().lower()
        mapping = {
            "full": "full",
            "with-prices": "full",
            "with_prices": "full",
            "all": "full",
            "total-only": "total-only",
            "total_only": "total-only",
            "total": "total-only",
            "summary": "total-only",
            "none": "none",
            "without-prices": "none",
            "without_prices": "none",
            "no-prices": "none",
            "no_prices": "none",
        }
        normalized = mapping.get(raw)
        if not normalized:
            raise HTTPException(status_code=400, detail="Unsupported price mode")
        return normalized

    header_lang = None
    if request:
        header_lang = request.headers.get("x-lang") or request.headers.get("accept-language")
        if header_lang:
            # Accept-Language may have weight; take the first token
            header_lang = header_lang.split(",")[0].strip()

    requested_lang = normalize_requested(lang) or normalize_requested(header_lang)
    normalized_price_mode = normalize_price_mode(price_mode)
    quote_lang = normalize_lang(quote.lang)
    allowed_langs = allowed_languages(plan, tenant.default_lang if tenant else None)
    selected_lang = requested_lang or quote_lang
    if requested_lang and allowed_langs and requested_lang not in allowed_langs:
        if plan.language_mode != "all":
            raise HTTPException(status_code=403, detail="Language not allowed for plan")
        # Plan allows all; fall back to quote lang if mapping failed to a supported code
        requested_lang = None
        selected_lang = quote_lang

    t = make_translator(selected_lang or quote.lang)
    logo_data = tenant.logo_data if plan.logo_allowed else None

    items_out = []
    for idx, item in enumerate(items, start=1):
        items_out.append({
            "id": str(item.id),
            "position": idx,
            "name": item.name,
            "qty": item.qty,
            "unit_price_cents": item.unit_price_cents,
            "total_cents": item.qty * item.unit_price_cents,
            "svg": item.svg,
            "notes": item.notes,
            "spec_lines": format_window_spec(item.window_spec or {}, t, selected_lang or quote.lang),
        })

    context = {
        "tenant": tenant,
        "logo_data": logo_data,
        "client": client,
        "quote": quote,
        "items": items_out,
        "subtotal_cents": subtotal,
        "discount_cents": discount,
        "transport_cost_cents": transport_cents,
        "installation_cost_cents": installation_cents,
        "extra_costs_cents": extra_cents,
        "vat_amount_cents": vat_amount_cents,
        "vat_rate": quote.vat_rate,
        "total_cents": total,
        "lang": selected_lang or quote.lang,
        "t": t,
        "show_branding": plan.show_branding,
        "branding_text": t("branding_footer"),
        "generated_at": datetime.now(),
        "generated_by": getattr(user, "email", ""),
        "pdf_price_mode": normalized_price_mode,
        "show_item_prices": normalized_price_mode == "full",
        "show_price_breakdown": normalized_price_mode == "full",
        "show_total_price": normalized_price_mode != "none",
    }
    try:
        pdf_bytes = render_quote_pdf(context, variant)
    except ValueError:
        raise HTTPException(status_code=400, detail="Unsupported template variant")
    return Response(pdf_bytes, media_type="application/pdf", headers={"Content-Disposition": f'inline; filename="{quote.number}.pdf"'})
