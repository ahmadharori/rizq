"""add_recipients_couriers_assignments_tables

Revision ID: 6e4a059a6c9a
Revises: 2c9e2f3ee577
Create Date: 2025-10-10 16:43:22.593001

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
import geoalchemy2


# revision identifiers, used by Alembic.
revision: str = '6e4a059a6c9a'
down_revision: Union[str, Sequence[str], None] = 'f1a968b65236'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Enable PostGIS extension
    op.execute("CREATE EXTENSION IF NOT EXISTS postgis")
    
    # Create regional data tables
    op.create_table(
        'provinces',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.PrimaryKeyConstraint('id'),
        sa.Index('ix_provinces_name', 'name'),
    )
    
    op.create_table(
        'cities',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('province_id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.ForeignKeyConstraint(['province_id'], ['provinces.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.Index('ix_cities_province_id', 'province_id'),
        sa.Index('ix_cities_name', 'name'),
    )
    
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
    
    # Create couriers table
    op.create_table(
        'couriers',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False, server_default=sa.text('gen_random_uuid()')),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('phone', sa.String(length=20), nullable=False),
        sa.Column('is_deleted', sa.Boolean(), nullable=False, server_default=sa.text('false')),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('phone'),
        sa.Index('ix_couriers_name', 'name'),
        sa.Index('ix_couriers_phone', 'phone'),
    )
    
    # Create recipients table with PostGIS
    op.create_table(
        'recipients',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False, server_default=sa.text('gen_random_uuid()')),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('phone', sa.String(length=20), nullable=False),
        sa.Column('address', sa.Text(), nullable=False),
        sa.Column('province_id', sa.Integer(), nullable=False),
        sa.Column('city_id', sa.Integer(), nullable=False),
        sa.Column('district_id', sa.Integer(), nullable=False),
        sa.Column('village_id', sa.Integer(), nullable=False),
        sa.Column('location', geoalchemy2.types.Geography(geometry_type='POINT', srid=4326, spatial_index=False), nullable=False),
        sa.Column('num_packages', sa.Integer(), nullable=False, server_default=sa.text('1')),
        sa.Column('status', sa.String(length=20), nullable=False, server_default=sa.text("'Unassigned'")),
        sa.Column('is_deleted', sa.Boolean(), nullable=False, server_default=sa.text('false')),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.CheckConstraint("status IN ('Unassigned', 'Assigned', 'Delivery', 'Done', 'Return')", name='check_recipient_status'),
        sa.CheckConstraint('num_packages >= 1', name='check_num_packages_positive'),
        sa.ForeignKeyConstraint(['province_id'], ['provinces.id'], ),
        sa.ForeignKeyConstraint(['city_id'], ['cities.id'], ),
        sa.ForeignKeyConstraint(['district_id'], ['districts.id'], ),
        sa.ForeignKeyConstraint(['village_id'], ['villages.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.Index('ix_recipients_name', 'name'),
        sa.Index('ix_recipients_province_id', 'province_id'),
        sa.Index('ix_recipients_city_id', 'city_id'),
        sa.Index('ix_recipients_status', 'status'),
    )
    
    # Create spatial index for recipients.location using GIST
    op.execute("CREATE INDEX idx_recipients_location ON recipients USING GIST (location)")
    
    # Create assignments table
    op.create_table(
        'assignments',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False, server_default=sa.text('gen_random_uuid()')),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('courier_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('route_data', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('total_distance_meters', sa.Float(), nullable=True),
        sa.Column('total_duration_seconds', sa.Integer(), nullable=True),
        sa.Column('created_by', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('is_deleted', sa.Boolean(), nullable=False, server_default=sa.text('false')),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.ForeignKeyConstraint(['courier_id'], ['couriers.id'], ),
        sa.ForeignKeyConstraint(['created_by'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.Index('ix_assignments_courier_id', 'courier_id'),
    )
    
    # Create assignment_recipients junction table
    op.create_table(
        'assignment_recipients',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False, server_default=sa.text('gen_random_uuid()')),
        sa.Column('assignment_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('recipient_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('sequence_order', sa.Integer(), nullable=False),
        sa.Column('distance_from_previous_meters', sa.Float(), nullable=True),
        sa.Column('duration_from_previous_seconds', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.ForeignKeyConstraint(['assignment_id'], ['assignments.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['recipient_id'], ['recipients.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('assignment_id', 'recipient_id', name='unique_assignment_recipient'),
        sa.Index('ix_assignment_recipients_assignment_id', 'assignment_id'),
        sa.Index('ix_assignment_recipients_recipient_id', 'recipient_id'),
        sa.Index('idx_assignment_sequence', 'assignment_id', 'sequence_order'),
    )
    
    # Create status_history table
    op.create_table(
        'status_history',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False, server_default=sa.text('gen_random_uuid()')),
        sa.Column('recipient_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('old_status', sa.String(length=20), nullable=True),
        sa.Column('new_status', sa.String(length=20), nullable=False),
        sa.Column('changed_by', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('changed_at', sa.DateTime(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.ForeignKeyConstraint(['recipient_id'], ['recipients.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['changed_by'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.Index('ix_status_history_recipient_id', 'recipient_id'),
        sa.Index('ix_status_history_changed_at', 'changed_at'),
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_table('status_history')
    op.drop_table('assignment_recipients')
    op.drop_table('assignments')
    op.execute("DROP INDEX IF EXISTS idx_recipients_location")
    op.drop_table('recipients')
    op.drop_table('couriers')
    op.drop_table('villages')
    op.drop_table('districts')
    op.drop_table('cities')
    op.drop_table('provinces')
    op.execute("DROP EXTENSION IF EXISTS postgis")

