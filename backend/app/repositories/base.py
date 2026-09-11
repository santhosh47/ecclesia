"""Generic Base Repository providing foundational CRUD operations."""

from typing import Any, Generic, Type, TypeVar
from sqlalchemy import select
from sqlalchemy.orm import Session

ModelType = TypeVar("ModelType")


class BaseRepository(Generic[ModelType]):
    """Generic repository providing standardized database interactions for SQLAlchemy models."""

    def __init__(self, model: Type[ModelType], db: Session) -> None:
        self.model = model
        self.db = db

    def get(self, id: Any) -> ModelType | None:
        """Fetch a single entity by its primary key ID."""
        return self.db.get(self.model, id)

    def get_all(self, limit: int = 1000, offset: int = 0) -> list[ModelType]:
        """Fetch all entities with optional limit and offset."""
        stmt = select(self.model).offset(offset).limit(limit)
        return list(self.db.scalars(stmt).all())

    def create(self, entity: ModelType) -> ModelType:
        """Add and commit a new entity."""
        self.db.add(entity)
        self.db.commit()
        self.db.refresh(entity)
        return entity

    def update(self, entity: ModelType) -> ModelType:
        """Commit updates to an existing entity."""
        self.db.commit()
        self.db.refresh(entity)
        return entity

    def delete(self, entity: ModelType) -> None:
        """Delete an entity from the database session and commit."""
        self.db.delete(entity)
        self.db.commit()

    def flush(self) -> None:
        """Flush pending changes to the database."""
        self.db.flush()

    def commit(self) -> None:
        """Commit current transaction."""
        self.db.commit()

    def rollback(self) -> None:
        """Rollback current transaction."""
        self.db.rollback()
