"""FastAPI routes for Game CRUD operations.

Provides REST endpoints for managing bingo games within venue nights.
All routes are prefixed with /api/prep/games.
"""

import json
from typing import Optional

from fastapi import APIRouter, File, HTTPException, UploadFile
from pydantic import BaseModel, Field

from . import game_repository

router = APIRouter(prefix="/api/prep/games", tags=["games"])


# =============================================================================
# Request/Response Models
# =============================================================================


class SongItem(BaseModel):
    """Song in a playlist."""
    song_id: str
    title: str
    artist: str


class GameCreate(BaseModel):
    """Request body for creating a game."""
    venue_night_id: int = Field(..., description="ID of the venue night")
    name: str = Field(..., min_length=1, max_length=200, description="Game name")
    playlist: list[SongItem] = Field(..., description="Playlist of songs")
    card_count: int = Field(50, ge=1, le=1000, description="Number of cards to generate")


class GameUpdate(BaseModel):
    """Request body for updating a game."""
    name: str = Field(..., min_length=1, max_length=200, description="Game name")
    playlist: list[SongItem] = Field(..., description="Playlist of songs")
    card_count: int = Field(..., ge=1, le=1000, description="Number of cards to generate")
    sort_order: int = Field(0, ge=0, description="Sort order within the venue night")


class GameResponse(BaseModel):
    """Response for a single game."""
    id: int
    venue_night_id: int
    name: str
    playlist: list[SongItem]
    song_count: int
    card_count: int
    pdf_path: Optional[str]
    game_uuid: str
    sort_order: int
    created_at: str
    updated_at: str
    night_date: str
    venue_name: str


class GameListItem(BaseModel):
    """Item in the games list (without full playlist)."""
    id: int
    venue_night_id: int
    name: str
    song_count: int
    card_count: int
    pdf_path: Optional[str]
    game_uuid: str
    sort_order: int
    night_date: str
    venue_name: str


class GameListResponse(BaseModel):
    """Response for listing games."""
    games: list[GameListItem]


class ParseCSVResponse(BaseModel):
    """Response for parsing a CSV file."""
    songs: list[SongItem]
    song_count: int


# =============================================================================
# Routes
# =============================================================================


@router.get("", response_model=GameListResponse)
async def list_games(venue_night_id: Optional[int] = None):
    """List all games, optionally filtered by venue night.

    Args:
        venue_night_id: Optional filter by venue night ID.

    Returns:
        List of games with song count and PDF status.
    """
    games = game_repository.list_games(venue_night_id)
    # Convert to list items (without full playlist)
    items = [
        GameListItem(
            id=g["id"],
            venue_night_id=g["venue_night_id"],
            name=g["name"],
            song_count=g["song_count"],
            card_count=g["card_count"],
            pdf_path=g["pdf_path"],
            game_uuid=g["game_uuid"],
            sort_order=g["sort_order"],
            night_date=g["night_date"],
            venue_name=g["venue_name"],
        )
        for g in games
    ]
    return GameListResponse(games=items)


@router.get("/{game_id}", response_model=GameResponse)
async def get_game(game_id: int):
    """Get a single game by ID with full playlist.

    Args:
        game_id: The game ID.

    Returns:
        Game details including parsed playlist.
    """
    game = game_repository.get_game(game_id)
    if game is None:
        raise HTTPException(status_code=404, detail=f"Game {game_id} not found")
    return GameResponse(**game)


@router.post("", response_model=GameResponse, status_code=201)
async def create_game(request: GameCreate):
    """Create a new game.

    Args:
        request: Game creation data including name, playlist, and card count.

    Returns:
        Created game with ID.
    """
    try:
        playlist_json = json.dumps([s.model_dump() for s in request.playlist])
        game = game_repository.create_game(
            venue_night_id=request.venue_night_id,
            name=request.name,
            playlist_json=playlist_json,
            card_count=request.card_count,
        )
        return GameResponse(**game)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.put("/{game_id}", response_model=GameResponse)
async def update_game(game_id: int, request: GameUpdate):
    """Update an existing game.

    Args:
        game_id: The game ID.
        request: Updated game data.

    Returns:
        Updated game.
    """
    try:
        playlist_json = json.dumps([s.model_dump() for s in request.playlist])
        game = game_repository.update_game(
            game_id=game_id,
            name=request.name,
            playlist_json=playlist_json,
            card_count=request.card_count,
            sort_order=request.sort_order,
        )
        if game is None:
            raise HTTPException(status_code=404, detail=f"Game {game_id} not found")
        return GameResponse(**game)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/{game_id}")
async def delete_game(game_id: int):
    """Delete a game.

    Args:
        game_id: The game ID.

    Returns:
        Success status.
    """
    deleted = game_repository.delete_game(game_id)
    if not deleted:
        raise HTTPException(status_code=404, detail=f"Game {game_id} not found")
    return {"success": True, "message": f"Game {game_id} deleted"}


@router.post("/parse-csv", response_model=ParseCSVResponse)
async def parse_csv(file: UploadFile = File(...)):
    """Parse an Exportify CSV file and return playlist.

    This endpoint allows previewing the parsed playlist before saving a game.

    Args:
        file: CSV file upload.

    Returns:
        Parsed playlist with song IDs.
    """
    if not file.filename or not file.filename.lower().endswith('.csv'):
        raise HTTPException(status_code=400, detail="File must be a CSV file")

    try:
        content = await file.read()
        csv_content = content.decode('utf-8')
    except UnicodeDecodeError:
        raise HTTPException(status_code=400, detail="File must be UTF-8 encoded")

    try:
        songs = game_repository.parse_csv_to_playlist(csv_content)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    if len(songs) < 24:
        raise HTTPException(
            status_code=400,
            detail=f"Playlist has {len(songs)} songs, but at least 24 are required for bingo cards"
        )

    return ParseCSVResponse(
        songs=[SongItem(**s) for s in songs],
        song_count=len(songs),
    )
