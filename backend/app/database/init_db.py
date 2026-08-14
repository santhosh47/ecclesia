"""Database initialization helpers for development and local use."""

from app.database.base import Base
from app.database.session import engine
import app.models  # noqa: F401 - registers models with Base.metadata


def initialize_database() -> None:
    """Create known tables when the application starts in a local environment."""

    Base.metadata.create_all(bind=engine)
