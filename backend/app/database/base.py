"""SQLAlchemy declarative base shared by all database models."""

from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    """Base class for Ecclesia ORM models."""

    pass
