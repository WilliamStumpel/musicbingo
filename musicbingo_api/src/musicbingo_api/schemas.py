"""Pydantic schemas for API request/response models."""

from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from .models import GameStatus, PatternType


class SongSchema(BaseModel):
    """Schema for song data."""

    model_config = ConfigDict(from_attributes=True)

    song_id: UUID
    title: str
    artist: str
    album: Optional[str] = None
    duration_seconds: Optional[int] = None


class CreateGameRequest(BaseModel):
    """Request to create a new game."""

    game_id: UUID
    playlist: list[SongSchema] = Field(..., min_length=24)
    pattern: PatternType = PatternType.FIVE_IN_A_ROW


class CreateGameResponse(BaseModel):
    """Response from creating a game."""

    game_id: UUID
    status: GameStatus
    playlist_size: int
    pattern: PatternType
    created_at: datetime


class CardPositionSchema(BaseModel):
    """Schema for a card's song positions."""

    card_id: UUID
    game_id: UUID
    card_number: int
    song_positions: dict[UUID, tuple[int, int]]


class AddCardRequest(BaseModel):
    """Request to add a card to a game."""

    card_id: UUID
    card_number: int
    song_positions: dict[UUID, tuple[int, int]] = Field(
        ..., description="Map of song_id to (row, col) position"
    )


class AddCardResponse(BaseModel):
    """Response from adding a card."""

    success: bool
    card_id: UUID
    game_id: UUID
    card_number: int


class BulkAddCardsRequest(BaseModel):
    """Request to add multiple cards to a game."""

    cards: list[AddCardRequest] = Field(..., min_length=1, description="List of cards to add")


class BulkAddCardsResponse(BaseModel):
    """Response from bulk adding cards."""

    success: bool
    game_id: UUID
    cards_added: int
    cards: list[dict] = Field(default_factory=list, description="List of added card info")


class StartGameRequest(BaseModel):
    """Request to start a game."""

    pass  # No additional fields needed


class StartGameResponse(BaseModel):
    """Response from starting a game."""

    game_id: UUID
    status: GameStatus
    card_count: int


class RecordSongRequest(BaseModel):
    """Request to record a played song."""

    song_id: UUID


class RecordSongResponse(BaseModel):
    """Response from recording a song."""

    game_id: UUID
    song_id: UUID
    total_played: int
    updated_at: datetime


class GameStateResponse(BaseModel):
    """Response with game state information."""

    game_id: UUID
    status: GameStatus
    playlist_size: int
    played_songs: list[UUID]
    played_count: int
    current_pattern: PatternType
    card_count: int
    created_at: datetime
    updated_at: datetime


class VerifyCardResponse(BaseModel):
    """Response from card verification."""

    winner: bool
    pattern: Optional[PatternType] = None
    card_number: int
    card_id: UUID
    game_id: UUID


class ErrorResponse(BaseModel):
    """Error response."""

    error: str
    detail: Optional[str] = None


class GameListItem(BaseModel):
    """Item in game list response."""

    filename: str
    game_id: str
    name: str
    song_count: int
    card_count: int


class GameListResponse(BaseModel):
    """Response from listing available games."""

    games: list[GameListItem]


class LoadGameResponse(BaseModel):
    """Response from loading a game file."""

    game_id: UUID
    name: str
    status: GameStatus
    card_count: int
