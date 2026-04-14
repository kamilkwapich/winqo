from fastapi import APIRouter, Depends
from sqlmodel import Session, select
from uuid import UUID
from datetime import datetime, timezone
from app.db.session import get_session
from app.api.tenant_deps import require_tenant
from app.db.models import UserSettings
from pydantic import BaseModel

router = APIRouter(prefix="/settings", tags=["Settings"])

class SettingsResponse(BaseModel):
    systems: list[str]
    glass_types: list[str]
    profile_colors: list[str]
    handle_colors: list[str]

class SettingsUpdate(BaseModel):
    systems: list[str] | None = None
    glass_types: list[str] | None = None
    profile_colors: list[str] | None = None
    handle_colors: list[str] | None = None

@router.get("", response_model=SettingsResponse)
def get_settings(
    session: Session = Depends(get_session),
    tenant_id: UUID = Depends(require_tenant)
):
    """Get user settings for systems, glass types, profile colors, and handle colors"""
    stmt = select(UserSettings).where(UserSettings.tenant_id == tenant_id)
    settings = session.exec(stmt).first()
    
    if not settings:
        # Return defaults if no settings exist
        return SettingsResponse(
            systems=["Gealan Linear MD", "Aluron ASH 80", "Aluron AS70", "Aluprof MB-79", "Salamander BE 82 MD", "Rehau Synego", "Veka Softline 82", "Aluplast Ideal 8000"],
            glass_types=["4/16/4 Float", "4/16/4 Low-E", "4/16/4/16/4 Triple", "33.1/16/4 Bezpieczne"],
            profile_colors=["Biały", "Brązowy", "Antracyt", "Złoty dąb", "Winchester", "Srebrny", "Zielony"],
            handle_colors=["Biały", "Srebrny", "Złoty połysk", "Stare złoto", "Brązowy", "Antracyt"]
        )
    
    return SettingsResponse(
        systems=settings.systems,
        glass_types=settings.glass_types,
        profile_colors=settings.profile_colors,
        handle_colors=settings.handle_colors or []
    )

@router.put("", response_model=SettingsResponse)
def update_settings(
    body: SettingsUpdate,
    session: Session = Depends(get_session),
    tenant_id: UUID = Depends(require_tenant)
):
    """Update user settings"""
    stmt = select(UserSettings).where(UserSettings.tenant_id == tenant_id)
    settings = session.exec(stmt).first()
    
    if not settings:
        # Create new settings
        settings = UserSettings(
            tenant_id=tenant_id,
            systems=body.systems or [],
            glass_types=body.glass_types or [],
            profile_colors=body.profile_colors or [],
            handle_colors=body.handle_colors or ["Biały", "Srebrny", "Złoty połysk", "Stare złoto"]
        )
        session.add(settings)
    else:
        # Update existing settings
        if body.systems is not None:
            settings.systems = body.systems
        if body.glass_types is not None:
            settings.glass_types = body.glass_types
        if body.profile_colors is not None:
            settings.profile_colors = body.profile_colors
        if body.handle_colors is not None:
            settings.handle_colors = body.handle_colors
        settings.updated_at = datetime.now(timezone.utc)
    
    session.commit()
    session.refresh(settings)
    
    return SettingsResponse(
        systems=settings.systems,
        glass_types=settings.glass_types,
        profile_colors=settings.profile_colors,
        handle_colors=settings.handle_colors or []
    )
