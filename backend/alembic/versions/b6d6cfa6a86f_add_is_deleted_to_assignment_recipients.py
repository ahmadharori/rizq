"""add_is_deleted_to_assignment_recipients

Revision ID: b6d6cfa6a86f
Revises: 6e4a059a6c9a
Create Date: 2025-10-24 21:18:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'b6d6cfa6a86f'
down_revision = '6e4a059a6c9a'
branch_labels = None
depends_on = None


def upgrade():
    # Add is_deleted column to assignment_recipients table
    op.add_column('assignment_recipients', sa.Column('is_deleted', sa.Boolean(), nullable=False, server_default='false'))
    
    # Add is_deleted column to status_history table (also missing)
    op.add_column('status_history', sa.Column('is_deleted', sa.Boolean(), nullable=False, server_default='false'))


def downgrade():
    # Remove is_deleted columns
    op.drop_column('status_history', 'is_deleted')
    op.drop_column('assignment_recipients', 'is_deleted')
