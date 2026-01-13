"""Main FastAPI application for Music Bingo API."""

from uuid import UUID

from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from .game_service import get_game_service
from .models import CardData, PatternType, Song
from .schemas import (
    AddCardRequest,
    AddCardResponse,
    CreateGameRequest,
    CreateGameResponse,
    ErrorResponse,
    GameStateResponse,
    RecordSongRequest,
    RecordSongResponse,
    StartGameRequest,
    StartGameResponse,
    VerifyCardResponse,
)

app = FastAPI(
    title="Music Bingo API",
    description="Backend API for Music Bingo game management and verification",
    version="0.1.0",
)

# Enable CORS for web clients
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "name": "Music Bingo API",
        "version": "0.1.0",
        "docs": "/docs",
    }


@app.get("/health")
async def health():
    """Health check endpoint."""
    return {"status": "healthy"}


@app.post(
    "/api/game/start",
    response_model=CreateGameResponse,
    status_code=status.HTTP_201_CREATED,
    responses={400: {"model": ErrorResponse}},
)
async def create_game(request: CreateGameRequest):
    """Create a new game session.

    This creates a game in SETUP status. Add cards, then call POST /api/game/{game_id}/activate
    to start playing.
    """
    try:
        service = get_game_service()

        # Convert schema to domain models
        playlist = [
            Song(
                song_id=s.song_id,
                title=s.title,
                artist=s.artist,
                album=s.album,
                duration_seconds=s.duration_seconds,
            )
            for s in request.playlist
        ]

        game = service.create_game(
            game_id=request.game_id,
            playlist=playlist,
            pattern=request.pattern,
        )

        return CreateGameResponse(
            game_id=game.game_id,
            status=game.status,
            playlist_size=len(game.playlist),
            pattern=game.current_pattern,
            created_at=game.created_at,
        )

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post(
    "/api/game/{game_id}/card",
    response_model=AddCardResponse,
    responses={400: {"model": ErrorResponse}, 404: {"model": ErrorResponse}},
)
async def add_card(game_id: UUID, request: AddCardRequest):
    """Add a card to a game.

    Cards must be added before activating the game.
    """
    try:
        service = get_game_service()

        card = CardData(
            card_id=request.card_id,
            game_id=game_id,
            card_number=request.card_number,
            song_positions=request.song_positions,
        )

        service.add_card(game_id, card)

        return AddCardResponse(
            success=True,
            card_id=card.card_id,
            game_id=game_id,
            card_number=request.card_number,
        )

    except ValueError as e:
        if "not found" in str(e).lower():
            raise HTTPException(status_code=404, detail=str(e))
        raise HTTPException(status_code=400, detail=str(e))


@app.post(
    "/api/game/{game_id}/activate",
    response_model=StartGameResponse,
    responses={400: {"model": ErrorResponse}, 404: {"model": ErrorResponse}},
)
async def activate_game(game_id: UUID):
    """Activate a game to start playing.

    Game must have cards added before activation.
    """
    try:
        service = get_game_service()
        game = service.start_game(game_id)

        return StartGameResponse(
            game_id=game.game_id,
            status=game.status,
            card_count=len(game.cards),
        )

    except ValueError as e:
        if "not found" in str(e).lower():
            raise HTTPException(status_code=404, detail=str(e))
        raise HTTPException(status_code=400, detail=str(e))


@app.post(
    "/api/game/{game_id}/song-played",
    response_model=RecordSongResponse,
    responses={400: {"model": ErrorResponse}, 404: {"model": ErrorResponse}},
)
async def record_played_song(game_id: UUID, request: RecordSongRequest):
    """Record a song as played in the game.

    This updates the game state and affects card verification results.
    """
    try:
        service = get_game_service()
        game = service.record_played_song(game_id, request.song_id)

        return RecordSongResponse(
            game_id=game.game_id,
            song_id=request.song_id,
            total_played=len(game.played_songs),
            updated_at=game.updated_at,
        )

    except ValueError as e:
        if "not found" in str(e).lower():
            raise HTTPException(status_code=404, detail=str(e))
        raise HTTPException(status_code=400, detail=str(e))


@app.get(
    "/api/game/{game_id}/state",
    response_model=GameStateResponse,
    responses={404: {"model": ErrorResponse}},
)
async def get_game_state(game_id: UUID):
    """Get current state of a game.

    Returns game status, played songs, pattern, and other state information.
    """
    service = get_game_service()
    game = service.get_game(game_id)

    if game is None:
        raise HTTPException(status_code=404, detail=f"Game {game_id} not found")

    return GameStateResponse(
        game_id=game.game_id,
        status=game.status,
        playlist_size=len(game.playlist),
        played_songs=game.played_songs,
        played_count=len(game.played_songs),
        current_pattern=game.current_pattern,
        card_count=len(game.cards),
        created_at=game.created_at,
        updated_at=game.updated_at,
    )


@app.get(
    "/api/verify/{game_id}/{card_id}",
    response_model=VerifyCardResponse,
    responses={404: {"model": ErrorResponse}},
)
async def verify_card(game_id: UUID, card_id: UUID):
    """Verify if a card is a winner.

    Checks the card's songs against played songs and current winning pattern.
    Returns winner status, pattern (if winner), and card number.

    This is the main endpoint used by the QR verification app.
    """
    try:
        service = get_game_service()
        is_winner, pattern, card_number = service.verify_card(game_id, card_id)

        return VerifyCardResponse(
            winner=is_winner,
            pattern=pattern,
            card_number=card_number,
            card_id=card_id,
            game_id=game_id,
        )

    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@app.post(
    "/api/game/{game_id}/pattern",
    response_model=GameStateResponse,
    responses={400: {"model": ErrorResponse}, 404: {"model": ErrorResponse}},
)
async def set_pattern(game_id: UUID, pattern: PatternType):
    """Change the winning pattern for a game."""
    try:
        service = get_game_service()
        game = service.set_pattern(game_id, pattern)

        return GameStateResponse(
            game_id=game.game_id,
            status=game.status,
            playlist_size=len(game.playlist),
            played_songs=game.played_songs,
            played_count=len(game.played_songs),
            current_pattern=game.current_pattern,
            card_count=len(game.cards),
            created_at=game.created_at,
            updated_at=game.updated_at,
        )

    except ValueError as e:
        if "not found" in str(e).lower():
            raise HTTPException(status_code=404, detail=str(e))
        raise HTTPException(status_code=400, detail=str(e))


@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    """Global exception handler for unhandled errors."""
    return JSONResponse(
        status_code=500,
        content={"error": "Internal server error", "detail": str(exc)},
    )
