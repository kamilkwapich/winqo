from fastapi import APIRouter, Depends, HTTPException, Response
from sqlmodel import Session, select
from uuid import UUID
from app.db.session import get_session
from app.db.models import Client, Quote, QuoteItem, Tenant, Subscription
from app.schemas.quotes import ClientIn, ClientOut, ClientUpdate, QuoteIn, QuoteOut, QuoteItemIn, QuoteItemOut, QuoteItemUpdate, QuoteUpdate
from app.api.tenant_deps import require_tenant, current_user
from datetime import datetime, timezone
from sqlalchemy import func
from app.services.billing.plans import get_plan, normalize_lang, get_fx_rates

router = APIRouter(prefix="/quotes", tags=["quotes"])

def month_bounds(now: datetime | None = None) -> tuple[datetime, datetime]:
    current = now or datetime.now(timezone.utc)
    start = current.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    if start.month == 12:
        end = start.replace(year=start.year + 1, month=1)
    else:
        end = start.replace(month=start.month + 1)
    return start, end

def latest_subscription(session: Session, tenant_id: UUID) -> Subscription | None:
    return session.exec(
        select(Subscription)
        .where(Subscription.tenant_id == tenant_id)
        .order_by(Subscription.created_at.desc())
    ).first()

def next_quote_number(session: Session, tenant_id: UUID) -> str:
    # Simple incremental number per tenant (MVP). Replace with stronger numbering policy if needed.
    q = session.exec(select(Quote).where(Quote.tenant_id == tenant_id).order_by(Quote.created_at.desc())).first()
    if not q:
        return "Q-000001"
    try:
        n = int(q.number.split("-")[-1]) + 1
    except Exception:
        n = 1
    return f"Q-{n:06d}"

@router.post("/clients", response_model=ClientOut)
def create_client(data: ClientIn, tenant_id: UUID = Depends(require_tenant), session: Session = Depends(get_session), user=Depends(current_user)):
    c = Client(tenant_id=tenant_id, **data.model_dump())
    session.add(c); session.commit(); session.refresh(c)
    return ClientOut(id=str(c.id), created_at=c.created_at.isoformat(), **data.model_dump())

@router.get("/clients", response_model=list[ClientOut])
def list_clients(tenant_id: UUID = Depends(require_tenant), session: Session = Depends(get_session), user=Depends(current_user)):
    rows = session.exec(select(Client).where(Client.tenant_id == tenant_id).order_by(Client.created_at.desc())).all()
    return [ClientOut(id=str(r.id), name=r.name, email=r.email, phone=r.phone, address=r.address, tax_id=r.tax_id, created_at=r.created_at.isoformat()) for r in rows]


@router.put("/clients/{client_id}", response_model=ClientOut)
def update_client(client_id: str, data: ClientUpdate, tenant_id: UUID = Depends(require_tenant), session: Session = Depends(get_session), user=Depends(current_user)):
    cid = UUID(client_id)
    client = session.get(Client, cid)
    if not client or client.tenant_id != tenant_id:
        raise HTTPException(status_code=404, detail="Client not found")
    update_fields = data.model_dump(exclude_none=True)
    for key, val in update_fields.items():
        setattr(client, key, val)
    session.add(client); session.commit(); session.refresh(client)
    return ClientOut(id=str(client.id), name=client.name, email=client.email, phone=client.phone, address=client.address, tax_id=client.tax_id, created_at=client.created_at.isoformat())


@router.delete("/clients/{client_id}", status_code=204)
def delete_client(client_id: str, tenant_id: UUID = Depends(require_tenant), session: Session = Depends(get_session), user=Depends(current_user)):
    cid = UUID(client_id)
    client = session.get(Client, cid)
    if not client or client.tenant_id != tenant_id:
        raise HTTPException(status_code=404, detail="Client not found")
    # Detach client from quotes to avoid FK issues
    quotes = session.exec(select(Quote).where(Quote.tenant_id == tenant_id, Quote.client_id == cid)).all()
    for q in quotes:
        q.client_id = None
        session.add(q)
    session.delete(client); session.commit()
    return Response(status_code=204)

@router.post("", response_model=QuoteOut)
def create_quote(data: QuoteIn, tenant_id: UUID = Depends(require_tenant), session: Session = Depends(get_session), user=Depends(current_user)):
    number = next_quote_number(session, tenant_id)
    name = (data.name or "").strip()
    if not name:
        raise HTTPException(status_code=400, detail="Quote name required")
    tenant = session.get(Tenant, tenant_id)
    sub = latest_subscription(session, tenant_id)
    plan = get_plan(sub.plan_code if sub else None)
    requested_lang = normalize_lang(data.lang)
    tenant_lang = normalize_lang(tenant.default_lang if tenant else None)
    if plan.language_mode == "single" and requested_lang and tenant_lang and requested_lang != tenant_lang:
        raise HTTPException(status_code=403, detail="Language not allowed for plan")
    if plan.monthly_quote_limit is not None:
        start, end = month_bounds()
        count = session.exec(
            select(func.count())
            .select_from(Quote)
            .where(Quote.tenant_id == tenant_id, Quote.created_at >= start, Quote.created_at < end)
        ).one()
        if int(count) >= plan.monthly_quote_limit:
            raise HTTPException(status_code=403, detail="Monthly quote limit reached")
    currency = data.currency or (tenant.default_currency if tenant else "EUR")
    transport_cents = int(round((data.transport_cost or 0.0) * 100)) if data.transport_cost is not None else 0
    installation_cents = int(round((data.installation_cost or 0.0) * 100)) if data.installation_cost is not None else 0
    extra_cents = int(round((data.extra_costs or 0.0) * 100)) if data.extra_costs is not None else 0
    q = Quote(
        tenant_id=tenant_id,
        number=number,
        name=name,
        client_id=UUID(data.client_id) if data.client_id else None,
        lang=requested_lang or tenant_lang or data.lang,
        currency=currency,
        discount_pct=data.discount_pct,
        vat_rate=data.vat_rate or 0.0,
        transport_cost_cents=transport_cents,
        installation_cost_cents=installation_cents,
        extra_costs_cents=extra_cents,
        notes=data.notes
    )
    session.add(q); session.commit(); session.refresh(q)
    return QuoteOut(
        id=str(q.id),
        number=q.number,
        status=q.status,
        name=q.name,
        client_id=str(q.client_id) if q.client_id else None,
        lang=q.lang,
        currency=q.currency,
        discount_pct=q.discount_pct,
        vat_rate=q.vat_rate,
        transport_cost=round(q.transport_cost_cents / 100.0, 2),
        installation_cost=round(q.installation_cost_cents / 100.0, 2),
        extra_costs=round(q.extra_costs_cents / 100.0, 2),
        notes=q.notes,
        created_at=q.created_at.isoformat()
    )

@router.get("", response_model=list[QuoteOut])
def list_quotes(tenant_id: UUID = Depends(require_tenant), session: Session = Depends(get_session), user=Depends(current_user)):
    rows = session.exec(select(Quote).where(Quote.tenant_id == tenant_id).order_by(Quote.created_at.desc())).all()
    out = []
    for r in rows:
        out.append(
            QuoteOut(
                id=str(r.id),
                number=r.number,
                status=r.status,
                name=r.name,
                client_id=str(r.client_id) if r.client_id else None,
                lang=r.lang,
                currency=r.currency,
                discount_pct=r.discount_pct,
                vat_rate=r.vat_rate,
                transport_cost=round(r.transport_cost_cents / 100.0, 2),
                installation_cost=round(r.installation_cost_cents / 100.0, 2),
                extra_costs=round(r.extra_costs_cents / 100.0, 2),
                notes=r.notes,
                created_at=r.created_at.isoformat()
            )
        )
    return out

@router.get("/stats")
def quote_stats(tenant_id: UUID = Depends(require_tenant), session: Session = Depends(get_session), user=Depends(current_user)):
    total_quotes = session.exec(
        select(func.count())
        .select_from(Quote)
        .where(Quote.tenant_id == tenant_id)
    ).one()
    start, end = month_bounds()
    monthly_count = session.exec(
        select(func.count())
        .select_from(Quote)
        .where(Quote.tenant_id == tenant_id, Quote.created_at >= start, Quote.created_at < end)
    ).one()
    last_quote_at = session.exec(
        select(func.max(Quote.created_at))
        .where(Quote.tenant_id == tenant_id)
    ).one()
    rows = session.exec(
        select(Quote.currency, func.sum(QuoteItem.qty * QuoteItem.unit_price_cents))
        .join(QuoteItem, QuoteItem.quote_id == Quote.id)
        .where(Quote.tenant_id == tenant_id)
        .group_by(Quote.currency)
    ).all()
    tenant = session.get(Tenant, tenant_id)
    target_currency = tenant.default_currency if tenant and tenant.default_currency else "EUR"
    rates = get_fx_rates(session)
    total_amount_cents = 0
    for currency, amount in rows:
        if amount is None:
            continue
        if currency == target_currency:
            total_amount_cents += int(amount)
            continue
        rate_src = rates.get(currency)
        rate_dst = rates.get(target_currency)
        if not rate_src or not rate_dst:
            continue
        total_amount_cents += int(round(float(amount) * (rate_dst / rate_src)))
    average_amount_cents = int(round(total_amount_cents / total_quotes)) if total_quotes else 0
    sub = latest_subscription(session, tenant_id)
    plan = get_plan(sub.plan_code if sub else None)
    return {
        "total_quotes": int(total_quotes),
        "monthly_quote_count": int(monthly_count),
        "monthly_quote_limit": plan.monthly_quote_limit,
        "total_amount_cents": total_amount_cents,
        "average_amount_cents": average_amount_cents,
        "currency": target_currency,
        "last_quote_at": last_quote_at.isoformat() if last_quote_at else None,
    }

@router.get("/{quote_id}", response_model=QuoteOut)
def get_quote(quote_id: str, tenant_id: UUID = Depends(require_tenant), session: Session = Depends(get_session), user=Depends(current_user)):
    qid = UUID(quote_id)
    q = session.get(Quote, qid)
    if not q or q.tenant_id != tenant_id:
        raise HTTPException(status_code=404, detail="Quote not found")
    return QuoteOut(
        id=str(q.id),
        number=q.number,
        status=q.status,
        name=q.name,
        client_id=str(q.client_id) if q.client_id else None,
        lang=q.lang,
        currency=q.currency,
        discount_pct=q.discount_pct,
        vat_rate=q.vat_rate,
        transport_cost=round(q.transport_cost_cents / 100.0, 2),
        installation_cost=round(q.installation_cost_cents / 100.0, 2),
        extra_costs=round(q.extra_costs_cents / 100.0, 2),
        notes=q.notes,
        created_at=q.created_at.isoformat()
    )


@router.delete("/{quote_id}", status_code=204)
def delete_quote(quote_id: str, tenant_id: UUID = Depends(require_tenant), session: Session = Depends(get_session), user=Depends(current_user)):
    qid = UUID(quote_id)
    q = session.get(Quote, qid)
    if not q or q.tenant_id != tenant_id:
        raise HTTPException(status_code=404, detail="Quote not found")
    items = session.exec(select(QuoteItem).where(QuoteItem.tenant_id == tenant_id, QuoteItem.quote_id == qid)).all()
    for it in items:
        session.delete(it)
    session.delete(q)
    session.commit()
    return Response(status_code=204)

@router.put("/{quote_id}", response_model=QuoteOut)
def update_quote(quote_id: str, data: QuoteUpdate, tenant_id: UUID = Depends(require_tenant), session: Session = Depends(get_session), user=Depends(current_user)):
    qid = UUID(quote_id)
    q = session.get(Quote, qid)
    if not q or q.tenant_id != tenant_id:
        raise HTTPException(status_code=404, detail="Quote not found")
    if data.name is not None:
        name = data.name.strip()
        if not name:
            raise HTTPException(status_code=400, detail="Quote name required")
        q.name = name
    if data.client_id is not None:
        q.client_id = UUID(data.client_id) if data.client_id else None
    if data.lang is not None:
        sub = latest_subscription(session, tenant_id)
        plan = get_plan(sub.plan_code if sub else None)
        requested_lang = normalize_lang(data.lang)
        tenant = session.get(Tenant, tenant_id)
        tenant_lang = normalize_lang(tenant.default_lang if tenant else None)
        if plan.language_mode == "single" and requested_lang and tenant_lang and requested_lang != tenant_lang:
            raise HTTPException(status_code=403, detail="Language not allowed for plan")
        q.lang = requested_lang or data.lang
    if data.currency is not None:
        q.currency = data.currency
    if data.discount_pct is not None:
        q.discount_pct = data.discount_pct
    if data.vat_rate is not None:
        q.vat_rate = data.vat_rate
    if data.transport_cost is not None:
        q.transport_cost_cents = int(round(data.transport_cost * 100))
    if data.installation_cost is not None:
        q.installation_cost_cents = int(round(data.installation_cost * 100))
    if data.extra_costs is not None:
        q.extra_costs_cents = int(round(data.extra_costs * 100))
    if data.notes is not None:
        q.notes = data.notes
    session.add(q); session.commit(); session.refresh(q)
    return QuoteOut(
        id=str(q.id),
        number=q.number,
        status=q.status,
        name=q.name,
        client_id=str(q.client_id) if q.client_id else None,
        lang=q.lang,
        currency=q.currency,
        discount_pct=q.discount_pct,
        vat_rate=q.vat_rate,
        transport_cost=round(q.transport_cost_cents / 100.0, 2),
        installation_cost=round(q.installation_cost_cents / 100.0, 2),
        extra_costs=round(q.extra_costs_cents / 100.0, 2),
        notes=q.notes,
        created_at=q.created_at.isoformat()
    )

@router.get("/{quote_id}/items", response_model=list[QuoteItemOut])
def list_items(quote_id: str, tenant_id: UUID = Depends(require_tenant), session: Session = Depends(get_session), user=Depends(current_user)):
    qid = UUID(quote_id)
    items = session.exec(select(QuoteItem).where(QuoteItem.tenant_id == tenant_id, QuoteItem.quote_id == qid).order_by(QuoteItem.created_at.asc())).all()
    out: list[QuoteItemOut] = []
    for idx, i in enumerate(items, start=1):
        out.append(
            QuoteItemOut(
                id=str(i.id),
                name=i.name,
                qty=i.qty,
                unit_price=round(i.unit_price_cents / 100.0, 2),
                unit_price_cents=i.unit_price_cents,
                position=idx,
                window_spec=i.window_spec,
                svg=i.svg,
                notes=i.notes
            )
        )
    return out

@router.post("/{quote_id}/items", response_model=QuoteItemOut)
def add_item(quote_id: str, data: QuoteItemIn, tenant_id: UUID = Depends(require_tenant), session: Session = Depends(get_session), user=Depends(current_user)):
    qid = UUID(quote_id)
    q = session.get(Quote, qid)
    if not q or q.tenant_id != tenant_id:
        raise HTTPException(status_code=404, detail="Quote not found")
    unit_price_cents = int(round((data.unit_price or 0.0) * 100))
    item = QuoteItem(
        tenant_id=tenant_id,
        quote_id=qid,
        name=data.name,
        qty=data.qty,
        unit_price_cents=unit_price_cents,
        window_spec=data.window_spec,
        svg=data.svg,
        notes=data.notes
    )
    session.add(item); session.commit(); session.refresh(item)
    items = session.exec(select(QuoteItem).where(QuoteItem.tenant_id == tenant_id, QuoteItem.quote_id == qid).order_by(QuoteItem.created_at.asc())).all()
    position = 1
    for idx, existing in enumerate(items, start=1):
        if existing.id == item.id:
            position = idx
            break
    return QuoteItemOut(
        id=str(item.id),
        name=item.name,
        qty=item.qty,
        unit_price=round(item.unit_price_cents / 100.0, 2),
        unit_price_cents=item.unit_price_cents,
        position=position,
        window_spec=item.window_spec,
        svg=item.svg,
        notes=item.notes
    )

@router.put("/items/{item_id}", response_model=QuoteItemOut)
def update_item(item_id: str, data: QuoteItemUpdate, tenant_id: UUID = Depends(require_tenant), session: Session = Depends(get_session), user=Depends(current_user)):
    iid = UUID(item_id)
    item = session.get(QuoteItem, iid)
    if not item or item.tenant_id != tenant_id:
        raise HTTPException(status_code=404, detail="Item not found")
    if data.name is not None:
        item.name = data.name
    if data.qty is not None:
        item.qty = data.qty
    if data.unit_price is not None:
        item.unit_price_cents = int(round(data.unit_price * 100))
    if data.window_spec is not None:
        item.window_spec = data.window_spec
    if data.svg is not None:
        item.svg = data.svg
    if data.notes is not None:
        item.notes = data.notes
    session.add(item); session.commit(); session.refresh(item)

    items = session.exec(
        select(QuoteItem)
        .where(QuoteItem.tenant_id == tenant_id, QuoteItem.quote_id == item.quote_id)
        .order_by(QuoteItem.created_at.asc())
    ).all()
    position = 1
    for idx, existing in enumerate(items, start=1):
        if existing.id == item.id:
            position = idx
            break

    return QuoteItemOut(
        id=str(item.id),
        name=item.name,
        qty=item.qty,
        unit_price=round(item.unit_price_cents / 100.0, 2),
        unit_price_cents=item.unit_price_cents,
        position=position,
        window_spec=item.window_spec,
        svg=item.svg,
        notes=item.notes
    )

@router.delete("/items/{item_id}")
def delete_item(item_id: str, tenant_id: UUID = Depends(require_tenant), session: Session = Depends(get_session), user=Depends(current_user)):
    iid = UUID(item_id)
    item = session.get(QuoteItem, iid)
    if not item or item.tenant_id != tenant_id:
        raise HTTPException(status_code=404, detail="Item not found")
    session.delete(item); session.commit()
    return {"ok": True}
