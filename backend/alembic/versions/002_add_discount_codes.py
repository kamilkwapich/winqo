"""add discount codes and subscription discount fields

Revision ID: 002_add_discount_codes
Revises: 001_add_newsletter
Create Date: 2026-01-14 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '002_add_discount_codes'
down_revision = '001_add_newsletter'
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)

    existing_cols = {c['name'] for c in inspector.get_columns('subscription')}
    if 'base_price_amount' not in existing_cols:
        op.add_column('subscription', sa.Column('base_price_amount', sa.Integer(), nullable=True))
    if 'discount_code' not in existing_cols:
        op.add_column('subscription', sa.Column('discount_code', sa.String(length=64), nullable=True))
    if 'discount_amount_cents' not in existing_cols:
        op.add_column('subscription', sa.Column('discount_amount_cents', sa.Integer(), nullable=True))
    table_exists = bind.execute(sa.text("select to_regclass('public.discountcode')")).scalar()
    if not table_exists:
        try:
            op.create_table(
                'discountcode',
                sa.Column('id', sa.String(length=36), primary_key=True),
                sa.Column('code', sa.String(length=64), nullable=False),
                sa.Column('type', sa.String(length=20), nullable=False, server_default='percent'),
                sa.Column('percent_value', sa.Float(), nullable=True),
                sa.Column('amount_cents', sa.Integer(), nullable=True),
                sa.Column('currency', sa.String(length=10), nullable=True),
                sa.Column('active', sa.Boolean(), nullable=False, server_default=sa.text('true')),
                sa.Column('expires_at', sa.DateTime(timezone=True), nullable=True),
                sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
                sa.UniqueConstraint('code', name='uq_discountcode_code'),
            )
        except Exception:
            # Table already present; proceed
            pass


def downgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)

    if 'discountcode' in inspector.get_table_names():
        op.drop_table('discountcode')

    existing_cols = {c['name'] for c in inspector.get_columns('subscription')}
    if 'discount_amount_cents' in existing_cols:
        op.drop_column('subscription', 'discount_amount_cents')
    if 'discount_code' in existing_cols:
        op.drop_column('subscription', 'discount_code')
    if 'base_price_amount' in existing_cols:
        op.drop_column('subscription', 'base_price_amount')
