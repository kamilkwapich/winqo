from __future__ import annotations
from datetime import datetime, timezone
import json
from typing import Any
import httpx
from sqlmodel import Session
from app.core.config import settings
from app.db.models import GlobalBillingSettings
from app.services.billing.base import BillingProvider
from app.services.billing.plans import get_plan, convert_cents, get_fx_rates

class PayPalProvider(BillingProvider):
    name = "paypal"

    def enabled(self) -> bool:
        return bool(settings.paypal_client_id and settings.paypal_client_secret)

    def create_checkout(self, tenant_id: str, email: str, plan_code: str, **kwargs) -> str:
        if not self.enabled():
            return "https://example.com/paypal-not-configured"
        success_url = kwargs.get("success_url") or f"{settings.web_base_url}/en/app/account"
        cancel_url = kwargs.get("cancel_url") or f"{settings.web_base_url}/en/app/account"
        currency = (kwargs.get("currency") or "EUR").upper()
        mode = kwargs.get("mode") or "live"
        session: Session | None = kwargs.get("db_session")
        rates = get_fx_rates(session)
        plan = get_plan(plan_code)
        
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
        
        # Determine Charge Plan (Regular)
        charge_plan = plan
        if plan_code == "PRO_M_TRIAL":
            charge_plan = get_plan("PRO_M")
        elif plan_code == "PRO_Y_PROMO":
            charge_plan = get_plan("PRO_Y")
            
        charge_net_regular = convert_cents(charge_plan.price_amount, currency, rates=rates)
        gross_regular = int(round(charge_net_regular * multiplier))
        
        # First Cycle (Trial/Promo) Logic
        # If Plan is Trial, First Cycle is the explicit gross amount derived above?
        # Actually logic for FIRST cycle is:
        # Net First Cycle = base_net_cents - custom_discount_net
        # Gross First Cycle = Net First Cycle * Multiplier = explicit_gross_cents
        
        # If plan is NOT trial, First Cycle IS Regular Cycle usually, unless there is a custom discount.
        # PayPal plans: We define cycles.
        # If we have a custom discount for first period (or coupon), we can treat it as a TRIAL cycle in PayPal.
        
        gross_first_cycle = None
        
        has_intro_period = (plan.code != charge_plan.code) or (custom_discount_net > 0)
        
        if has_intro_period:
             # Calculate Gross First Cycle
             # Base Net for this period is plan.price_amount (Trial) or charge_plan.price_amount (Regular)
             # If plan!=charge_plan, then base_net_cents calculated above IS the trial net.
             # If plan==charge_plan, base_net_cents is regular net.
             
             net_first = base_net_cents - custom_discount_net
             if net_first < 0: net_first = 0
             gross_first_cycle = int(round(net_first * multiplier))
             
             if gross_first_cycle == gross_regular and plan.code == charge_plan.code:
                  # No actual intro period difference
                  has_intro_period = False
                  gross_first_cycle = None

        base_url = self._base_url(mode)
        token = self._access_token(base_url)
        plan_id = self._ensure_plan_id(
            session, 
            base_url, 
            token, 
            plan_code, 
            currency, 
            rates, 
            first_cycle_price_cents=gross_first_cycle, 
            regular_price_cents=gross_regular
        )
        if not plan_id:
            return "https://example.com/paypal-plan-missing"

        payload = {
            "plan_id": plan_id,
            "custom_id": f"{tenant_id}|{plan_code}|{currency}",
            "subscriber": {"email_address": email},
            "application_context": {
                "brand_name": "Winqo",
                "shipping_preference": "NO_SHIPPING",
                "user_action": "SUBSCRIBE_NOW",
                "return_url": success_url,
                "cancel_url": cancel_url,
            },
        }
        with httpx.Client(timeout=20) as client:
            res = client.post(
                f"{base_url}/v1/billing/subscriptions",
                headers=self._auth_headers(token),
                json=payload,
            )
            res.raise_for_status()
            data = res.json()
        approve_url = self._extract_link(data.get("links") or [], "approve")
        return approve_url or "https://example.com/paypal-approve-missing"

    def create_portal(self, customer_id: str, return_url: str) -> str:
        # MVP placeholder - implement provider portal when integrating.
        return "https://example.com/provider-portal-not-configured"

    def handle_webhook(self, payload: bytes, headers: dict[str, str], **kwargs) -> dict[str, Any]:
        if not self.enabled():
            return {"ok": False, "error": "PayPal not configured"}
        mode = kwargs.get("mode") or "live"
        base_url = self._base_url(mode)
        event = json.loads(payload)
        ok = self._verify_webhook(base_url, event, headers)
        if not ok:
            return {"ok": False, "error": "PayPal webhook verification failed"}

        event_type = event.get("event_type")
        resource = event.get("resource") or {}
        update = self._normalize_subscription(resource, event_type)
        return {
            "ok": True,
            "provider": "paypal",
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
        mode: str,
        db_session: Session | None = None,
    ) -> dict[str, Any] | None:
        if not subscription_id:
            raise ValueError("Missing subscription")
        if not self.enabled():
            raise ValueError("PayPal not configured")
        base_url = self._base_url(mode)
        token = self._access_token(base_url)
        rates = get_fx_rates(db_session)
        plan_id = self._ensure_plan_id(db_session, base_url, token, plan_code, currency, rates, None)
        if not plan_id:
            raise ValueError("Missing PayPal plan")

        effective_time = None
        if timing == "period_end":
            subscription = self._get_subscription(base_url, token, subscription_id)
            billing = subscription.get("billing_info") or {}
            effective_time = billing.get("next_billing_time")

        payload = {"plan_id": plan_id}
        if effective_time:
            payload["effective_time"] = effective_time

        with httpx.Client(timeout=20) as client:
            res = client.post(
                f"{base_url}/v1/billing/subscriptions/{subscription_id}/revise",
                headers=self._auth_headers(token),
                json=payload,
            )
            res.raise_for_status()

        updated = self._get_subscription(base_url, token, subscription_id)
        update = self._normalize_subscription(updated, "subscription.revised")
        if update:
            update["plan_code"] = plan_code
        return update

    def _base_url(self, mode: str) -> str:
        return "https://api-m.sandbox.paypal.com" if mode == "sandbox" else "https://api-m.paypal.com"

    def _access_token(self, base_url: str) -> str:
        with httpx.Client(timeout=20) as client:
            res = client.post(
                f"{base_url}/v1/oauth2/token",
                data={"grant_type": "client_credentials"},
                auth=(settings.paypal_client_id, settings.paypal_client_secret),
            )
            res.raise_for_status()
            data = res.json()
            return data.get("access_token") or ""

    def _auth_headers(self, token: str) -> dict[str, str]:
        return {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}

    def _verify_webhook(self, base_url: str, event: dict[str, Any], headers: dict[str, str]) -> bool:
        webhook_id = settings.paypal_webhook_id
        if not webhook_id:
            return True
        token = self._access_token(base_url)
        payload = {
            "auth_algo": headers.get("paypal-auth-algo"),
            "cert_url": headers.get("paypal-cert-url"),
            "transmission_id": headers.get("paypal-transmission-id"),
            "transmission_sig": headers.get("paypal-transmission-sig"),
            "transmission_time": headers.get("paypal-transmission-time"),
            "webhook_id": webhook_id,
            "webhook_event": event,
        }
        with httpx.Client(timeout=20) as client:
            res = client.post(
                f"{base_url}/v1/notifications/verify-webhook-signature",
                headers=self._auth_headers(token),
                json=payload,
            )
            if res.status_code >= 400:
                return False
            data = res.json()
        return data.get("verification_status") == "SUCCESS"

    def _get_subscription(self, base_url: str, token: str, subscription_id: str) -> dict[str, Any]:
        with httpx.Client(timeout=20) as client:
            res = client.get(
                f"{base_url}/v1/billing/subscriptions/{subscription_id}",
                headers=self._auth_headers(token),
            )
            res.raise_for_status()
            return res.json()

    def _ensure_plan_id(
        self,
        session: Session | None,
        base_url: str,
        token: str,
        plan_code: str,
        currency: str,
        rates: dict[str, float],
        first_cycle_price_cents: int | None = None,
        regular_price_cents: int | None = None,
    ) -> str | None:
        if session is None:
            return None
        settings_row = session.get(GlobalBillingSettings, 1)
        if not settings_row:
            settings_row = GlobalBillingSettings(id=1)
            session.add(settings_row)
            session.commit()
            session.refresh(settings_row)
        plan_ids = dict(settings_row.paypal_plan_ids or {})
        key = f"{plan_code}:{currency}:{first_cycle_price_cents or ''}:{regular_price_cents or ''}"
        if key in plan_ids:
            return plan_ids[key]

        product_id = settings_row.paypal_product_id or self._create_product(base_url, token)
        if not product_id:
            return None
        if settings_row.paypal_product_id != product_id:
            settings_row.paypal_product_id = product_id
            session.add(settings_row)
            session.commit()

        plan_payload = self._build_plan_payload(product_id, plan_code, currency, rates, first_cycle_price_cents, regular_price_cents)
        with httpx.Client(timeout=20) as client:
            res = client.post(
                f"{base_url}/v1/billing/plans",
                headers=self._auth_headers(token),
                json=plan_payload,
            )
            res.raise_for_status()
            data = res.json()
        plan_id = data.get("id")
        if plan_id:
            plan_ids[key] = plan_id
            settings_row.paypal_plan_ids = plan_ids
            session.add(settings_row)
            session.commit()
        return plan_id

    def _create_product(self, base_url: str, token: str) -> str | None:
        payload = {
            "name": "Winqo Subscriptions",
            "type": "SERVICE",
            "category": "SOFTWARE",
        }
        with httpx.Client(timeout=20) as client:
            res = client.post(
                f"{base_url}/v1/catalogs/products",
                headers=self._auth_headers(token),
                json=payload,
            )
            res.raise_for_status()
            data = res.json()
        return data.get("id")

    def _build_plan_payload(self, product_id: str, plan_code: str, currency: str, rates: dict[str, float], first_cycle_price_cents: int | None = None, regular_price_cents: int | None = None) -> dict[str, Any]:
        currency = currency.upper()
        plan = get_plan(plan_code)
        name = f"Winqo {plan.tier.capitalize()} {plan.interval}"
        interval_unit = "MONTH" if plan.interval == "month" else "YEAR"
        
        # Determine regular price if not explicit
        regular_val = None
        if regular_price_cents is not None:
             regular_val = self._price_value(regular_price_cents, currency, rates) # Actually _price_value expects cents but ignores currency/rates if we trust caller... wait.
             # _price_value implementation: return f"{amount_cents / 100:.2f}"
             # So we can just format it.
             regular_val = f"{regular_price_cents / 100:.2f}"
        else:
             target_plan = plan
             if plan_code == "PRO_M_TRIAL": target_plan = get_plan("PRO_M")
             elif plan_code == "PRO_Y_PROMO": target_plan = get_plan("PRO_Y")
             regular_val = self._price_value(target_plan.price_amount, currency, rates)

        billing_cycles = []
        
        if first_cycle_price_cents is not None:
            first_val = f"{first_cycle_price_cents / 100:.2f}"
            billing_cycles = [
                self._cycle("TRIAL", interval_unit, 1, 1, first_val, currency, 1),
                self._cycle("REGULAR", interval_unit, 1, 0, regular_val, currency, 2),
            ]
        elif plan_code == "PRO_M_TRIAL":
            # Fallback if no explicit override but is trial plan (shouldn't happen with new logic if explicit used)
            billing_cycles = [
                self._cycle("TRIAL", interval_unit, 1, 1, self._price_value(plan.price_amount, currency, rates), currency, 1),
                self._cycle("REGULAR", interval_unit, 1, 0, self._price_value(get_plan("PRO_M").price_amount, currency, rates), currency, 2),
            ]
        elif plan_code == "PRO_Y_PROMO":
            billing_cycles = [
                self._cycle("TRIAL", interval_unit, 1, 1, self._price_value(plan.price_amount, currency, rates), currency, 1),
                self._cycle("REGULAR", interval_unit, 1, 0, self._price_value(get_plan("PRO_Y").price_amount, currency, rates), currency, 2),
            ]
        else:
            billing_cycles = [
                self._cycle("REGULAR", interval_unit, 1, 0, regular_val, currency, 1),
            ]

        return {
            "product_id": product_id,
            "name": name,
            "description": f"Winqo subscription ({plan_code})",
            "status": "ACTIVE",
            "billing_cycles": billing_cycles,
            "payment_preferences": {
                "auto_bill_outstanding": True,
                "setup_fee_failure_action": "CANCEL",
                "payment_failure_threshold": 3,
            },
        }

    def _cycle(
        self,
        tenure: str,
        interval_unit: str,
        interval_count: int,
        total_cycles: int,
        price: str,
        currency: str,
        sequence: int,
    ) -> dict[str, Any]:
        return {
            "frequency": {
                "interval_unit": interval_unit,
                "interval_count": interval_count,
            },
            "tenure_type": tenure,
            "sequence": sequence,
            "total_cycles": total_cycles,
            "pricing_scheme": {
                "fixed_price": {
                    "value": price,
                    "currency_code": currency,
                },
            },
        }

    def _price_value(self, amount_cents_eur: int, currency: str, rates: dict[str, float]) -> str:
        cents = convert_cents(amount_cents_eur, currency, rates=rates)
        return f"{cents / 100:.2f}"

    def _extract_link(self, links: list[dict[str, Any]], rel: str) -> str | None:
        for link in links:
            if link.get("rel") == rel:
                return link.get("href")
        return None

    def _normalize_subscription(self, resource: dict[str, Any], event_type: str | None) -> dict[str, Any] | None:
        if not resource:
            return None
        custom_id = resource.get("custom_id") or ""
        tenant_id, plan_code, custom_currency = self._parse_custom_id(custom_id)
        status = self._map_status(resource.get("status"))
        billing = resource.get("billing_info") or {}
        last_payment = (billing.get("last_payment") or {}).get("amount") or {}
        next_billing = self._parse_time(billing.get("next_billing_time"))
        start_time = self._parse_time(resource.get("start_time"))
        last_payment_time = self._parse_time((billing.get("last_payment") or {}).get("time"))
        currency = (last_payment.get("currency_code") or custom_currency or "EUR").upper()
        price_amount = None
        if last_payment.get("value"):
            try:
                price_amount = int(round(float(last_payment["value"]) * 100))
            except (TypeError, ValueError):
                price_amount = None
        if price_amount is None and plan_code:
            rates = get_fx_rates()
            price_amount = convert_cents(get_plan(plan_code).price_amount, currency, rates=rates)
        return {
            "tenant_id": tenant_id,
            "plan_code": plan_code,
            "provider_subscription_id": resource.get("id"),
            "provider_customer_id": (resource.get("subscriber") or {}).get("payer_id"),
            "status": status,
            "price_amount": price_amount,
            "currency": currency,
            "current_period_start": last_payment_time or start_time,
            "current_period_end": next_billing,
            "cancel_at_period_end": status in {"canceled", "expired", "suspended"},
        }

    def _parse_custom_id(self, custom_id: str) -> tuple[str | None, str | None, str | None]:
        if not custom_id:
            return None, None, None
        parts = custom_id.split("|")
        tenant_id = parts[0] if len(parts) > 0 and parts[0] else None
        plan_code = parts[1] if len(parts) > 1 and parts[1] else None
        currency = parts[2] if len(parts) > 2 and parts[2] else None
        return tenant_id, plan_code, currency

    def _map_status(self, status: str | None) -> str:
        if not status:
            return "inactive"
        return {
            "ACTIVE": "active",
            "APPROVAL_PENDING": "inactive",
            "APPROVED": "inactive",
            "SUSPENDED": "suspended",
            "CANCELLED": "canceled",
            "EXPIRED": "expired",
        }.get(status, status.lower())

    def _parse_time(self, value: str | None) -> datetime | None:
        if not value:
            return None
        try:
            if value.endswith("Z"):
                value = value.replace("Z", "+00:00")
            return datetime.fromisoformat(value)
        except ValueError:
            return None
