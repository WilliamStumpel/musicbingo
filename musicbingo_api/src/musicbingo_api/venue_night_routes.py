"""FastAPI routes for VenueNight CRUD operations.

Provides REST endpoints for managing venue nights at /api/prep/nights.
"""

from typing import Optional

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field


from . import venue_night_repository


# Request/Response schemas
class VenueNightCreate(BaseModel):
    """Request to create a venue night."""

    venue_id: int = Field(..., description="ID of the venue")
    date: str = Field(..., description="Date in ISO format YYYY-MM-DD", pattern=r"^\d{4}-\d{2}-\d{2}$")
    notes: Optional[str] = Field(None, max_length=1000)


class VenueNightUpdate(BaseModel):
    """Request to update a venue night."""

    venue_id: int = Field(..., description="ID of the venue")
    date: str = Field(..., description="Date in ISO format YYYY-MM-DD", pattern=r"^\d{4}-\d{2}-\d{2}$")
    status: str = Field(..., description="Status: draft, ready, or completed")
    notes: Optional[str] = Field(None, max_length=1000)


class VenueNightResponse(BaseModel):
    """Venue night response."""

    id: int
    venue_id: int
    venue_name: str
    date: str
    status: str
    notes: Optional[str] = None
    game_count: int
    created_at: str
    updated_at: str


class VenueNightListResponse(BaseModel):
    """Response listing all venue nights."""

    nights: list[VenueNightResponse]


class ErrorResponse(BaseModel):
    """Error response."""

    error: str
    detail: Optional[str] = None


# Router
router = APIRouter(prefix="/api/prep", tags=["venue_nights"])


def night_to_response(night: dict) -> VenueNightResponse:
    """Convert venue night dict to response schema."""
    return VenueNightResponse(
        id=night["id"],
        venue_id=night["venue_id"],
        venue_name=night["venue_name"],
        date=night["date"],
        status=night["status"],
        notes=night["notes"],
        game_count=night["game_count"],
        created_at=night["created_at"],
        updated_at=night["updated_at"],
    )


@router.get(
    "/nights",
    response_model=VenueNightListResponse,
)
async def list_venue_nights(venue_id: Optional[int] = Query(None, description="Filter by venue ID")):
    """List all venue nights.

    Returns list of venue nights ordered by date (newest first).
    Optional venue_id query param to filter by venue.
    """
    nights = venue_night_repository.list_venue_nights(venue_id=venue_id)
    return VenueNightListResponse(nights=[night_to_response(n) for n in nights])


@router.get(
    "/nights/{night_id}",
    response_model=VenueNightResponse,
    responses={404: {"model": ErrorResponse}},
)
async def get_venue_night(night_id: int):
    """Get a single venue night by ID."""
    night = venue_night_repository.get_venue_night(night_id)
    if night is None:
        raise HTTPException(status_code=404, detail=f"Venue night {night_id} not found")
    return night_to_response(night)


@router.post(
    "/nights",
    response_model=VenueNightResponse,
    status_code=201,
    responses={400: {"model": ErrorResponse}},
)
async def create_venue_night(request: VenueNightCreate):
    """Create a new venue night.

    Creates a venue night with draft status.
    """
    try:
        night = venue_night_repository.create_venue_night(
            venue_id=request.venue_id,
            date=request.date,
            notes=request.notes,
        )
        return night_to_response(night)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.put(
    "/nights/{night_id}",
    response_model=VenueNightResponse,
    responses={404: {"model": ErrorResponse}, 400: {"model": ErrorResponse}},
)
async def update_venue_night(night_id: int, request: VenueNightUpdate):
    """Update a venue night.

    Updates venue, date, status, and notes.
    """
    try:
        night = venue_night_repository.update_venue_night(
            venue_night_id=night_id,
            venue_id=request.venue_id,
            date=request.date,
            status=request.status,
            notes=request.notes,
        )
        if night is None:
            raise HTTPException(status_code=404, detail=f"Venue night {night_id} not found")
        return night_to_response(night)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete(
    "/nights/{night_id}",
    status_code=204,
    responses={404: {"model": ErrorResponse}},
)
async def delete_venue_night(night_id: int):
    """Delete a venue night.

    Cascades to delete associated games.
    """
    deleted = venue_night_repository.delete_venue_night(night_id)
    if not deleted:
        raise HTTPException(status_code=404, detail=f"Venue night {night_id} not found")
    return None
