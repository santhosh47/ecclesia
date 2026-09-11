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
    
    engine.dispose()
