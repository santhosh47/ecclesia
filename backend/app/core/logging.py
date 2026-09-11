"""Centralized logging configuration for Ecclesia."""

import contextvars
import logging
import sys
from logging.handlers import RotatingFileHandler
from pathlib import Path

# Context variable to track the current request ID across async tasks
request_id_ctx: contextvars.ContextVar[str] = contextvars.ContextVar("request_id", default="-")


class RequestIdFilter(logging.Filter):
    """Logging filter that injects the current request correlation ID into log records."""

    def filter(self, record: logging.LogRecord) -> bool:
        record.request_id = request_id_ctx.get()
        return True


def setup_logging(
    log_level: str = "INFO",
    log_file: str = "logs/ecclesia.log",
    max_bytes: int = 10 * 1024 * 1024,  # 10 MB
    backup_count: int = 5,
) -> None:
    """Configure root and application loggers with console and rotating file handlers."""
    numeric_level = getattr(logging, log_level.upper(), logging.INFO)

    log_format = (
        "%(asctime)s | %(levelname)-7s | [%(request_id)s] | %(name)s:%(lineno)d - %(message)s"
    )
    date_format = "%Y-%m-%d %H:%M:%S"

    formatter = logging.Formatter(log_format, datefmt=date_format)
    req_filter = RequestIdFilter()

    # Root logger
    root_logger = logging.getLogger()
    root_logger.setLevel(numeric_level)

    # Avoid duplicate handlers if setup_logging is called multiple times
    root_logger.handlers.clear()

    # 1. Console / Stdout handler
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(numeric_level)
    console_handler.setFormatter(formatter)
    console_handler.addFilter(req_filter)
    root_logger.addHandler(console_handler)

    # 2. Rotating File handler
    try:
        # Resolve log file relative to backend root
        backend_dir = Path(__file__).resolve().parent.parent.parent
        log_path = Path(log_file)
        if not log_path.is_absolute():
            log_path = backend_dir / log_path

        log_path.parent.mkdir(parents=True, exist_ok=True)

        file_handler = RotatingFileHandler(
            filename=str(log_path),
            maxBytes=max_bytes,
            backupCount=backup_count,
            encoding="utf-8",
        )
        file_handler.setLevel(numeric_level)
        file_handler.setFormatter(formatter)
        file_handler.addFilter(req_filter)
        root_logger.addHandler(file_handler)
    except Exception as exc:
        print(f"Warning: Failed to setup rotating file logger at {log_file}: {exc}", file=sys.stderr)

    # Quiet noisy third-party loggers
    logging.getLogger("uvicorn.access").setLevel(logging.WARNING)
    logging.getLogger("uvicorn.error").setLevel(numeric_level)
    logging.getLogger("sqlalchemy.engine").setLevel(logging.WARNING)


def get_logger(name: str) -> logging.Logger:
    """Return a logger instance configured with the application hierarchy."""
    return logging.getLogger(f"ecclesia.{name}")
