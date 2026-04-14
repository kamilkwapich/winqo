"""add newsletter_subscribed to tenant

Revision ID: 001_add_newsletter
Revises: 
Create Date: 2026-01-13 19:30:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '001_add_newsletter'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add newsletter_subscribed column to tenant table
    op.add_column('tenant', sa.Column('newsletter_subscribed', sa.Boolean(), nullable=False, server_default='false'))


def downgrade() -> None:
    # Remove newsletter_subscribed column from tenant table
    op.drop_column('tenant', 'newsletter_subscribed')
