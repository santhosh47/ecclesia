"""Test suite verifying Alembic database schema migrations."""

import os
from pathlib import Path
import pytest
from alembic import command
from alembic.config import Config
from sqlalchemy import create_engine, inspect


@pytest.fixture
def migration_test_db(tmp_path: Path):
    """Create an isolated temporary SQLite database for migration testing."""
    db_file = tmp_path / "migration_test.db"
    db_url = f"sqlite:///{db_file.as_posix()}"
    
    backend_dir = Path(__file__).resolve().parent.parent
    alembic_ini_path = backend_dir / "alembic.ini"
    
    alembic_cfg = Config(str(alembic_ini_path))
    alembic_cfg.set_main_option("script_location", str(backend_dir / "alembic"))
    alembic_cfg.set_main_option("sqlalchemy.url", db_url)
    
    # Also set env var for env.py
    old_db_url = os.environ.get("DATABASE_URL")
    os.environ["DATABASE_URL"] = db_url
    
    yield alembic_cfg, db_url
    
    if old_db_url is not None:
        os.environ["DATABASE_URL"] = old_db_url
    else:
        os.environ.pop("DATABASE_URL", None)


def test_alembic_upgrade_and_downgrade_cycle(migration_test_db):
    """Verify that Alembic can upgrade to head, verify all tables, downgrade, and upgrade again."""
    alembic_cfg, db_url = migration_test_db
    
    # 1. Upgrade to head
    command.upgrade(alembic_cfg, "head")
    
    engine = create_engine(db_url)
    inspector = inspect(engine)
    tables = inspector.get_table_names()
    
    # Core expected tables
    expected_tables = {
        "users",
        "members",
        "events",
        "attendance_records",
        "contributions",
        "expenses",
        "households",
        "ministries",
        "audit_logs",
        "accounts",
        "journal_entries",
        "journal_lines",
        "alembic_version",
    }
    
    for table in expected_tables:
        assert table in tables, f"Expected table '{table}' missing after alembic upgrade"
    
    # 2. Downgrade to base
    command.downgrade(alembic_cfg, "base")
    
    # Re-inspect
    engine.dispose()
    engine = create_engine(db_url)
    inspector = inspect(engine)
    remaining_tables = [t for t in inspector.get_table_names() if t != "alembic_version"]
    assert len(remaining_tables) == 0, f"Tables remained after downgrade: {remaining_tables}"
    
    # 3. Upgrade to head again (idempotency check)
    command.upgrade(alembic_cfg, "head")
    inspector = inspect(engine)
    reapplied_tables = inspector.get_table_names()
    assert "members" in reapplied_tables
    assert "audit_logs" in reapplied_tables
    assert "church_activities" in reapplied_tables
    
    activity_cols = {c["name"] for c in inspector.get_columns("church_activities")}
    assert "track_attendance" in activity_cols, "Expected track_attendance column in church_activities after migration"
    
    engine.dispose()


def test_auto_migrate_missing_columns_dynamically_repairs_legacy_schema(tmp_path: Path):
    """Verify that auto_migrate_missing_columns detects missing columns and repairs the database schema."""
    from sqlalchemy import text
    from app.database.init_db import auto_migrate_missing_columns

    db_file = tmp_path / "legacy_schema_test.db"
    test_engine = create_engine(f"sqlite:///{db_file.as_posix()}")

    # 1. Create a legacy church_activities table missing track_attendance
    with test_engine.begin() as conn:
        conn.execute(text("""
            CREATE TABLE church_activities (
                id INTEGER PRIMARY KEY,
                title VARCHAR(200) NOT NULL,
                category VARCHAR(50) NOT NULL,
                activity_type VARCHAR(50) NOT NULL,
                starts_at DATETIME NOT NULL
            )
        """))
        conn.execute(text("""
            INSERT INTO church_activities (id, title, category, activity_type, starts_at)
            VALUES (1, 'Sunday Morning Service', 'Worship Service', 'Regular Weekly', '2026-09-13 09:00:00')
        """))

    # Verify column is initially missing
    inspector = inspect(test_engine)
    initial_cols = {c["name"] for c in inspector.get_columns("church_activities")}
    assert "track_attendance" not in initial_cols

    # 2. Run auto-migration
    auto_migrate_missing_columns(test_engine)

    # 3. Verify column is added and existing row has default value
    inspector = inspect(test_engine)
    updated_cols = {c["name"] for c in inspector.get_columns("church_activities")}
    assert "track_attendance" in updated_cols
    assert "location" in updated_cols
    assert "is_active" in updated_cols

    with test_engine.connect() as conn:
        row = conn.execute(text("SELECT id, title, track_attendance FROM church_activities WHERE id = 1")).fetchone()
        assert row[0] == 1
        assert row[1] == "Sunday Morning Service"
        assert row[2] in (0, False)

        # 4. Insert new record with track_attendance = True
        conn.execute(text("""
            INSERT INTO church_activities (id, title, category, activity_type, starts_at, track_attendance)
            VALUES (2, 'Midweek Prayer', 'Prayer Meeting', 'Weekly', '2026-09-16 18:30:00', 1)
        """))
        new_row = conn.execute(text("SELECT id, title, track_attendance FROM church_activities WHERE id = 2")).fetchone()
        assert new_row[0] == 2
        assert new_row[2] in (1, True)

    test_engine.dispose()

