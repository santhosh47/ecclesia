"""Environment-based application configuration."""

from functools import lru_cache

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Settings loaded from the backend .env file or environment variables."""

    app_name: str = "Ecclesia Church Management System"
    environment: str = "development"
    debug: bool = True
    api_v1_prefix: str = "/api/v1"
    database_url: str = "sqlite:///./ecclesia.db"
    cors_origins: str = "http://localhost:5173"
    jwt_secret_key: str | None = None

    model_config = SettingsConfigDict(
        env_file=".env", env_file_encoding="utf-8", extra="ignore"
    )

    @field_validator("debug", mode="before")
    @classmethod
    def parse_debug(cls, value: object) -> object:
        """Accept common deployment labels as well as boolean values."""
        if isinstance(value, str) and value.lower() in {"release", "production"}:
            return False
        return value


@lru_cache
def get_settings() -> Settings:
    """Return one cached settings instance for the running application."""

    return Settings()
