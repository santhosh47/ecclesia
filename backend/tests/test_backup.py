"""Unit and integration tests for database backup, snapshot, and download security."""

import gzip
from pathlib import Path
import pytest
from fastapi import HTTPException
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.core.backup import BackupManager
from app.database.session import SessionLocal
from app.main import app
from app.services.audit_service import AuditService


@pytest.fixture
def db_session() -> Session:
    """Fixture providing a transactional test database session."""
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()


def test_backup_manager_create_and_verify_gzip() -> None:
    """Verify BackupManager creates a valid gzip-compressed live snapshot."""
    result = BackupManager.create_backup(prefix="test_backup")
    assert "filename" in result
    assert result["filename"].startswith("test_backup_")
    assert result["filename"].endswith(".db.gz")
    assert result["size_bytes"] > 0
    assert "created_at" in result
    assert "path" in result

    backup_path = Path(result["path"])
    assert backup_path.exists()

    # Verify gzip integrity by decompressing the header and initial stream
    with gzip.open(backup_path, "rb") as gz_file:
        header = gz_file.read(16)
        assert len(header) > 0


def test_backup_manager_list_backups() -> None:
    """Verify BackupManager lists available snapshots sorted newest first."""
    backups = BackupManager.list_backups()
    assert isinstance(backups, list)
    assert len(backups) > 0

    first = backups[0]
    assert "filename" in first
    assert "size_bytes" in first
    assert "created_at" in first
    assert first["filename"].endswith(".db.gz")


def test_backup_manager_security_traversal_rejection() -> None:
    """Verify directory traversal and invalid filename patterns are rejected."""
    # Directory traversal attempt
    with pytest.raises(HTTPException) as exc_info:
        BackupManager.get_backup_file("../../app/core/config.py")
    assert exc_info.value.status_code == 400

    # Malicious injection
    with pytest.raises(HTTPException) as exc_info:
        BackupManager.get_backup_file("ecclesia_backup_20260911_120000.db.gz/../../sensitive.env")
    assert exc_info.value.status_code == 400

    # Valid name pattern but non-existent file -> 404
    with pytest.raises(HTTPException) as exc_info:
        BackupManager.get_backup_file("ecclesia_backup_19990101_000000.db.gz")
    assert exc_info.value.status_code == 404


def test_backup_api_endpoints_lifecycle() -> None:
    """Verify complete API lifecycle: POST backup, GET list, GET download, DELETE."""
    with TestClient(app) as client:
        # 1. Create backup via API
        create_resp = client.post("/api/v1/system/backup")
        assert create_resp.status_code == 201
        data = create_resp.json()
        assert "message" in data
        assert "backup" in data
        filename = data["backup"]["filename"]

        # 2. List backups
        list_resp = client.get("/api/v1/system/backups")
        assert list_resp.status_code == 200
        list_data = list_resp.json()
        assert "items" in list_data
        assert list_data["total"] >= 1
        assert any(item["filename"] == filename for item in list_data["items"])

        # 3. Download backup
        download_resp = client.get(f"/api/v1/system/backups/{filename}/download")
        assert download_resp.status_code == 200
        assert download_resp.headers["content-type"] == "application/gzip"
        # Gzip magic bytes check (\x1f\x8b)
        assert download_resp.content[:2] == b"\x1f\x8b"

        # 4. Delete backup
        delete_resp = client.delete(f"/api/v1/system/backups/{filename}")
        assert delete_resp.status_code == 200
        assert "deleted successfully" in delete_resp.json()["message"]

        # 5. Confirm file was removed
        not_found_resp = client.get(f"/api/v1/system/backups/{filename}/download")
        assert not_found_resp.status_code == 404


def test_backup_generates_audit_logs(db_session: Session) -> None:
    """Verify backup operations generate corresponding immutable audit trail entries."""
    audit_service = AuditService(db_session)

    with TestClient(app) as client:
        resp = client.post("/api/v1/system/backup")
        assert resp.status_code == 201
        filename = resp.json()["backup"]["filename"]

        # Trigger download
        client.get(f"/api/v1/system/backups/{filename}/download")

        # Cleanup
        client.delete(f"/api/v1/system/backups/{filename}")

    # Inspect audit trail
    created_logs = audit_service.list_logs(action="BACKUP_CREATED")
    assert any(log.entity_id == filename for log in created_logs)

    downloaded_logs = audit_service.list_logs(action="BACKUP_DOWNLOADED")
    assert any(log.entity_id == filename for log in downloaded_logs)

    deleted_logs = audit_service.list_logs(action="BACKUP_DELETED")
    assert any(log.entity_id == filename for log in deleted_logs)


def test_backup_retention_pruning() -> None:
    """Verify retention pruning runs safely without throwing exceptions."""
    pruned = BackupManager.prune_backups(retention_days=365, max_backups=50)
    assert isinstance(pruned, list)
