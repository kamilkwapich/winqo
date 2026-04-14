#!/usr/bin/env python3
"""
Create Stripe Price objects and PayPal Plan objects for canonical plans
and persist their IDs into GlobalBillingSettings.

Usage: run this inside the backend environment where env vars are available
and the app can connect to the database (docker-compose exec backend ...).

This script will:
- for each plan in app.services.billing.plans.PLANS (except DEMO),
  create Stripe Price objects for configured currencies and persist IDs,
  and create PayPal Plan objects (using GlobalBillingSettings.mode to pick sandbox/live).

It requires API credentials available via the app config env vars
(STRIPE secret key and PAYPAL client id/secret). The script will ask for
confirmation before making provider API calls.
"""
from __future__ import annotations
import sys
from typing import Iterable
from sqlmodel import Session
from app.core.config import settings
from app.db.session import engine
from app.services.billing.stripe_provider import StripeProvider
from app.services.billing.paypal_provider import PayPalProvider
from app.db.models import GlobalBillingSettings
from app.services.billing import plans as plans_module


def currencies_to_create() -> list[str]:
    # Use FX table keys and common currencies used in CURRENCY_BY_LANG
    keys = set()
    keys.update([k.upper() for k in plans_module.FX_RATES.keys()])
    keys.update([v.upper() for v in plans_module.CURRENCY_BY_LANG.values()])
    # Ensure EUR present
    keys.add("EUR")
    return sorted(keys)


def plan_codes() -> Iterable[str]:
    for code in plans_module.PLANS.keys():
        if code == "DEMO":
            continue
        yield code


def confirm() -> bool:
    print("This will create provider Price/Plan objects in Stripe and PayPal and store their IDs in the database.")
    print("Providers will be used only if corresponding API credentials are present in environment.")
    ans = input("Proceed? Type 'yes' to continue: ")
    return ans.strip().lower() == "yes"


def main() -> int:
    if not confirm():
        print("Aborted by user.")
        return 2

    currencies = currencies_to_create()
    print("Currencies to ensure:", ", ".join(currencies))

    stripe = StripeProvider()
    paypal = PayPalProvider()

    with Session(engine) as session:
        # Stripe
        if stripe.enabled():
            print("Stripe API key present, ensuring prices...")
            # ensure stripe API key is set for stripe library calls
            try:
                import stripe as _stripe
                _stripe.api_key = settings.stripe_secret_key
            except Exception:
                pass
            for code in plan_codes():
                for cur in currencies:
                    try:
                        price_id = stripe._ensure_price_id(session, code, cur)
                        print(f"Stripe: ensured {code} {cur} -> {price_id}")
                    except Exception as e:
                        print(f"Stripe: failed {code} {cur}: {e}")
        else:
            print("Stripe not configured (STRIPE_SECRET_KEY missing). Skipping Stripe.")

        # PayPal
        if paypal.enabled():
            print("PayPal credentials present, ensuring plans...")
            # Determine mode from GlobalBillingSettings (fallback to sandbox)
            settings_row = session.get(GlobalBillingSettings, 1)
            mode = (settings_row.mode if settings_row and getattr(settings_row, "mode", None) else "sandbox")
            base_url = paypal._base_url(mode or "live")
            try:
                token = paypal._access_token(base_url)
            except Exception as e:
                print(f"PayPal: failed to get access token: {e}")
                token = None

            if token:
                rates = plans_module.get_fx_rates(session)
                for code in plan_codes():
                    for cur in currencies:
                        try:
                            plan_id = paypal._ensure_plan_id(session, base_url, token, code, cur, rates, None)
                            print(f"PayPal: ensured {code} {cur} -> {plan_id}")
                        except Exception as e:
                            print(f"PayPal: failed {code} {cur}: {e}")
        else:
            print("PayPal not configured (PAYPAL_CLIENT_ID/SECRET missing). Skipping PayPal.")

    print("Done. Check GlobalBillingSettings for stored IDs.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
