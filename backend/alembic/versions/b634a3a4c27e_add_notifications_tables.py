"""add_notifications_tables

Revision ID: b634a3a4c27e
Revises: 296f3a7eb6d9
Create Date: 2026-09-11 16:53:40.973184
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'b634a3a4c27e'
down_revision: Union[str, Sequence[str], None] = '296f3a7eb6d9'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    existing_tables = inspector.get_table_names()

    # Notification rules table
    if 'notification_rules' not in existing_tables:
        op.create_table(
            'notification_rules',
            sa.Column('id', sa.Integer(), nullable=False),
            sa.Column('name', sa.String(length=150), nullable=False),
            sa.Column('event_type', sa.String(length=50), nullable=False),
            sa.Column('is_active', sa.Boolean(), nullable=False, server_default=sa.text('1')),
            sa.Column('threshold_value', sa.Integer(), nullable=False, server_default=sa.text('2')),
            sa.Column('channels', sa.String(length=100), nullable=False, server_default='in_app,email,whatsapp'),
            sa.Column('target_roles', sa.String(length=100), nullable=False, server_default='pastor,admin,super_admin'),
            sa.Column('message_template', sa.Text(), nullable=False),
            sa.Column('created_at', sa.DateTime(), nullable=False),
            sa.Column('updated_at', sa.DateTime(), nullable=False),
            sa.PrimaryKeyConstraint('id'),
            sa.UniqueConstraint('name')
        )
        op.create_index(op.f('ix_notification_rules_id'), 'notification_rules', ['id'], unique=False)

    # In-app notifications table
    if 'in_app_notifications' not in existing_tables:
        op.create_table(
            'in_app_notifications',
            sa.Column('id', sa.Integer(), nullable=False),
            sa.Column('user_id', sa.Integer(), nullable=True),
            sa.Column('target_role', sa.String(length=50), nullable=False, server_default='pastor'),
            sa.Column('title', sa.String(length=200), nullable=False),
            sa.Column('message', sa.Text(), nullable=False),
            sa.Column('notification_type', sa.String(length=50), nullable=False, server_default='absence_alert'),
            sa.Column('channels_dispatched', sa.String(length=100), nullable=False, server_default='in_app'),
            sa.Column('is_read', sa.Boolean(), nullable=False, server_default=sa.text('0')),
            sa.Column('action_url', sa.String(length=255), nullable=True),
            sa.Column('created_at', sa.DateTime(), nullable=False),
            sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
            sa.PrimaryKeyConstraint('id')
        )
        op.create_index(op.f('ix_in_app_notifications_id'), 'in_app_notifications', ['id'], unique=False)


def downgrade() -> None:
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    existing_tables = inspector.get_table_names()

    if 'in_app_notifications' in existing_tables:
        op.drop_index(op.f('ix_in_app_notifications_id'), table_name='in_app_notifications')
        op.drop_table('in_app_notifications')
    if 'notification_rules' in existing_tables:
        op.drop_index(op.f('ix_notification_rules_id'), table_name='notification_rules')
        op.drop_table('notification_rules')
