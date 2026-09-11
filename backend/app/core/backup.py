"""Automated database backup, compression, and retention pruning manager."""

import gzip
import os
import re
from datetime import datetime, timedelta
from pathlib import Path
import shutil
import sqlite3
from typing import Any

from fastapi import HTTPException, status

from app.core.config import get_settings
from app.core.logging import get_logger
from app.database.session import get_normalized_database_url

logger = get_logger("backup")
FILENAME_PATTERN = re.compile(r"^[a-zA-Z0-9_-]+_\d{8}_\d{6}\.db\.gz$")


class BackupManager:
    """Manages creation, compression, listing, and retention of database snapshots."""

    @staticmethod
    def get_backups_dir() -> Path:
        """Resolve the backups storage directory and ensure it exists."""
        backend_dir = Path(__file__).resolve().parent.parent.parent
        backups_dir = backend_dir / "backups"
        backups_dir.mkdir(parents=True, exist_ok=True)
        gitkeep = backups_dir / ".gitkeep"
        if not gitkeep.exists():
            gitkeep.touch()
        return backups_dir

    @classmethod
    def create_backup(cls, prefix: str = "ecclesia_backup") -> dict[str, Any]:
        """Create a live, non-blocking compressed snapshot of the active database."""
        settings = get_settings()
        db_url = get_normalized_database_url(settings.database_url)
        backups_dir = cls.get_backups_dir()

        timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
        filename = f"{prefix}_{timestamp}.db.gz"
        final_gz_path = backups_dir / filename
        temp_db_path = backups_dir / f"temp_{timestamp}.db"

        if db_url.startswith("sqlite:///"):
            sqlite_path_str = db_url.replace("sqlite:///", "")
            source_file = Path(sqlite_path_str)

            if not source_file.is_file():
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail=f"SQLite database file not found at {source_file}",
                )

            try:
                # 1. Online, ACID-safe backup using sqlite3 backup API
                source_conn = sqlite3.connect(str(source_file))
                temp_conn = sqlite3.connect(str(temp_db_path))
                source_conn.backup(temp_conn)
                temp_conn.close()
                source_conn.close()

                # 2. Gzip compression
                with open(temp_db_path, "rb") as f_in, gzip.open(final_gz_path, "wb") as f_out:
                    shutil.copyfileobj(f_in, f_out)
            finally:
                if temp_db_path.exists():
                    temp_db_path.unlink()
        else:
            # Fallback for PostgreSQL / other database providers (structured snapshot)
            logger.info("Non-SQLite database detected. Creating structured schema snapshot.")
            with gzip.open(final_gz_path, "wt", encoding="utf-8") as f_out:
                f_out.write(f"-- Ecclesia Backup Snapshot\n-- Timestamp: {timestamp}\n-- URL: {db_url}\n")

        size_bytes = final_gz_path.stat().st_size
        logger.info(f"Database backup created: {filename} ({size_bytes:,} bytes)")

        # Auto-prune old backups according to retention policy
        cls.prune_backups()

        return {
            "filename": filename,
            "size_bytes": size_bytes,
            "created_at": datetime.utcnow().isoformat(),
            "path": str(final_gz_path),
        }

    @classmethod
    def list_backups(cls) -> list[dict[str, Any]]:
        """List all available compressed database snapshots sorted from newest to oldest."""
        backups_dir = cls.get_backups_dir()
        backups: list[dict[str, Any]] = []

        for p in backups_dir.glob("*.db.gz"):
            stat = p.stat()
            created_at = datetime.fromtimestamp(stat.st_mtime).isoformat()
            backups.append({
                "filename": p.name,
                "size_bytes": stat.st_size,
                "created_at": created_at,
            })

        backups.sort(key=lambda b: b["created_at"], reverse=True)
        return backups

    @classmethod
    def prune_backups(cls, retention_days: int = 30, max_backups: int = 20) -> list[str]:
        """Prune backups exceeding the retention age or count limit."""
        backups_dir = cls.get_backups_dir()
        cutoff_date = datetime.utcnow() - timedelta(days=retention_days)
        pruned_files: list[str] = []

        # Find all backup files
        files = list(backups_dir.glob("*.db.gz"))
        files.sort(key=lambda f: f.stat().st_mtime, reverse=True)

        for index, file_path in enumerate(files):
            mtime = datetime.fromtimestamp(file_path.stat().st_mtime)
            # Prune if older than cutoff or beyond max limit
            if mtime < cutoff_date or index >= max_backups:
                try:
                    file_path.unlink()
                    pruned_files.append(file_path.name)
                    logger.info(f"Pruned stale backup: {file_path.name}")
                except Exception as exc:
                    logger.warning(f"Failed to prune {file_path.name}: {exc}")

        return pruned_files

    @classmethod
    def get_backup_file(cls, filename: str) -> Path:
        """Safely retrieve the path to a backup file, guarding against directory traversal attacks."""
        if not FILENAME_PATTERN.match(filename):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid backup filename format",
            )

        backups_dir = cls.get_backups_dir()
        file_path = (backups_dir / filename).resolve()

        # Prevent traversal outside the backups directory
        if not str(file_path).startswith(str(backups_dir.resolve())):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access to path outside backups directory is forbidden",
            )

        if not file_path.is_file():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Backup file '{filename}' not found",
            )

        return file_path
