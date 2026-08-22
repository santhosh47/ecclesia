"""Database engine and request-scoped session dependency."""

from collections.abc import Generator

from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from app.core.config import get_settings


from pathlib import Path


def get_normalized_database_url(url: str) -> str:
    """Normalize database connection strings for SQLAlchemy with psycopg3 or absolute SQLite."""
    if url.startswith("sqlite:///./"):
        backend_dir = Path(__file__).resolve().parent.parent.parent
        db_filename = url[len("sqlite:///./") :]
        db_path = backend_dir / db_filename
        return f"sqlite:///{db_path.as_posix()}"
    if url == "sqlite:///ecclesia.db":
        backend_dir = Path(__file__).resolve().parent.parent.parent
        db_path = backend_dir / "ecclesia.db"
        return f"sqlite:///{db_path.as_posix()}"
    if url.startswith("postgres://"):
        return url.replace("postgres://", "postgresql+psycopg://", 1)
    if url.startswith("postgresql://") and not url.startswith("postgresql+"):
        return url.replace("postgresql://", "postgresql+psycopg://", 1)
    return url


settings = get_settings()
db_url = get_normalized_database_url(settings.database_url)
connect_args = {"check_same_thread": False} if db_url.startswith("sqlite") else {}

engine = create_engine(
    db_url,
    connect_args=connect_args,
    pool_pre_ping=True,
)
SessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False)


def get_db() -> Generator[Session, None, None]:
    """Provide a database session and close it after the request completes."""

    database_session = SessionLocal()
    try:
        yield database_session
    finally:
        database_session.close()
