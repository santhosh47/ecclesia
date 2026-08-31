"""Localization, church branding, feature toggles, and RBAC role management endpoints."""

from typing import Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import load_localization_config, save_localization_config
from app.database.session import get_db
from app.models.church_setting import ChurchSetting
from app.schemas.localization import (
    ChurchProfileUpdate,
    LocalizationConfigRead,
    ModuleToggleRequest,
    RoleCreate,
    RoleDefinition,
    RoleUpdate,
    ToggleModeRequest,
)

router = APIRouter(prefix="/localization", tags=["localization"])


def _get_or_create_church_setting(db: Session) -> ChurchSetting:
    """Retrieve existing church setting or seed from localization_config.json if not present."""
    setting = db.scalar(select(ChurchSetting).limit(1))
    if not setting:
        raw_cfg = load_localization_config()
        setting = ChurchSetting(
            id=1,
            active_mode=raw_cfg.get("active_mode", "IN"),
            organization_data=raw_cfg.get("organization", {}),
            modules_data=raw_cfg.get("modules", {}),
            roles_data=raw_cfg.get("roles", []),
            in_mode_settings=raw_cfg.get("in_mode_settings", {}),
            global_mode_settings=raw_cfg.get("global_mode_settings", {}),
        )
        db.add(setting)
        db.commit()
        db.refresh(setting)
    return setting


def _to_config_dict(setting: ChurchSetting) -> dict[str, Any]:
    """Convert database ChurchSetting model to config dictionary."""
    return {
        "active_mode": setting.active_mode,
        "organization": setting.organization_data or {},
        "modules": setting.modules_data or {},
        "roles": setting.roles_data or [],
        "in_mode_settings": setting.in_mode_settings or {},
        "global_mode_settings": setting.global_mode_settings or {},
    }


def _save_and_sync(setting: ChurchSetting, db: Session) -> dict[str, Any]:
    """Commit DB updates and sync backup to JSON config file."""
    db.commit()
    db.refresh(setting)
    cfg_dict = _to_config_dict(setting)
    try:
        save_localization_config(cfg_dict)
    except Exception:
        pass
    return cfg_dict


@router.get("/config", response_model=LocalizationConfigRead)
def get_localization_config(db: Session = Depends(get_db)) -> dict[str, Any]:
    """Retrieve active localization mode, church profile, feature toggles, and RBAC roles from persistent database."""
    setting = _get_or_create_church_setting(db)
    return _to_config_dict(setting)


@router.post("/toggle-mode", response_model=LocalizationConfigRead)
def toggle_localization_mode(payload: ToggleModeRequest, db: Session = Depends(get_db)) -> dict[str, Any]:
    """Toggle between India (IN) and Global (GLOBAL) localization modes."""
    setting = _get_or_create_church_setting(db)
    setting.active_mode = payload.mode
    return _save_and_sync(setting, db)


@router.put("/church-profile", response_model=LocalizationConfigRead)
def update_church_profile(payload: ChurchProfileUpdate, db: Session = Depends(get_db)) -> dict[str, Any]:
    """Update church branding, name, senior pastor, contact details, tax registration, and currency."""
    setting = _get_or_create_church_setting(db)
    current_org = dict(setting.organization_data or {})

    update_data = payload.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        if value is not None:
            current_org[key] = value

    setting.organization_data = current_org
    return _save_and_sync(setting, db)


@router.post("/toggle-module", response_model=LocalizationConfigRead)
def toggle_module(payload: ModuleToggleRequest, db: Session = Depends(get_db)) -> dict[str, Any]:
    """Fine-grained toggle to enable or disable any non-core church software module."""
    setting = _get_or_create_church_setting(db)
    modules = dict(setting.modules_data or {})
    modules[payload.module_key] = payload.enabled
    setting.modules_data = modules
    return _save_and_sync(setting, db)


@router.put("/roles", response_model=LocalizationConfigRead)
def create_or_update_role(payload: RoleCreate, db: Session = Depends(get_db)) -> dict[str, Any]:
    """Create a new role or update permissions for an existing role."""
    setting = _get_or_create_church_setting(db)
    roles = [dict(r) for r in (setting.roles_data or [])]

    existing_idx = next((i for i, r in enumerate(roles) if r.get("id") == payload.id), None)
    if existing_idx is not None:
        roles[existing_idx]["name"] = payload.name
        roles[existing_idx]["description"] = payload.description
        roles[existing_idx]["permissions"] = payload.permissions
    else:
        roles.append({
            "id": payload.id,
            "name": payload.name,
            "description": payload.description,
            "is_system": False,
            "permissions": payload.permissions,
        })

    setting.roles_data = roles
    return _save_and_sync(setting, db)


@router.delete("/roles/{role_id}", response_model=LocalizationConfigRead)
def delete_role(role_id: str, db: Session = Depends(get_db)) -> dict[str, Any]:
    """Delete a custom RBAC role (system roles cannot be deleted)."""
    setting = _get_or_create_church_setting(db)
    roles = [dict(r) for r in (setting.roles_data or [])]

    target = next((r for r in roles if r.get("id") == role_id), None)
    if not target:
        raise HTTPException(status_code=404, detail="Role not found")
    if target.get("is_system", False):
        raise HTTPException(status_code=400, detail="Built-in system roles cannot be deleted")

    setting.roles_data = [r for r in roles if r.get("id") != role_id]
    return _save_and_sync(setting, db)


@router.put("/config", response_model=LocalizationConfigRead)
def update_localization_config(payload: dict[str, Any], db: Session = Depends(get_db)) -> dict[str, Any]:
    """Update localization and organization settings."""
    setting = _get_or_create_church_setting(db)
    if "active_mode" in payload:
        setting.active_mode = payload["active_mode"]
    if "organization" in payload:
        setting.organization_data = payload["organization"]
    if "modules" in payload:
        setting.modules_data = payload["modules"]
    if "roles" in payload:
        setting.roles_data = payload["roles"]
    if "in_mode_settings" in payload:
        setting.in_mode_settings = payload["in_mode_settings"]
    if "global_mode_settings" in payload:
        setting.global_mode_settings = payload["global_mode_settings"]

    return _save_and_sync(setting, db)
