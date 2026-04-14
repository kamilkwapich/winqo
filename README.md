# Winqo (MVP scaffold)

A lightweight multi-tenant SaaS to create window quotations, render simple window drawings (SVG), and generate PDF offers.
Includes:
- Public landing (multi-language: PL/EN/IT/DE/ES)
- Auth (login)
- App: clients + quotes + items + SVG window preview
- PDF generation (WeasyPrint)
- Multi-tenant data model (tenant_id on all business entities)
- Super Admin panel (tenants/users/subscriptions/provider settings)
- Billing provider abstraction (Stripe implemented as baseline; PayPal/Autopay stubs ready)

> This is an **MVP scaffold** intended to be extended (pricing rules, richer window types, advanced permissions, full RLS, etc.).

## Stack
- Frontend: Next.js (App Router) + Tailwind
- Backend: FastAPI + SQLModel + Postgres
- Billing: Provider adapters (Stripe/PayPal/Autopay)
- PDF: WeasyPrint

## Quick start (Docker)
1. Copy env files:
   - `cp backend/.env.example backend/.env`
   - `cp frontend/.env.example frontend/.env`

2. Start:
   ```bash
   docker compose up --build
   ```

3. Open:
- Frontend: http://localhost:3000
- Backend: http://localhost:8000/docs

## Default accounts
On first run, backend seeds:
- Super Admin: `admin@demo.local` / `Admin123!`
- Demo tenant owner: `owner@demo.local` / `Owner123!` (tenant: Demo Sp. z o.o.)

## Environments / secrets
- Put keys in `backend/.env` (Stripe/PayPal/Autopay). UI never stores secrets.

## Notes
- Multi-tenant isolation is enforced at API layer (tenant_id filters). You can enable Postgres RLS later (see `backend/docs/rls.md`).
- Stripe webhooks require a public URL (use `stripe listen` or a tunnel). PayPal/Autopay adapters are stubs with clear TODOs.
