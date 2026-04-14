from __future__ import annotations
from typing import Any
from app.core.config import settings
from app.services.billing.base import BillingProvider

class AutopayProvider(BillingProvider):
    name = "autopay"

    def enabled(self) -> bool:
        return bool(settings.autopay_merchant_id and settings.autopay_api_key)

    def create_checkout(self, tenant_id: str, email: str, plan_code: str) -> str:
        # TODO: Implement Autopay checkout / recurring if available.
        return "https://example.com/autopay-stub"

    def create_portal(self, customer_id: str, return_url: str) -> str:
        # MVP placeholder - implement provider portal when integrating.
        return "https://example.com/provider-portal-not-configured"

    def handle_webhook(self, payload: bytes, headers: dict[str, str]) -> dict[str, Any]:
        # TODO: verify and map
        return {"ok": True, "provider": "autopay", "id": "stub", "type": "stub", "data": {}}
