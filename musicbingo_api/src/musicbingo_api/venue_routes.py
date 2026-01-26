"""FastAPI routes for Venue CRUD operations.

Provides REST endpoints for managing venues at /api/prep/venues.
"""

import os
import shutil
from pathlib import Path
from typing import Optional

from fastapi import APIRouter, File, HTTPException, UploadFile
from pydantic import BaseModel, Field

from . import venue_repository
from .database import DATA_DIR

# Logo storage directory
LOGOS_DIR = DATA_DIR / "logos"


# Request/Response schemas
class VenueCreate(BaseModel):
    """Request to create a venue."""

    name: str = Field(..., min_length=1, max_length=200)
    contact_info: Optional[str] = Field(None, max_length=500)


class VenueUpdate(BaseModel):
    """Request to update a venue."""

    name: str = Field(..., min_length=1, max_length=200)
    contact_info: Optional[str] = Field(None, max_length=500)


class VenueResponse(BaseModel):
    """Venue response."""

    id: int
    name: str
    logo_path: Optional[str] = None
    contact_info: Optional[str] = None
    created_at: str
    updated_at: str


class VenueListResponse(BaseModel):
    """Response listing all venues."""

    venues: list[VenueResponse]


class ErrorResponse(BaseModel):
    """Error response."""

    error: str
    detail: Optional[str] = None


# Router
router = APIRouter(prefix="/api/prep", tags=["venues"])


def venue_to_response(venue) -> VenueResponse:
    """Convert Venue dataclass to response schema."""
    return VenueResponse(
        id=venue.id,
        name=venue.name,
        logo_path=venue.logo_path,
        contact_info=venue.contact_info,
        created_at=venue.created_at.isoformat() if venue.created_at else "",
        updated_at=venue.updated_at.isoformat() if venue.updated_at else "",
    )


@router.get(
    "/venues",
    response_model=VenueListResponse,
)
async def list_venues():
    """List all venues.

    Returns list of venues ordered by name.
    """
    venues = venue_repository.list_venues()
    return VenueListResponse(venues=[venue_to_response(v) for v in venues])


@router.get(
    "/venues/{venue_id}",
    response_model=VenueResponse,
    responses={404: {"model": ErrorResponse}},
)
async def get_venue(venue_id: int):
    """Get a single venue by ID."""
    venue = venue_repository.get_venue(venue_id)
    if venue is None:
        raise HTTPException(status_code=404, detail=f"Venue {venue_id} not found")
    return venue_to_response(venue)


@router.post(
    "/venues",
    response_model=VenueResponse,
    status_code=201,
    responses={400: {"model": ErrorResponse}},
)
async def create_venue(request: VenueCreate):
    """Create a new venue.

    Creates a venue with the given name and optional contact info.
    Logo can be uploaded separately via POST /venues/{id}/logo.
    """
    try:
        venue = venue_repository.create_venue(
            name=request.name,
            contact_info=request.contact_info,
        )
        return venue_to_response(venue)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.put(
    "/venues/{venue_id}",
    response_model=VenueResponse,
    responses={404: {"model": ErrorResponse}, 400: {"model": ErrorResponse}},
)
async def update_venue(venue_id: int, request: VenueUpdate):
    """Update a venue.

    Updates venue name and contact info. Logo is updated separately.
    """
    # Get existing venue to preserve logo_path
    existing = venue_repository.get_venue(venue_id)
    if existing is None:
        raise HTTPException(status_code=404, detail=f"Venue {venue_id} not found")

    try:
        venue = venue_repository.update_venue(
            venue_id=venue_id,
            name=request.name,
            logo_path=existing.logo_path,  # Preserve existing logo
            contact_info=request.contact_info,
        )
        return venue_to_response(venue)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete(
    "/venues/{venue_id}",
    status_code=204,
    responses={404: {"model": ErrorResponse}},
)
async def delete_venue(venue_id: int):
    """Delete a venue.

    Cascades to delete associated venue nights and games.
    Also deletes the logo file if present.
    """
    # Get venue to check logo path before deletion
    venue = venue_repository.get_venue(venue_id)
    if venue is None:
        raise HTTPException(status_code=404, detail=f"Venue {venue_id} not found")

    # Delete logo file if exists
    if venue.logo_path:
        logo_file = Path(venue.logo_path)
        if logo_file.exists():
            try:
                logo_file.unlink()
            except Exception:
                pass  # Ignore file deletion errors

    # Delete venue from database
    deleted = venue_repository.delete_venue(venue_id)
    if not deleted:
        raise HTTPException(status_code=404, detail=f"Venue {venue_id} not found")

    return None


@router.post(
    "/venues/{venue_id}/logo",
    response_model=VenueResponse,
    responses={404: {"model": ErrorResponse}, 400: {"model": ErrorResponse}},
)
async def upload_venue_logo(venue_id: int, file: UploadFile = File(...)):
    """Upload a logo for a venue.

    Accepts image files (JPEG, PNG, GIF, WebP).
    Saves to musicbingo_api/data/logos/{venue_id}_{filename}.
    Replaces existing logo if present.
    """
    # Check venue exists
    venue = venue_repository.get_venue(venue_id)
    if venue is None:
        raise HTTPException(status_code=404, detail=f"Venue {venue_id} not found")

    # Validate file type
    if file.content_type not in ["image/jpeg", "image/png", "image/gif", "image/webp"]:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file type '{file.content_type}'. Must be JPEG, PNG, GIF, or WebP.",
        )

    # Ensure logos directory exists
    LOGOS_DIR.mkdir(parents=True, exist_ok=True)

    # Delete old logo if exists
    if venue.logo_path:
        old_logo = Path(venue.logo_path)
        if old_logo.exists():
            try:
                old_logo.unlink()
            except Exception:
                pass

    # Generate new filename: {venue_id}_{original_filename}
    # Sanitize filename to prevent path traversal
    safe_filename = os.path.basename(file.filename or "logo.png")
    new_filename = f"{venue_id}_{safe_filename}"
    logo_path = LOGOS_DIR / new_filename

    # Save file
    try:
        with open(logo_path, "wb") as f:
            shutil.copyfileobj(file.file, f)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to save logo: {e}")

    # Update venue with logo path
    updated_venue = venue_repository.update_venue_logo(venue_id, str(logo_path))
    if updated_venue is None:
        raise HTTPException(status_code=404, detail=f"Venue {venue_id} not found")

    return venue_to_response(updated_venue)
