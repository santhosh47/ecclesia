"""ensure_church_activities_track_attendance

Revision ID: d83a12b4e5f6
Revises: c741e9b28a11
Create Date: 2026-09-11 19:50:00.000000
"""

from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


revision: str = 'd83a12b4e5f6'
down_revision: Union[str, Sequence[str], None] = 'c741e9b28a11'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    existing_tables = set(inspector.get_table_names())

    # 1. Ensure track_attendance column in church_activities
    if 'church_activities' in existing_tables:
        existing_cols = {c['name'] for c in inspector.get_columns('church_activities')}
        if 'track_attendance' not in existing_cols:
            default_val = sa.text('false') if conn.dialect.name == 'postgresql' else sa.text('0')
            op.add_column(
                'church_activities',
                sa.Column('track_attendance', sa.Boolean(), nullable=False, server_default=default_val)
            )

    # 2. Ensure answered prayer tracking columns in prayer_requests
    if 'prayer_requests' in existing_tables:
        existing_cols = {c['name'] for c in inspector.get_columns('prayer_requests')}
        if 'date_answered' not in existing_cols:
            op.add_column(
                'prayer_requests',
                sa.Column('date_answered', sa.Date(), nullable=True)
            )
        if 'answer_notes' not in existing_cols:
            op.add_column(
                'prayer_requests',
                sa.Column('answer_notes', sa.Text(), nullable=True)
            )


def downgrade() -> None:
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    existing_tables = set(inspector.get_table_names())

    if 'church_activities' in existing_tables:
        existing_cols = {c['name'] for c in inspector.get_columns('church_activities')}
        if 'track_attendance' in existing_cols:
            op.drop_column('church_activities', 'track_attendance')

    if 'prayer_requests' in existing_tables:
        existing_cols = {c['name'] for c in inspector.get_columns('prayer_requests')}
        if 'answer_notes' in existing_cols:
            op.drop_column('prayer_requests', 'answer_notes')
        if 'date_answered' in existing_cols:
            op.drop_column('prayer_requests', 'date_answered')
