"""add_device_push_subscriptions

Revision ID: c741e9b28a11
Revises: b634a3a4c27e
Create Date: 2026-09-11 17:15:00.000000
"""

from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


revision: str = 'c741e9b28a11'
down_revision: Union[str, Sequence[str], None] = 'b634a3a4c27e'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    existing_tables = inspector.get_table_names()

    if 'device_push_subscriptions' not in existing_tables:
        op.create_table(
            'device_push_subscriptions',
            sa.Column('id', sa.Integer(), nullable=False),
            sa.Column('user_id', sa.Integer(), nullable=True),
            sa.Column('target_role', sa.String(length=50), nullable=False, server_default='pastor'),
            sa.Column('endpoint', sa.Text(), nullable=False),
            sa.Column('p256dh', sa.String(length=255), nullable=True),
            sa.Column('auth', sa.String(length=255), nullable=True),
            sa.Column('device_type', sa.String(length=50), nullable=False, server_default='web'),
            sa.Column('is_active', sa.Boolean(), nullable=False, server_default=sa.text('1')),
            sa.Column('created_at', sa.DateTime(), nullable=False),
            sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
            sa.PrimaryKeyConstraint('id')
        )
        op.create_index(op.f('ix_device_push_subscriptions_id'), 'device_push_subscriptions', ['id'], unique=False)


def downgrade() -> None:
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    existing_tables = inspector.get_table_names()

    if 'device_push_subscriptions' in existing_tables:
        op.drop_index(op.f('ix_device_push_subscriptions_id'), table_name='device_push_subscriptions')
        op.drop_table('device_push_subscriptions')
