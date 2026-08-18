"""Localization, church branding, feature toggles, and RBAC role management endpoints."""

from typing import Any
from fastapi import APIRouter, HTTPException, status

from app.core.config import load_localization_config, save_localization_config
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


@router.get("/config", response_model=LocalizationConfigRead)
def get_localization_config() -> dict[str, Any]:
    """Retrieve active localization mode, church profile, feature toggles, and RBAC roles."""
    return load_localization_config()


@router.post("/toggle-mode", response_model=LocalizationConfigRead)
def toggle_localization_mode(payload: ToggleModeRequest) -> dict[str, Any]:
    """Toggle between India (IN) and Global (GLOBAL) localization modes."""
    config = load_localization_config()
    config["active_mode"] = payload.mode
    save_localization_config(config)
    return config


@router.put("/church-profile", response_model=LocalizationConfigRead)
def update_church_profile(payload: ChurchProfileUpdate) -> dict[str, Any]:
    """Update church branding, name, senior pastor, contact details, tax registration, and currency."""
    config = load_localization_config()
    current_org = config.get("organization", {})

    update_data = payload.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        if value is not None:
            current_org[key] = value

    config["organization"] = current_org
    save_localization_config(config)
    return config


@router.post("/toggle-module", response_model=LocalizationConfigRead)
def toggle_module(payload: ModuleToggleRequest) -> dict[str, Any]:
    """Fine-grained toggle to enable or disable any non-core church software module."""
    config = load_localization_config()
    modules = config.get("modules", {})
    modules[payload.module_key] = payload.enabled
    config["modules"] = modules
    save_localization_config(config)
    return config


@router.put("/roles", response_model=LocalizationConfigRead)
def create_or_update_role(payload: RoleCreate) -> dict[str, Any]:
    """Create a new role or update permissions for an existing role."""
    config = load_localization_config()
    roles = config.get("roles", [])

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

    config["roles"] = roles
    save_localization_config(config)
    return config


@router.delete("/roles/{role_id}", response_model=LocalizationConfigRead)
def delete_role(role_id: str) -> dict[str, Any]:
    """Delete a custom RBAC role (system roles cannot be deleted)."""
    config = load_localization_config()
    roles = config.get("roles", [])

    target = next((r for r in roles if r.get("id") == role_id), None)
    if not target:
        raise HTTPException(status_code=404, detail="Role not found")
    if target.get("is_system", False):
        raise HTTPException(status_code=400, detail="Built-in system roles cannot be deleted")

    config["roles"] = [r for r in roles if r.get("id") != role_id]
    save_localization_config(config)
    return config


@router.put("/config", response_model=LocalizationConfigRead)
def update_localization_config(payload: dict[str, Any]) -> dict[str, Any]:
    """Update localization and organization settings."""
    config = load_localization_config()
    config.update(payload)
    save_localization_config(config)
    return config
