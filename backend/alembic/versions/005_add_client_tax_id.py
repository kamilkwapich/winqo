"""add tax id to client

Revision ID: 005_add_client_tax_id
Revises: 004_add_handle_colors
Create Date: 2026-01-14 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '005_add_client_tax_id'
down_revision = '004_add_handle_colors'
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)

    client_cols = {c['name'] for c in inspector.get_columns('client')}
    if 'tax_id' not in client_cols:
        op.add_column('client', sa.Column('tax_id', sa.String(), nullable=True))


def downgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)

    client_cols = {c['name'] for c in inspector.get_columns('client')}
    if 'tax_id' in client_cols:
        op.drop_column('client', 'tax_id')
