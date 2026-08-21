from sqlalchemy import select

from app.database.base import Base
from app.database.session import SessionLocal, engine
from app.models.user import User
import app.models  # noqa: F401 - registers models with Base.metadata


def initialize_database() -> None:
    """Create known tables and ensure default administrative accounts exist."""
    Base.metadata.create_all(bind=engine)

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
                    full_name="Pastor Dr. Samuel Thomas",
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
