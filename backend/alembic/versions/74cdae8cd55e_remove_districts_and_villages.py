"""remove_districts_and_villages

Revision ID: 74cdae8cd55e
Revises: 6e4a059a6c9a
Create Date: 2025-10-10 17:28:59.822691

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '74cdae8cd55e'
down_revision: Union[str, Sequence[str], None] = '6e4a059a6c9a'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema: Remove districts and villages tables and columns."""
    # Drop foreign key constraints from recipients table first
    op.drop_constraint('recipients_village_id_fkey', 'recipients', type_='foreignkey')
    op.drop_constraint('recipients_district_id_fkey', 'recipients', type_='foreignkey')
    
    # Drop columns from recipients table
    op.drop_column('recipients', 'village_id')
    op.drop_column('recipients', 'district_id')
    
    # Drop villages table
    op.drop_table('villages')
    
    # Drop districts table
    op.drop_table('districts')


def downgrade() -> None:
    """Downgrade schema: Recreate districts and villages tables and columns."""
    # Recreate districts table
    op.create_table(
        'districts',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('city_id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.ForeignKeyConstraint(['city_id'], ['cities.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.Index('ix_districts_city_id', 'city_id'),
        sa.Index('ix_districts_name', 'name'),
    )
    
    # Recreate villages table
    op.create_table(
        'villages',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('district_id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.ForeignKeyConstraint(['district_id'], ['districts.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.Index('ix_villages_district_id', 'district_id'),
        sa.Index('ix_villages_name', 'name'),
    )
    
    # Add columns back to recipients table
    op.add_column('recipients', sa.Column('district_id', sa.Integer(), nullable=False))
    op.add_column('recipients', sa.Column('village_id', sa.Integer(), nullable=False))
    
    # Recreate foreign key constraints
    op.create_foreign_key('recipients_district_id_fkey', 'recipients', 'districts', ['district_id'], ['id'])
    op.create_foreign_key('recipients_village_id_fkey', 'recipients', 'villages', ['village_id'], ['id'])
