from __future__ import annotations
from abc import ABC, abstractmethod
from typing import Any

class BillingProvider(ABC):
    name: str

    @abstractmethod
    def enabled(self) -> bool: ...

    @abstractmethod
    def create_checkout(self, tenant_id: str, email: str, plan_code: str, **kwargs) -> str:
        """Return a URL to redirect user to provider checkout."""  # noqa

    @abstractmethod
    def handle_webhook(self, payload: bytes, headers: dict[str, str], **kwargs) -> dict[str, Any]:
        """Process webhook. Return normalized event data."""  # noqa

    def create_portal(self, customer_id: str, return_url: str) -> str:
        """Return a URL to the provider's self-service billing portal (if available)."""
        raise NotImplementedError
