"""add_is_deleted_to_provinces_and_cities

Revision ID: 3cce8bcb1be2
Revises: 74cdae8cd55e
Create Date: 2025-10-10 17:34:49.228728

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '3cce8bcb1be2'
down_revision: Union[str, Sequence[str], None] = '74cdae8cd55e'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema: Add is_deleted column to provinces and cities tables."""
    # Add is_deleted column to provinces table
    op.add_column('provinces', sa.Column('is_deleted', sa.Boolean(), nullable=False, server_default='false'))
    
    # Add is_deleted column to cities table
    op.add_column('cities', sa.Column('is_deleted', sa.Boolean(), nullable=False, server_default='false'))


def downgrade() -> None:
    """Downgrade schema: Remove is_deleted column from provinces and cities tables."""
    # Remove is_deleted column from cities table
    op.drop_column('cities', 'is_deleted')
    
    # Remove is_deleted column from provinces table
    op.drop_column('provinces', 'is_deleted')
