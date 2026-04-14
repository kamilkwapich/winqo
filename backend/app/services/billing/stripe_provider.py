from __future__ import annotations
import os
from datetime import datetime, timezone
from typing import Any
import stripe
from sqlmodel import Session
from app.core.config import settings
from app.db.models import GlobalBillingSettings
from app.services.billing.base import BillingProvider
from app.services.billing.plans import get_plan, convert_cents, get_fx_rates

class StripeProvider(BillingProvider):
    name = "stripe"

    def enabled(self) -> bool:
        return bool(settings.stripe_secret_key)

    def create_checkout(self, tenant_id: str, email: str, plan_code: str, **kwargs) -> str:
        if not self.enabled():
            return "https://example.com/stripe-not-configured"

        stripe.api_key = settings.stripe_secret_key
        success_url = kwargs.get("success_url") or f"{settings.web_base_url}/en/app/account"
        cancel_url = kwargs.get("cancel_url") or f"{settings.web_base_url}/en/app/account"
        currency = (kwargs.get("currency") or "EUR").upper()
        db_session: Session | None = kwargs.get("db_session")

        rates = get_fx_rates(db_session)
        plan = get_plan(plan_code)
        charge_plan = plan
        
        # Determine Base and Discount values 
        base_net_cents = kwargs.get("base_amount_cents")
        if base_net_cents is None:
             base_net_cents = convert_cents(plan.price_amount, currency, rates=rates)
        else:
             base_net_cents = int(base_net_cents)

        custom_discount_net = int(kwargs.get("discount_amount_cents") or 0)
        
        # Determine Multiplier from Explicit Amount (VAT adjustment)
        explicit_gross_cents = kwargs.get("amount_cents")
        multiplier = 1.0
        if explicit_gross_cents is not None:
             explicit_gross_cents = int(explicit_gross_cents)
             net_payable = max(base_net_cents - custom_discount_net, 0)
             if net_payable > 0:
                 multiplier = explicit_gross_cents / net_payable
        
        # PRO_M_TRIAL logic
        promo_discount_net = 0
        if plan_code == "PRO_M_TRIAL":
            charge_plan = get_plan("PRO_M")
            charge_net = convert_cents(charge_plan.price_amount, currency, rates=rates)
            promo_discount_net = charge_net - base_net_cents
        elif plan_code == "PRO_Y_PROMO":
            charge_plan = get_plan("PRO_Y")
            charge_net = convert_cents(charge_plan.price_amount, currency, rates=rates)
            promo_discount_net = charge_net - base_net_cents
        
        # Calculate Gross Amounts
        charge_net_regular = convert_cents(charge_plan.price_amount, currency, rates=rates)
        gross_unit_amount = int(round(charge_net_regular * multiplier))
        
        coupon_id = None
        
        # Promo Coupon
        if promo_discount_net > 0:
            gross_promo_discount = int(round(promo_discount_net * multiplier))
            coupon_id = self._ensure_discount_coupon(
                db_session,
                f"{plan_code}:{currency}:promo:v2:{gross_promo_discount}",
                currency,
                gross_promo_discount,
                f"Winqo Pro promo ({plan_code})",
            )
        
        # Custom Coupon
        if custom_discount_net > 0:
             gross_custom_discount = int(round(custom_discount_net * multiplier))
             # Adjust validation against unit amount or similar?
             # Just create coupon
             custom_coupon_id = self._ensure_discount_coupon(
                db_session,
                f"{plan_code}:{currency}:custom:{kwargs.get('discount_code') or 'GEN'}:{gross_custom_discount}",
                currency,
                gross_custom_discount,
                f"Custom discount {kwargs.get('discount_code') or plan_code}",
             )
             if custom_coupon_id:
                  # If we have both promo and custom, Stripe only supports one coupon per subscription easily usually,
                  # but "discounts" array supports multiple.
                  # But our code currently uses `coupon` param which is single.
                  # If we have promo coupon, we might need to stack them.
                  # For now, let's assume we use the one with higher value OR stack them if we refactor.
                  # The existing code did logic to combine them or switch.
                  # Existing code: `effective_discount = min(custom + promo, base)`.
                  # It created a SINGLE combined coupon.
                  
                  # Let's replicate single stuck coupon logic with Gross values.
                  total_gross_discount = 0
                  if promo_discount_net > 0:
                       total_gross_discount += int(round(promo_discount_net * multiplier))
                  total_gross_discount += gross_custom_discount
                  
                  total_gross_discount = min(total_gross_discount, gross_unit_amount)
                  
                  coupon_id = self._ensure_discount_coupon(
                    db_session,
                    f"{plan_code}:{currency}:combined:{kwargs.get('discount_code')}:{total_gross_discount}",
                    currency,
                    total_gross_discount,
                    f"Promo + {kwargs.get('discount_code')}",
                  )

        price_id = None
        # Only use env price if NO modifications (multiplier 1.0, standard plan)
        # Verify if standard plan price matches our calculation
        is_standard_price = (multiplier == 1.0) and (plan_code == charge_plan.code) and (charge_net_regular == gross_unit_amount)
        if is_standard_price:
             price_id = self._price_id_from_env(charge_plan.code)
        
        line_items = [
            {
                "price": price_id,
                "quantity": 1,
            }
        ] if price_id else [
            {
                "price_data": {
                    "currency": currency.lower(),
                    "unit_amount": gross_unit_amount,
                    "recurring": {"interval": charge_plan.interval},
                    "product_data": {"name": f"Winqo {charge_plan.tier.capitalize()} ({charge_plan.interval})"},
                },
                "quantity": 1,
            }
        ]

        sep = "&" if "?" in success_url else "?"
        payload = {
            "mode": "subscription",
            "success_url": f"{success_url}{sep}session_id={{CHECKOUT_SESSION_ID}}",
            "cancel_url": cancel_url,
            "customer_email": email,
            "client_reference_id": tenant_id,
            "line_items": line_items,
            "subscription_data": {"metadata": {"tenant_id": tenant_id, "plan_code": plan_code}},
            "metadata": {"tenant_id": tenant_id, "plan_code": plan_code},
        }
        if coupon_id:
            payload["discounts"] = [{"coupon": coupon_id}]
        session = stripe.checkout.Session.create(**payload)
        return session.get("url") or "https://example.com/stripe-checkout-missing-url"

    def create_portal(self, customer_id: str, return_url: str) -> str:
        if not self.enabled():
            return "https://example.com/stripe-portal-not-configured"
        stripe.api_key = settings.stripe_secret_key
        session = stripe.billing_portal.Session.create(customer=customer_id, return_url=return_url)
        return session.get("url") or "https://example.com/stripe-portal-missing-url"

    def handle_webhook(self, payload: bytes, headers: dict[str, str], **kwargs) -> dict[str, Any]:
        if not self.enabled() or not settings.stripe_webhook_secret:
            return {"ok": False, "error": "Stripe not configured"}
        stripe.api_key = settings.stripe_secret_key
        sig = headers.get("stripe-signature")
        event = stripe.Webhook.construct_event(payload=payload, sig_header=sig, secret=settings.stripe_webhook_secret)
        event_type = event.get("type")
        obj = (event.get("data") or {}).get("object") or {}
        subscription = None
        if event_type and event_type.startswith("customer.subscription."):
            subscription = obj
        elif event_type == "checkout.session.completed":
            sub_id = obj.get("subscription")
            if sub_id:
                subscription = stripe.Subscription.retrieve(sub_id)
        elif event_type and event_type.startswith("invoice."):
            sub_id = obj.get("subscription")
            if sub_id:
                subscription = stripe.Subscription.retrieve(sub_id)

        update = self._normalize_subscription(subscription) if subscription else None
        return {
            "ok": True,
            "provider": "stripe",
            "id": event.get("id"),
            "type": event_type,
            "tenant_id": update.get("tenant_id") if update else None,
            "subscription": update,
            "data": {"event_type": event_type},
        }

    def change_plan(
        self,
        subscription_id: str | None,
        plan_code: str,
        currency: str,
        timing: str,
        db_session: Session | None = None,
        tenant_id: str | None = None,
    ) -> dict[str, Any] | None:
        if not subscription_id:
            raise ValueError("Missing subscription")
        if not self.enabled():
            raise ValueError("Stripe not configured")
        stripe.api_key = settings.stripe_secret_key
        currency = (currency or "EUR").upper()
        subscription = stripe.Subscription.retrieve(subscription_id, expand=["items.data.price"])
        items = (subscription.get("items") or {}).get("data") or []
        if not items:
            raise ValueError("Subscription has no items")
        item = items[0]
        item_id = item.get("id")
        qty = item.get("quantity") or 1
        price_id = self._ensure_price_id(db_session, plan_code, currency)
        if not price_id:
            raise ValueError("Missing Stripe price")

        if timing == "now":
            metadata_tenant = tenant_id or (subscription.get("metadata") or {}).get("tenant_id")
            updated = stripe.Subscription.modify(
                subscription_id,
                cancel_at_period_end=False,
                proration_behavior="create_prorations",
                items=[{"id": item_id, "price": price_id, "quantity": qty}],
                metadata={"tenant_id": metadata_tenant, "plan_code": plan_code},
            )
            return self._normalize_subscription(updated)

        self._schedule_downgrade(subscription, price_id, qty, plan_code, tenant_id)
        return None

    def _price_id_from_env(self, plan_code: str) -> str | None:
        key = f"STRIPE_PRICE_ID_{plan_code}"
        return os.getenv(key)

    def _ensure_price_id(self, session: Session | None, plan_code: str, currency: str) -> str | None:
        env_price = self._price_id_from_env(plan_code)
        if env_price:
            return env_price
        if session is None:
            return None
        # ensure stripe API key is set for the stripe library
        try:
            stripe.api_key = settings.stripe_secret_key
        except Exception:
            pass
        settings_row = session.get(GlobalBillingSettings, 1)
        if not settings_row:
            settings_row = GlobalBillingSettings(id=1)
            session.add(settings_row)
            session.commit()
            session.refresh(settings_row)
        price_ids = dict(settings_row.stripe_price_ids or {})
        key = f"{plan_code}:{currency}"
        if key in price_ids:
            return price_ids[key]
        product_id = settings_row.stripe_product_id or self._create_product()
        if settings_row.stripe_product_id != product_id:
            settings_row.stripe_product_id = product_id
            session.add(settings_row)
            session.commit()
        rates = get_fx_rates(session)
        plan = get_plan(plan_code)
        price = stripe.Price.create(
            product=product_id,
            unit_amount=convert_cents(plan.price_amount, currency, rates=rates),
            currency=currency.lower(),
            recurring={"interval": plan.interval},
        )
        price_ids[key] = price.id
        settings_row.stripe_price_ids = price_ids
        session.add(settings_row)
        session.commit()
        return price.id

    def _create_product(self) -> str:
        product = stripe.Product.create(name="Winqo Subscription")
        return product.id

    def _schedule_downgrade(self, subscription: dict[str, Any], new_price_id: str, quantity: int, plan_code: str, tenant_id: str | None) -> None:
        schedule_id = subscription.get("schedule")
        if schedule_id:
            schedule = stripe.SubscriptionSchedule.retrieve(schedule_id)
        else:
            schedule = stripe.SubscriptionSchedule.create(from_subscription=subscription.get("id"))
        items = (subscription.get("items") or {}).get("data") or []
        current_price_id = items[0].get("price", {}).get("id") if items else None
        if not current_price_id:
            raise ValueError("Missing current price")
        start_date = subscription.get("current_period_start")
        end_date = subscription.get("current_period_end")
        phases = [
            {
                "items": [{"price": current_price_id, "quantity": quantity}],
                "start_date": start_date,
                "end_date": end_date,
            },
            {
                "items": [{"price": new_price_id, "quantity": quantity}],
                "start_date": end_date,
                "metadata": {"plan_code": plan_code, "tenant_id": tenant_id or (subscription.get("metadata") or {}).get("tenant_id")},
            },
        ]
        stripe.SubscriptionSchedule.modify(
            schedule.get("id"),
            phases=phases,
            end_behavior="release",
        )

    def _ensure_discount_coupon(
        self,
        session: Session | None,
        key: str,
        currency: str,
        amount_off_cents: int,
        name: str,
    ) -> str | None:
        if amount_off_cents <= 0:
            return None
        if session is None:
            return None
        settings_row = session.get(GlobalBillingSettings, 1)
        if not settings_row:
            settings_row = GlobalBillingSettings(id=1)
            session.add(settings_row)
            session.commit()
            session.refresh(settings_row)
        coupons = dict(settings_row.stripe_coupon_ids or {})
        if key in coupons:
            return coupons[key]
        coupon = stripe.Coupon.create(
            amount_off=amount_off_cents,
            currency=currency.lower(),
            duration="once",
            name=name,
        )
        coupons[key] = coupon.id
        settings_row.stripe_coupon_ids = coupons
        session.add(settings_row)
        session.commit()
        return coupon.id

    def _normalize_subscription(self, subscription: dict[str, Any] | None) -> dict[str, Any] | None:
        if not subscription:
            return None
        metadata = subscription.get("metadata") or {}
        tenant_id = metadata.get("tenant_id")
        plan_code = metadata.get("plan_code")
        item = (subscription.get("items") or {}).get("data") or []
        price = item[0].get("price") if item else {}
        price_id = price.get("id") if price else None
        if not plan_code and price_id:
            plan_code = self._plan_code_from_price(price_id)
        amount = price.get("unit_amount") if price else None
        currency = (price.get("currency") or "EUR").upper() if price else "EUR"
        status = self._map_status(subscription.get("status"))
        return {
            "tenant_id": tenant_id,
            "plan_code": plan_code,
            "provider_subscription_id": subscription.get("id"),
            "provider_customer_id": subscription.get("customer"),
            "status": status,
            "price_amount": int(amount) if amount is not None else None,
            "currency": currency,
            "current_period_start": self._to_datetime(subscription.get("current_period_start")),
            "current_period_end": self._to_datetime(subscription.get("current_period_end")),
            "cancel_at_period_end": bool(subscription.get("cancel_at_period_end")),
        }

    def _plan_code_from_price(self, price_id: str) -> str | None:
        for code in [
            "STARTER_M",
            "STARTER_Y",
            "PRO_M",
            "PRO_Y",
            "PRO_M_TRIAL",
            "PRO_Y_PROMO",
            "MAX_M",
            "MAX_Y",
        ]:
            if os.getenv(f"STRIPE_PRICE_ID_{code}") == price_id:
                return code
        return None

    def _map_status(self, status: str | None) -> str:
        if not status:
            return "inactive"
        return {
            "active": "active",
            "trialing": "trialing",
            "past_due": "past_due",
            "canceled": "canceled",
            "unpaid": "past_due",
        }.get(status, status)

    def _to_datetime(self, ts: int | None) -> datetime | None:
        if not ts:
            return None
        return datetime.fromtimestamp(ts, timezone.utc)
