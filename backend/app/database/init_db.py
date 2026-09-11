from sqlalchemy import inspect, select, text

from app.core.config import load_localization_config
from app.core.logging import get_logger
from app.database.base import Base
from app.database.session import SessionLocal, engine
from app.models.church_setting import ChurchSetting
from app.models.user import User
import app.models  # noqa: F401 - registers models with Base.metadata

logger = get_logger("database.init")


def auto_migrate_missing_columns(target_engine) -> None:
    """Inspect all database tables and automatically add any missing columns from models.
    
    This ensures smooth backward-compatible upgrades on cloud databases (e.g. Render, Neon, Supabase)
    where tables already exist from previous deployments without requiring manual ALTER TABLE statements.
    """
    try:
        inspector = inspect(target_engine)
        existing_tables = set(inspector.get_table_names())
        dialect_name = target_engine.dialect.name

        for table_name, table in Base.metadata.tables.items():
            if table_name not in existing_tables:
                continue

            existing_columns = {c["name"] for c in inspector.get_columns(table_name)}
            for col in table.columns:
                if col.name in existing_columns:
                    continue

                col_type = col.type.compile(target_engine.dialect)
                default_clause = ""
                arg = getattr(col.default, "arg", None) if col.default is not None else None

                if isinstance(arg, bool):
                    if dialect_name == "postgresql":
                        default_clause = "DEFAULT TRUE" if arg else "DEFAULT FALSE"
                    else:
                        default_clause = "DEFAULT 1" if arg else "DEFAULT 0"
                elif isinstance(arg, (int, float)):
                    default_clause = f"DEFAULT {arg}"
                elif isinstance(arg, str):
                    safe_str = arg.replace("'", "''")
                    default_clause = f"DEFAULT '{safe_str}'"
                elif callable(arg):
                    if dialect_name == "postgresql":
                        default_clause = "DEFAULT CURRENT_TIMESTAMP"
                    else:
                        default_clause = "DEFAULT '1970-01-01 00:00:00'"
                elif not col.nullable:
                    type_str = str(col_type).upper()
                    if "BOOL" in type_str:
                        default_clause = "DEFAULT FALSE" if dialect_name == "postgresql" else "DEFAULT 0"
                    elif "INT" in type_str:
                        default_clause = "DEFAULT 0"
                    elif "CHAR" in type_str or "TEXT" in type_str:
                        default_clause = "DEFAULT ''"
                    elif "DATE" in type_str or "TIME" in type_str:
                        default_clause = "DEFAULT CURRENT_TIMESTAMP" if dialect_name == "postgresql" else "DEFAULT '1970-01-01 00:00:00'"

                if dialect_name == "postgresql":
                    sql = f'ALTER TABLE "{table_name}" ADD COLUMN IF NOT EXISTS "{col.name}" {col_type} {default_clause}'.strip()
                else:
                    sql = f'ALTER TABLE "{table_name}" ADD COLUMN "{col.name}" {col_type} {default_clause}'.strip()

                try:
                    with target_engine.begin() as conn:
                        conn.execute(text(sql))
                    logger.info("Auto-migrated schema: added missing column '%s' to table '%s'", col.name, table_name)
                except Exception as col_err:
                    logger.warning("Could not add column '%s' to table '%s': %s", col.name, table_name, col_err)
    except Exception as exc:
        logger.error("Error during auto-migration of missing columns: %s", exc)


def initialize_database() -> None:
    """Create known tables, auto-migrate schema differences, and ensure default administrative accounts exist."""
    Base.metadata.create_all(bind=engine)
    auto_migrate_missing_columns(engine)

    with SessionLocal() as db:
        user_exists = db.scalar(select(User).limit(1))
        if not user_exists:
            default_users = [
                User(
                    username="admin",
                    email="admin@ecclesia.org",
                    full_name="Senior Pastor / Administrator",
                    hashed_password=User.hash_password("admin123"),
                    role="super_admin",
                    is_active=True,
                ),
                User(
                    username="pastor",
                    email="pastor@ecclesia.org",
                    full_name="Pastor Mr. John Doe",
                    hashed_password=User.hash_password("pastor123"),
                    role="pastor",
                    is_active=True,
                ),
                User(
                    username="treasurer",
                    email="treasurer@ecclesia.org",
                    full_name="Head Treasurer & Accountant",
                    hashed_password=User.hash_password("treasurer123"),
                    role="treasurer",
                    is_active=True,
                ),
                User(
                    username="elder",
                    email="elder@ecclesia.org",
                    full_name="Elder David Sterling",
                    hashed_password=User.hash_password("elder123"),
                    role="elder",
                    is_active=True,
                ),
                User(
                    username="staff",
                    email="staff@ecclesia.org",
                    full_name="Church Office Secretary",
                    hashed_password=User.hash_password("staff123"),
                    role="sub_admin",
                    is_active=True,
                ),
                User(
                    username="leader",
                    email="leader@ecclesia.org",
                    full_name="Worship & Youth Leader",
                    hashed_password=User.hash_password("leader123"),
                    role="ministry_leader",
                    is_active=True,
                ),
            ]
            db.add_all(default_users)
            db.commit()

        setting_exists = db.scalar(select(ChurchSetting).limit(1))
        if not setting_exists:
            raw_cfg = load_localization_config()
            setting = ChurchSetting(
                id=1,
                active_mode=raw_cfg.get("active_mode", "IN"),
                organization_data=raw_cfg.get("organization", {}),
                modules_data=raw_cfg.get("modules", {}),
                roles_data=raw_cfg.get("roles", []),
                in_mode_settings=raw_cfg.get("in_mode_settings", {}),
                global_mode_settings=raw_cfg.get("global_mode_settings", {}),
            )
            db.add(setting)
            db.commit()
