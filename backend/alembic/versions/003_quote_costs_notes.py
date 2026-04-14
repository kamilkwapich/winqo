"""add quote cost fields and item notes

Revision ID: 003_quote_costs_notes
Revises: 002_add_discount_codes
Create Date: 2026-01-15 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '003_quote_costs_notes'
down_revision = '002_add_discount_codes'
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)

    quote_cols = {c['name'] for c in inspector.get_columns('quote')}
    if 'vat_rate' not in quote_cols:
        op.add_column('quote', sa.Column('vat_rate', sa.Float(), nullable=False, server_default='0'))
    if 'transport_cost_cents' not in quote_cols:
        op.add_column('quote', sa.Column('transport_cost_cents', sa.Integer(), nullable=False, server_default='0'))
    if 'installation_cost_cents' not in quote_cols:
        op.add_column('quote', sa.Column('installation_cost_cents', sa.Integer(), nullable=False, server_default='0'))
    if 'extra_costs_cents' not in quote_cols:
        op.add_column('quote', sa.Column('extra_costs_cents', sa.Integer(), nullable=False, server_default='0'))

    item_cols = {c['name'] for c in inspector.get_columns('quoteitem')}
    if 'notes' not in item_cols:
        op.add_column('quoteitem', sa.Column('notes', sa.Text(), nullable=True))


def downgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)

    item_cols = {c['name'] for c in inspector.get_columns('quoteitem')}
    if 'notes' in item_cols:
        op.drop_column('quoteitem', 'notes')

    quote_cols = {c['name'] for c in inspector.get_columns('quote')}
    if 'extra_costs_cents' in quote_cols:
        op.drop_column('quote', 'extra_costs_cents')
    if 'installation_cost_cents' in quote_cols:
        op.drop_column('quote', 'installation_cost_cents')
    if 'transport_cost_cents' in quote_cols:
        op.drop_column('quote', 'transport_cost_cents')
    if 'vat_rate' in quote_cols:
        op.drop_column('quote', 'vat_rate')
