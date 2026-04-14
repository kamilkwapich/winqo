"""add handle colors to user settings

Revision ID: 004_add_handle_colors
Revises: 003_quote_costs_notes
Create Date: 2026-01-14 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '004_add_handle_colors'
down_revision = '003_quote_costs_notes'
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)

    settings_cols = {c['name'] for c in inspector.get_columns('user_settings')}
    if 'handle_colors' not in settings_cols:
        op.add_column('user_settings', sa.Column('handle_colors', sa.JSON(), nullable=True, server_default='[]'))


def downgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)

    settings_cols = {c['name'] for c in inspector.get_columns('user_settings')}
    if 'handle_colors' in settings_cols:
        op.drop_column('user_settings', 'handle_colors')
