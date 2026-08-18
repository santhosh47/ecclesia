import json
from pathlib import Path
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
    default_localization_mode: str = "IN"  # "IN" or "GLOBAL"

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


def get_localization_config_path() -> Path:
    """Return path to localization_config.json."""
    return Path(__file__).parent / "localization_config.json"


def load_localization_config() -> dict:
    """Load current localization configuration from JSON file."""
    path = get_localization_config_path()
    if path.exists():
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    return {"active_mode": "IN"}


def save_localization_config(data: dict) -> None:
    """Save localization configuration to JSON file."""
    path = get_localization_config_path()
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2)


@lru_cache
def get_settings() -> Settings:
    """Return one cached settings instance for the running application."""

    return Settings()

