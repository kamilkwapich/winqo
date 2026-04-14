from sqlmodel import SQLModel, create_engine, Session
from sqlalchemy import inspect, text
from app.core.config import settings

engine = create_engine(settings.database_url, pool_pre_ping=True)

def create_db_and_tables():
    SQLModel.metadata.create_all(engine)

def _ensure_columns(conn, table: str, columns: dict[str, str]) -> None:
    inspector = inspect(conn)
    if not inspector.has_table(table):
        return
    existing = {col["name"] for col in inspector.get_columns(table)}
    for name, col_def in columns.items():
        if name not in existing:
            conn.execute(text(f"ALTER TABLE {table} ADD COLUMN {name} {col_def}"))

def ensure_schema():
    # Lightweight migrations for MVP / SQLite setups.
    with engine.begin() as conn:
        _ensure_columns(conn, "tenant", {
            "default_currency": "TEXT NOT NULL DEFAULT 'EUR'",
            "company_email": "TEXT",
            "company_phone": "TEXT",
            "company_website": "TEXT",
            "company_address": "TEXT",
            "logo_data": "TEXT",
            "billing_full_name": "TEXT",
            "billing_street": "TEXT",
            "billing_house_no": "TEXT",
            "billing_apartment_no": "TEXT",
            "billing_postcode": "TEXT",
            "billing_city": "TEXT",
            "billing_region": "TEXT",
            "billing_country": "TEXT",
            "billing_tax_id": "TEXT",
            "billing_auto_filled": "BOOLEAN DEFAULT FALSE",
        })
        _ensure_columns(conn, "quote", {
            "name": "TEXT NOT NULL DEFAULT ''",
        })
        _ensure_columns(conn, "globalbillingsettings", {
            "fx_rates": "JSONB DEFAULT '{}'::jsonb",
            "smtp_host": "TEXT",
            "smtp_port": "INTEGER",
            "smtp_user": "TEXT",
            "smtp_password": "TEXT",
            "smtp_from": "TEXT",
            "smtp_tls": "BOOLEAN DEFAULT TRUE",
            "imap_host": "TEXT",
            "imap_port": "INTEGER",
            "imap_user": "TEXT",
            "imap_password": "TEXT",
            "imap_tls": "BOOLEAN DEFAULT TRUE",
            "stripe_coupon_ids": "JSONB DEFAULT '{}'::jsonb",
            "stripe_price_ids": "JSONB DEFAULT '{}'::jsonb",
            "stripe_product_id": "TEXT",
            "paypal_plan_ids": "JSONB DEFAULT '{}'::jsonb",
            "paypal_product_id": "TEXT",
            "dashboard_banner_data": "TEXT",
        })
        _ensure_columns(conn, "subscription", {
            "pending_plan_code": "TEXT",
            "pending_change_at": "TIMESTAMP",
        })

def get_session():
    with Session(engine) as session:
        yield session
