"""System administration API endpoints for database snapshots, backups, and maintenance."""

from fastapi import APIRouter, Depends, Request, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.core.backup import BackupManager
from app.core.security import require_role
from app.database.session import get_db
from app.models.user import User
from app.schemas.system import BackupCreateResponse, BackupListResponse, BackupMetadata
from app.services.audit_service import get_audit_service

router = APIRouter(prefix="/system", tags=["system"])


@router.post("/backup", response_model=BackupCreateResponse, status_code=status.HTTP_201_CREATED)
def create_backup(
    request: Request,
    current_user: User = Depends(require_role("super_admin")),
    db: Session = Depends(get_db),
) -> BackupCreateResponse:
    """Create a live, non-blocking compressed snapshot of the active database."""
    backup_data = BackupManager.create_backup()

    audit_service = get_audit_service(db)
    client_ip = request.client.host if request.client else None
    audit_service.record(
        action="BACKUP_CREATED",
        entity_type="System",
        entity_id=backup_data["filename"],
        details=f"Database backup created: {backup_data['filename']} ({backup_data['size_bytes']} bytes)",
        user_id=current_user.id,
        username=current_user.username,
        user_role=current_user.role,
        ip_address=client_ip,
    )

    metadata = BackupMetadata(
        filename=backup_data["filename"],
        size_bytes=backup_data["size_bytes"],
        created_at=backup_data["created_at"],
        path=backup_data["path"],
    )

    return BackupCreateResponse(
        message="Database backup created successfully.",
        backup=metadata,
    )


@router.get("/backups", response_model=BackupListResponse)
def list_backups(
    current_user: User = Depends(require_role("super_admin")),
) -> BackupListResponse:
    """List all available database snapshots ordered by newest first."""
    backups = BackupManager.list_backups()
    items = [BackupMetadata(**b) for b in backups]
    return BackupListResponse(items=items, total=len(items))


@router.get("/backups/{filename}/download")
def download_backup(
    filename: str,
    request: Request,
    current_user: User = Depends(require_role("super_admin")),
    db: Session = Depends(get_db),
) -> FileResponse:
    """Securely download a compressed database backup snapshot."""
    file_path = BackupManager.get_backup_file(filename)

    audit_service = get_audit_service(db)
    client_ip = request.client.host if request.client else None
    audit_service.record(
        action="BACKUP_DOWNLOADED",
        entity_type="System",
        entity_id=filename,
        details=f"Database backup downloaded: {filename}",
        user_id=current_user.id,
        username=current_user.username,
        user_role=current_user.role,
        ip_address=client_ip,
    )

    return FileResponse(
        path=file_path,
        filename=filename,
        media_type="application/gzip",
    )


@router.delete("/backups/{filename}")
def delete_backup(
    filename: str,
    request: Request,
    current_user: User = Depends(require_role("super_admin")),
    db: Session = Depends(get_db),
) -> dict[str, str]:
    """Safely delete a database backup snapshot."""
    file_path = BackupManager.get_backup_file(filename)
    file_path.unlink()

    audit_service = get_audit_service(db)
    client_ip = request.client.host if request.client else None
    audit_service.record(
        action="BACKUP_DELETED",
        entity_type="System",
        entity_id=filename,
        details=f"Database backup deleted: {filename}",
        user_id=current_user.id,
        username=current_user.username,
        user_role=current_user.role,
        ip_address=client_ip,
    )

    return {"message": f"Backup '{filename}' deleted successfully."}
